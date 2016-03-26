"use strict"

var transcripts = {};
var matches = {};
var masterscript;
var transcript, match, curid;
var nw;
var trackchange = false;
var aligned = false;
var printall_selected = null;

$(window).load(
		function() {
			$("#btn-align").bootstrapSwitch();
			$("#btn-trackchange").bootstrapSwitch();

			$('#btn-align').on('switchChange.bootstrapSwitch',
					function(event, state) {
						aligned = state;
						reprint();
					});

			$('#btn-trackchange').on('switchChange.bootstrapSwitch',
					function(event, state) {
						trackchange = state;
						reprint();
					});

			loadMasterscript('audio_test.json');
			nw = new NeedlemanWunsch();

			// load transcripts
			loadTranscript('Take1.json');
			loadTranscript('Take2.json');
			loadTranscript('Take3.json');
			loadTranscript('Take4.json');
			addNewTranscriptTab();
			addAllTranscriptTab();

			// Assign right-click menu
			$('body').click(function() {
				$('#contextEditMenu').hide();
			});

			// Turn on tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// Connect to IBM Speech-to-Text Service
			var IBMSpeech = new IBMSpeech2TextService();

			// Record button
			var audio = document.getElementById('tran-audio-player');
			document.getElementById('record-btn').addEventListener('click',
					function() {
						clickRecord(IBMSpeech, this, audio);
					});

		});

function computeMatch(script1, script2) {
	nw.setScripts(script1, script2);
	return nw.align();
};

function xhrSuccess() {
	this.callback.apply(this, this.arguments);
};

function xhrError() {
	console.error(this.statusText);
};

function loadFile(sURL, fCallback, viewport) {
	var oReq = new XMLHttpRequest();
	oReq.callback = fCallback;
	oReq.arguments = Array.prototype.slice.call(arguments, 2);
	oReq.onload = xhrSuccess;
	oReq.onerror = xhrError;
	oReq.open("get", sURL, true);
	oReq.send(null);
};

function loadScriptFromTextFile(filename, viewport) {
	loadFile(filename, assignTextScript, viewport);
};

function loadScriptFromJSONFile(filename, viewport) {
	loadFile(filename, assignJSONScript, viewport);
};

function assignTextScript(viewport) {
	var script = new Script();
	script.initFromText(this.responseText);
	viewport.append(script.getSpans())
};

function assignJSONScript(viewport) {
	var script = new Script();
	script.initFromAudio(this.responseText);
	viewport.append(script.getSpans())
};

function loadMasterscript(filename) {
	var request = new XMLHttpRequest();
	request.open("GET", filename, false);
	request.send(null);
	masterscript = new Script();
	masterscript.initFromText(request.responseText);
};

function loadTranscript(filename) {
	var request = new XMLHttpRequest();
	request.open("GET", filename, false);
	request.send(null);

	var id = filename.split('.')[0];

	var trans = new Script();
	trans.initFromAudio_old(request.responseText, null);
	transcripts[id] = trans;

	matches[id] = computeMatch(masterscript, trans);
	// add new tab
	addTranscriptTab(id)
	// add new panel
	addTranscriptPanel(id, trans, matches[id]);
};

function addAllTranscriptTab() {
	var id = "All";
	var ul = $('#transcript-tabs');
	ul.children("[role='presentation']").each(function() {
		$(this).removeClass('active');
	});

	var li = elem("<li/>", {
		"role" : "presentation",
		"class" : "active",
		"onclick" : "printAllTranscriptView()",
		"data-transcript" : id
	}, elem("<a/>", {
		'href' : '#' + id,
		'aria-controls' : id,
		'role' : 'tab',
		'data-toggle' : 'tab'
	}, id));
	ul.append(li);

	addTranscriptPanel(id);
	transcripts[id] = "All";
	transcript = transcripts[id];
	printAllTranscriptView();
};

function addNewTranscriptTab() {
	var id = "New";
	var ul = $('#transcript-tabs');
	ul.children("[role='presentation']").each(function() {
		$(this).removeClass('active');
	});

	var li = elem("<li/>", {
		// "role" : "presentation",
		// "class" : "active",
		"onclick" : "addNewTranscript(this)",
		"data-transcript" : id
	}, elem("<a/>", {
	// 'href' : '#' + id,
	// 'aria-controls' : id,
	// 'role' : 'tab',
	// 'data-toggle' : 'tab'
	}, '+'));
	ul.append(li);

	addTranscriptPanel(id);
};

function addTranscriptTab(id) {
	var ul = $('#transcript-tabs');
	ul.children("[role='presentation']").each(function() {
		$(this).removeClass('active');
	});

	var li = elem("<li/>", {
		"role" : "presentation",
		"class" : "active",
		"onclick" : "selectTranscript(this)",
		"data-transcript" : id
	}, elem("<a/>", {
		'href' : '#' + id,
		'aria-controls' : id,
		'role' : 'tab',
		'data-toggle' : 'tab'
	}, id));
	ul.append(li);
};

function addTranscriptPanel(filename, transcript, mtc) {
	var contentdiv = $('#transcript-content');
	var content = transcript ? transcript.getSpans() : null;

	contentdiv.children("[role='tabpanel']").each(function() {
		$(this).removeClass('active');
	});

	var d = div({
		'role' : 'tabpanel',
		'class' : 'row tab-pane active',
		'id' : filename
	});
	// d.append(div({
	// 'class' : 'col-md-1 seg-btn'
	// }, null));
	//
	// d.append(div({
	// 'class' : 'col-md-11 seg-txt'
	// }, content));

	contentdiv.append(d);
};

function selectTranscript(li) {
	printall_selected = null;
	$("#btn-align").bootstrapSwitch('disabled', false);
	var id = li.getAttribute('data-transcript')
	transcript = transcripts[id];
	match = matches[id];
	curid = id;
	var aligned = $('#btn-align').bootstrapSwitch('state');
	if (aligned) {
		printAlignedScripts();
	} else {
		printUnalignedScripts();
	}

};

function addNewTranscript(li) {
	// add a tab next to it and make it active
	var id = "Take" + (Object.keys(transcripts).length);
	var newli = elem("<li/>", {
		"role" : "presentation",
		"class" : "active",
		"onclick" : "selectTranscript(this)",
		"data-transcript" : id
	}, elem("<a/>", {
		'href' : '#' + id,
		'aria-controls' : id,
		'role' : 'tab',
		'data-toggle' : 'tab'
	}, id));

	$(li).before(newli);
	addTranscriptPanel(id);
	var trans = new Script();
	transcripts[id] = trans;

	// Make the new tab active
	var ul = $('#transcript-tabs');
	ul.children("[role='presentation']").each(function() {
		$(this).removeClass('active');
	});
	newli.addClass('active');

	matches[id] = computeMatch(masterscript, trans);
	selectTranscript(newli[0]);

};

function changeTranscript() {
	var filename = document.getElementById("transcript_file").value;
	loadTranscript(filename);
	var td = $('#script-texts-row td:nth-child(2)');
	td.empty();
	var d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn'
	}, null));
	d.append(div({
		'class' : 'col-md-11 seg-txt'
	}, transcript.getSpans()));
	td.append(d);
};
