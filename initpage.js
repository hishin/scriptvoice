"use strict"
var masterscript = null;
var transcript = null;
var segmenter = null;
var match = null;
var sortable = false;

function loadTranscript() {
	var filename = document.getElementById("transcript_file").value;
	var request = new XMLHttpRequest();
	request.open("GET", filename, false);
	request.send(null);
	transcript = new Script();
	transcript.initFromAudio(request.responseText, null);
	reinit();
};

function loadMasterscript() {
	var filename = document.getElementById("masterscript_file").value;
	var request = new XMLHttpRequest();
	request.open("GET", filename, false);
	request.send(null);
	masterscript = new Script();
	masterscript.initFromText(request.responseText);
	reinit();
};

function reinit() {
	segmenter = null;
	match = null;
};

function showScriptTable() {
	$('#script-table tbody').empty();
	var trow = $("<tr/>");
	$('#script-table tbody:last').append(trow);
	var td = $("<td/>");
	td.addClass('col-md-6');
	td.attr('id', 'masterscript');
	trow.append(td);
	td = $("<td/>");
	td.attr('id', 'transcript');
	td.addClass('col-md-6');
	trow.append(td);

	if (sortable) {
		$('#script-table tbody').sortable('disable');
		$('#script-table tbody').enableSelection();
	}

	$('#btn-align').show();
	$('#btn-merge').hide();
};

function showMasterscript() {
	var msspan = masterscript.getSpans();
	$('#masterscript').empty().append(msspan);
	$('#masterscript').attr('contentEditable', true);
	document.getElementById("masterscript").addEventListener("keydown",
			saveEditNodes, false);
	document.getElementById("masterscript").addEventListener("keyup",
			editMasterscript, false);
	document.getElementById("masterscript").addEventListener("contextmenu",
			contextMasterscript, false);
};

function showTranscript() {
	loadTranscript();
	var tspan = transcript.getSpans();
	$('#transcript').empty().append(tspan);
};

function alignWords() {
	// Get from current script
	// Compute alignment of two texts
	masterscript = new Script();
	masterscript.initFromSpans($('#masterscript').children('span'));
	transcript = new Script();
	transcript.initFromSpans($('#transcript').children('span'));
	var pmatch = 1;
	var pmis = -2;
	var pgap = -1;
	var aligner = new NeedlemanWunsch(masterscript, transcript, pmatch, pmis,
			pgap);
	match = aligner.align();
};

function alignSegments() {
	// Compute word-to-word match
	alignWords();
	segmenter = new Segmenter(masterscript, transcript, match);
	segmenter.iterateSegment(2);
	var ms_segments = segmenter.getSrc1Segments();
	var t_segments = segmenter.getSrc2Segments();
	TextSegment.matchSegments(ms_segments, t_segments, match);
	printAlignedTextSegments('#script-table', ms_segments, t_segments, match);

	$('#btn-align').toggle();
	$('#btn-merge').toggle();
	$('#script-table tbody').sortable('enable');
	$('#script-table tbody').enableSelection();

	sortable = true;
};

function mergeSegments() {
	var cell_ids = getCheckedSegs('#script-table');
	masterscript = mergeSegs2Script(cell_ids);
	showScripts();
};

function showScripts() {
	showScriptTable();
	showMasterscript();
	showTranscript();
};

$(window).load(function() {

	loadTranscript();
	loadMasterscript();
	showScripts();

	// Assign right-click menu
	$('body').click(function() {
		$('#contextEditMenu').hide();
	});

	// Turn on tooltips
	$('[data-toggle="tooltip"]').tooltip();

	// Connect to IBM Speech-to-Text Service
	var IBMSpeech = new IBMSpeech2TextService();

	// Record button
	var audio = document.getElementById('audio-player');
	document.getElementById('record-btn').addEventListener('click', function() {
		clickRecord(IBMSpeech, this, audio);
	});

});