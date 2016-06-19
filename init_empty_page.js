"use strict"

var transcripts = {};
var audiosrcs = {};
var audioblobs = {};
var matches = {};
var recorders = {};
var masterscript, transcript, match, curid;
var msaudios = [];
var msblob;
var msaudiosrc;
var nw;
var trackchange = false;
var aligned = true;
var printall_selected = null;
var masterscript_playtime;
var transcript_playtime;

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

			masterscript = new Script();
//			loadMasterscriptFromJSON('uploads/masterscript_1460506373.json')
			// loadMasterscript('darkmatter.json');
			nw = new NeedlemanWunsch();

			// load transcripts

			addAllTranscriptTab();

			// Assign right-click menu
			$('body').click(function() {
				$('#contextEditMenu').hide();
			});

			$('#script-texts .masterscript-seg').contextmenu(function(evt) {
				contextMasterscript(evt);
			});

			// Turn on tooltips
			$('[data-toggle="tooltip"]').tooltip();

			// Record button
			var audio = document.getElementById('tran-audio-player');
			audio.addEventListener('loadedmetadata', function() {
				$('#audio-duration').text(
						'(' + audio.duration.toFixed(2) + 's)');
			}, false);

			document.getElementById('record-btn').addEventListener('click',
					function() {
						Script.saveCurrentMasterscript();
						clickRecord(this, audio);
					});

			$('#script-texts').on('keydown', function(event) {
				markNodes(event);
			});

			// Save button for masterscript
			document.getElementById('save-btn').addEventListener('click',
					function() {
				
						Script.saveCurrentMasterscript();
						clickSave();
						saveMasterscriptToServer(masterscript);
					});

			document.getElementById('refresh-btn').addEventListener('click',
					function() {
						Script.saveCurrentMasterscript();
						Script.saveMasterscriptAudio();
						realign();
						reprint();
					});
			
			
			var masterscriptaudio = document.getElementById("ms-audio-player");
			masterscriptaudio.oncanplay = function() {
				function updateMSTime() {
			        masterscript_playtime = masterscriptaudio.currentTime;
			        if (!masterscriptaudio.paused) {
			        	highlightCurrentMasterScriptWord();
			        }
			    }
			    setInterval(updateMSTime, 100);
			};
			
			var transcriptaudio = document.getElementById("tran-audio-player");
			transcriptaudio.oncanplay = function() {
				function updateTranTime() {
					transcript_playtime = transcriptaudio.currentTime;
					if (!transcriptaudio.paused)
						highlightCurrentTranscriptWord();
				}
				 setInterval(updateTranTime, 100);
			}

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

function loadMasterscriptFromJSON(filename) {
	$.getJSON(filename, function(data) {
		var newtoks = [];
		for (var temp = 0; temp < data.length; temp++) {
			console.log(data[temp].word);
			var t = Token.fromObject(data[temp]);
			newtoks.push(t);
		}
		masterscript.reset(newtoks);
		reprint();
		Script.saveCurrentMasterscript();
		
	});
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

function highlightCurrentMasterScriptWord() {
	var ms_spans = $('#script-texts .masterscript-seg span');
	ms_spans = ms_spans.filter(":visible");
	var span;
	for (var i = 0; i < ms_spans.length; i++) {
		span = $(ms_spans[i]);
		var startt = span.attr('data-ms-tstart');
		var endt = span.attr('data-ms-tend');
		if (startt <= masterscript_playtime && masterscript_playtime < endt) {
			span.addClass('highlightplaying');
		} else {
			span.removeClass('highlightplaying');
		}
	}
};

function highlightCurrentTranscriptWord() {
	var tran_spans = $('#script-texts .transcript-seg span');
	tran_spans = tran_spans.filter(":visible");
	var span;
	for (var i = 0; i < tran_spans.length; i++) {
		span = $(tran_spans[i]);
		var startt = span.attr('data-tstart');
		var endt = span.attr('data-tend');
		if (startt <= transcript_playtime && transcript_playtime <= endt) {
			span.addClass('highlightplaying');
		} else {
			span.removeClass('highlightplaying');
		}
	}
};

function playAudioFrom(start_sec, end_sec, audiofile) {
	var masteraudio = document.getElementById('ms-audio-player');
	masteraudio.pause();
	var audio = document.getElementById('tran-audio-player');
	audio.pause();
	if (curid == 'All') {
		var ablob = audioblobs[audiofile];
		audio.src = URL.createObjectURL(ablob);
	} else {
		audio.src = audiosrcs[curid];
	}
	if (end_sec == undefined)
		audio.src = audio.src+'#t=' + start_sec;
	else
		audio.src = audio.src + '#t=' + start_sec + ',' + end_sec;
	// audio.currentTime = Number(start_sec);
	// console.log(audio.currentTime);
	audio.play();
};

function playMasterscriptAudioFrom(start_sec) {
	var tranaudio = document.getElementById('tran-audio-player');
	tranaudio.pause();
	var audio = document.getElementById('ms-audio-player');
	var url = audio.src;
	audio.pause();
	audio.src = msaudiosrc + '#t=' + start_sec;
	console.log(audio.src);
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
