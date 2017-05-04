"use strict"

var transcripts = {};
var audiosrcs = {};
var audioblobs = {};
var matches = {};
var recorders = {};
var masterscript, transcript, match, curid;
var msaudios = [];
var msblob;
var nw;
var trackchange = false;
var aligned = true;
var printall_selected = null;

$(document).ready(function() {
    //toggle `popup` / `inline` mode
    $.fn.editable.defaults.mode = 'popup';     
    
    //make username editable
    $('#username').editable();
    
    //make status editable
    $('#status').editable({
        type: 'select',
        title: 'Select status',
        placement: 'right',
        value: 2,
        source: [
            {value: 1, text: 'status 1'},
            {value: 2, text: 'status 2'},
            {value: 3, text: 'status 3'}
        ]
        /*
        //uncomment these lines to send data on server
        ,pk: 1
        ,url: '/post'
        */
    });
});

$(window).load(
		function() {

			$("#btn-align").bootstrapSwitch();
			$("#btn-trackchange").bootstrapSwitch();

			$('#btn-align').on('switchChange.bootstrapSwitch',
					function(event, state) {
						Script.saveCurrentMasterscript();
						Script.saveMasterscriptAudio();
						realign();
						aligned = state;
						reprint();
					});

			$('#btn-trackchange').on('switchChange.bootstrapSwitch',
					function(event, state) {
						Script.saveCurrentMasterscript();
						Script.saveMasterscriptAudio();

						realign();
						trackchange = state;
						reprint();
					});

			loadMasterscript('outline.json');
			// masterscript = new Script();
			nw = new NeedlemanWunsch();

			// load transcripts
			addAllTranscriptTab();
			loadTranscript('take1.json', 'take1.wav');
			loadTranscript('take2.json', 'take2.wav');
			loadTranscript('take3.json', 'take3.wav');
			loadTranscript('take4.json', 'take4.wav');
			loadTranscript('take5.json', 'take5.wav');

			reprint();
			// Assign right-click menu
			$('body').click(function() {
				$('#contextEditMenu').hide();
			});

			$('#script-texts .masterscript-seg').contextmenu(function(evt) {
				contextMasterscript(evt);
			});

			// Turn on tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// // Connect to IBM Speech-to-Text Service
			// var IBMSpeech = new IBMSpeech2TextService();

			// Record button
			var audio = document.getElementById('tran-audio-player');
			audio.addEventListener('loadedmetadata', function() {
				$('#audio-duration').text(
						'(' + audio.duration.toFixed(2) + 's)');
			}, false);

			document.getElementById('record-btn').addEventListener('click',
					function() {
						clickRecord(this, audio);
					});

			$('#script-texts').on('keydown', function(event) {
				markNodes(event);
			});

			// Save button for masterscript
			document.getElementById('save-btn').addEventListener('click',
					function() {
						clickSave();
					});

			document.getElementById('refresh-btn').addEventListener('click',
					function() {
						Script.saveCurrentMasterscript();
						Script.saveMasterscriptAudio();
						realign();
						reprint();
					});
		});

function realign() {
	Object.keys(transcripts).forEach(function(key, index) {
		matches[key] = computeMatch(masterscript, transcripts[key]);
	});
};

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

function loadTranscript(filename, audiofilename) {
	var request = new XMLHttpRequest();
	request.open("GET", filename, false);
	request.send(null);

	var id = filename.split('.')[0];
	var trans = new Script();
	trans.initFromAudio(request.responseText, audiofilename);
	transcripts[id] = trans;

	matches[id] = computeMatch(masterscript, trans);
	// add new tab
	addTranscriptTab(id)
	// add new panel
	addTranscriptPanel(id, trans, matches[id]);
	// add audio src

	if (audiofilename) {
		var areq = new XMLHttpRequest();
		areq.open("GET", audiofilename, true);
		areq.responseType = "blob";

		areq.onload = function(oEvent) {
			var blob = areq.response;
			audioblobs[audiofilename] = blob;
			audiosrcs[id] = URL.createObjectURL(blob);
			console.log(audiofilename + " loaded.")
		};
		areq.send();
	}
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
		"onclick" : "selectAllTranscript()",
		"data-transcript" : id,
		'id' : 'all-transcript-tab'
	}, elem("<a/>", {
		'href' : '#' + id,
		'aria-controls' : id,
		'role' : 'tab',
		'data-toggle' : 'tab'
	}, id));
	ul.append(li);

	addTranscriptPanel(id);
	// transcripts[id] = "All";
	// transcript = transcripts[id];
	printAllTranscriptView();
};

function selectAllTranscript() {
	Script.saveCurrentMasterscript();
	Script.saveMasterscriptAudio();

	realign();
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
		"onclick" : "addNewTranscript()",
		"data-transcript" : id,
		'id' : 'new-transcript-tab'
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

	selectTranscript(li[0])
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

// TODO: bug in CHROME
function playAudioFrom(start_sec, end_sec, audiofile) {
	var audio = document.getElementById('tran-audio-player');
	audio.pause();
	if (curid == 'All') {
		console.log(audiofile);
		var ablob = audioblobs[audiofile];
		audio.src = URL.createObjectURL(ablob);
	} else {
		audio.src = audiosrcs[curid];
	}
	audio.src = audio.src + '#t=' + start_sec + ',' + end_sec;
	// audio.currentTime = Number(start_sec);
	// console.log(audio.currentTime);
	audio.play();
};

function selectTranscript(li) {
	printall_selected = null;
	Script.saveCurrentMasterscript();
	Script.saveMasterscriptAudio();

	realign();
	curid = li.getAttribute('data-transcript')
	transcript = transcripts[curid];
	match = matches[curid];

	var aligned = $('#btn-align').bootstrapSwitch('state');
	if (aligned) {
		printAlignedScripts();
	} else {
		printUnalignedScripts();
	}
	// var filename = audiosrcs[curid].replace(/^.*[\\\/]/, '')

	$('#tran-audio-player').attr('src', audiosrcs[curid]);

};

function addNewTranscript() {
	// add a tab next to it and make it active
	var id = "take" + (Object.keys(transcripts).length + 1);
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

	$('#all-transcript-tab').before(newli);
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
