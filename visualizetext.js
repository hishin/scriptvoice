"use strict"

function addDataMatch(spans, match) {
	var m = 0;
	for (var i = 0; i < spans.length; i++) {
		var span = spans[i];
		var iswhitespace = spans[i].attr('data-iswhitespace');
		if (iswhitespace == "true") {
			continue;
		} else if (iswhitespace == "" || iswhitespace == null) {
			continue;
		}
		if (match[m] >= 0)
			spans[i].attr('data-hasmatch', true);
		else
			spans[i].attr('data-hasmatch', false);
		m++;
	}
	return spans;
};

function addRadioButton(trow, rowspan, name, checked, selectid) {
	var td = $("<td/>");
	td.attr('rowspan', rowspan);
	td.addClass('text-center');
	td.append("<input type=\'radio\' name=\'" + name + "\' " + checked
			+ " value=\'" + selectid + "\' \>");
	trow.append(td);
	return td;
};

function elem(tagname, attrs, content) {
	var e = $(tagname);
	if (attrs) {
		for ( var key in attrs) {
			e.attr(key, attrs[key]);
		}
	}
	if (content)
		e.append(content);
	return e;
};

function div(attrs, content) {
	return elem("<div/>", attrs, content)
};

function useTranscriptSegBtn() {
	var btn = $("<i/>");
	btn.attr('class',
			'btn btn-circle glyphicon glyphicon-chevron-left use-icon');
	btn.attr('href', '#');
	btn.attr('data-toggle', "tooltip");
	btn.attr('data-placement', 'top');
	btn.attr('title', 'Accept');
	btn.click(function() {
		useTranscriptSegment($(this));
	});
	return btn;
};

function confirmTranscriptSegBtn() {
	var btn = $("<i/>");
	btn.attr('class',
			'btn btn-circle glyphicon glyphicon-unchecked confirm-icon');
	btn.attr('href', '#');
	btn.attr('data-state', 'confirm');
	btn.click(function() {
		confirmTranscriptSegment($(this));
	});
	return btn;
};

function useTranscriptSegment(icon) {
	var btndiv = icon.closest('div');
	var tr_start_idx = parseInt(btndiv.attr('data-seg-start-idx'));
	var tr_end_idx = parseInt(btndiv.attr('data-seg-end-idx'));
	var key = btndiv.attr('data-transcript-key');
	var useseg = new TextSegment(transcripts[key], tr_start_idx, tr_end_idx);

	var trtd = icon.closest('td');
	var mstd = trtd.siblings('.masterscript-seg').first();
	var mstxtdiv = $('#' + btndiv.attr('data-ms-div-id'));
	var msbtn = mstd.find('.seg-btn');

	var ms_start_idx = parseInt(mstxtdiv.attr('data-seg-start-idx'));
	var ms_end_idx = parseInt(mstxtdiv.attr('data-seg-end-idx'));

	// masterscript.replaceTokens(ms_start_idx, ms_end_idx, useseg.getTokens());

	mstxtdiv.empty().append(useseg.getSpan());
	if (mstxtdiv.hasClass('unmatched')) {
		mstxtdiv.removeClass('unmatched');
		toggleConfirmBtn(msbtn.find('i').first());
	}

	Script.saveMasterscriptAudio();
};

function confirmTranscriptSegment(icon) {
	var btndiv = icon.closest('div');
	var tr_start_idx = parseInt(btndiv.attr('data-seg-start-idx'));
	var tr_end_idx = parseInt(btndiv.attr('data-seg-end-idx'));
	var tr_ntokens = tr_end_idx - tr_start_idx + 1;

	var mstd = icon.closest('td');
	var mstxtdiv = mstd.find('.seg-txt');
	var ms_start_idx = parseInt(mstxtdiv.attr('data-seg-start-idx'));
	var ms_end_idx = parseInt(mstxtdiv.attr('data-seg-end-idx'));
	if (icon.attr('data-state') == 'confirm') {
		// insert tokens
		// var useseg = new TextSegment(transcript, tr_start_idx, tr_end_idx);
		// masterscript
		// .replaceTokens(ms_start_idx, ms_end_idx, useseg.getTokens());
		mstxtdiv.removeClass('unmatched');
	} else {
		// masterscript.removeTokens(ms_start_idx, ms_start_idx + tr_ntokens -
		// 1);
		mstxtdiv.addClass('unmatched');
	}
	toggleConfirmBtn(icon);
	Script.saveMasterscriptAudio();
};

function toggleConfirmBtn(icon) {
	if (icon.attr('data-state') == 'confirm') {
		icon.attr('class',
				'btn btn-circle glyphicon glyphicon-check confirm-icon');
		icon.attr('data-state', 'unconfirm');
	} else {
		icon.attr('class',
				'btn btn-circle glyphicon glyphicon-unchecked confirm-icon');
		icon.attr('data-state', 'confirm');
	}
};

function origMasterscriptSegBtn() {
	var btn = $("<i/>");
	btn
			.attr('class',
					'btn btn-circle glyphicon glyphicon-share-alt glyphicon-flip recover-icon');
	btn.attr('href', '#');
	btn.click(function() {
		recoverMasterscriptSegment($(this));
	});
	return btn;
};

function recoverMasterscriptSegment(icon) {
	console.log("recover");
	var btndiv = icon.closest('div');
	var start_idx = parseInt(btndiv.attr('data-seg-start-idx'));
	var end_idx = parseInt(btndiv.attr('data-seg-end-idx'));

	console.log(start_idx);
	console.log(end_idx);
	var msseg = new TextSegment(masterscript, start_idx, end_idx);

	var mstd = icon.closest('td');
	var mstxtdiv = mstd.find('.seg-txt');
	mstxtdiv.empty().append(msseg.getSpan());
};

function cell(attrs, content) {
	var e = $("<td/>");
	if (attrs) {
		for ( var key in attrs) {
			e.attr(key, attrs[key]);
		}
	}
	if (content)
		e.append(content);
	return e;
};

function addCell(trow, attrs) {
	var e = cell(attrs);
	trow.append(e);
	return e;
};

function appendRow(trow) {
	var e = $('<tr/>');
	trow.after(e);
	return e;
};

/*
 * Add an empty cell in the master-script for improvised "segment" of transcript
 */
function addImprovisedMasterScriptCell(trow, unmatchseg, prev_seg_end_idx, ms_div_id) {
	var c, d;
	c = addCell(trow, {
		'rowspan' : 1,
		'class' : 'col-md-6 masterscript-seg',
		'data-seg-start-idx' : -1,
		'data-seg-end-idx' : -1,
		'data-seg-idx' : -1,
		'contenteditable' : false
	});
	d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'contenteditable' : false,
		'data-seg-start-idx' : unmatchseg.start,
		'data-seg-end-idx' : unmatchseg.end,
		'data-seg-idx' : unmatchseg.idx,
	}, origMasterscriptSegBtn()));
	d.append(div({ // put in start of previous seg...
		'class' : 'col-md-11 seg-txt unmatched',
		'data-seg-start-idx' : prev_seg_end_idx + 1,
		'data-seg-end-idx' : prev_seg_end_idx,
		'data-seg-idx' : -1,
		'contenteditable' : true,
		'id' : ms_div_id
	}, unmatchseg.getSpan(match)));

	c.append(d);

	return c;
}

function addEmptyMasterScriptCell(trow, unmatchseg, prev_seg_end_idx, ms_div_id) {
	var c, d;
	c = addCell(trow, {
		'rowspan' : 1,
		'class' : 'col-md-6 masterscript-seg',
		'data-seg-start-idx' : -1,
		'data-seg-end-idx' : -1,
		'data-seg-idx' : -1,
		'contenteditable' : false
	});
	d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'contenteditable' : false,
		'data-seg-start-idx' : unmatchseg.start,
		'data-seg-end-idx' : unmatchseg.end,
		'data-seg-idx' : unmatchseg.idx,
	}, confirmTranscriptSegBtn()));
	d.append(div({ // put in start of previous seg...
		'class' : 'col-md-11 seg-txt unmatched',
		'data-seg-start-idx' : prev_seg_end_idx + 1,
		'data-seg-end-idx' : prev_seg_end_idx,
		'data-seg-idx' : -1,
		'contenteditable' : true,
		'id' : ms_div_id
	}, unmatchseg.getSpan(match)));

	c.append(d);

	return c;
};

function addMasterScriptCell(trow, seg, match, ms_div_id) {
	var c, d;
	if (!seg) {
		c = addCell(trow, {
			'rowspan' : 1,
			'class' : 'col-md-6 masterscript-seg',
			'data-seg-start-idx' : -1,
			'data-seg-end-idx' : -1,
			'data-seg-idx' : -1,
			'contenteditable' : false
		});
		d = div({
			'class' : 'row'
		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'contenteditable' : false
		}));
		d.append(div({
			'class' : 'col-md-11 seg-txt',
			'contenteditable' : true
		}, Script.longPauseSpan()));
	} else {
		var nmatch = seg.matchingSegs.length;
		var rowspan = Math.max(1, nmatch);
		c = addCell(trow, {
			'rowspan' : rowspan,
			'class' : 'col-md-6 masterscript-seg',
			'data-seg-start-idx' : seg.start,
			'data-seg-end-idx' : seg.end,
			'data-seg-idx' : seg.idx,
			'contenteditable' : false
		});
		d = div({
			'class' : 'row'
		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'contenteditable' : false,
			'data-seg-start-idx' : seg.start,
			'data-seg-end-idx' : seg.end,
			'data-seg-idx' : seg.idx
		}, origMasterscriptSegBtn()));
		d.append(div({
			'class' : 'col-md-11 seg-txt',
			'data-seg-start-idx' : seg.start,
			'data-seg-end-idx' : seg.end,
			'data-seg-idx' : seg.idx,
			'contenteditable' : true,
			'id' : ms_div_id
		}, seg.getSpan(match, false, 'masterscript')));
	}
	c.append(d);
	return c;
};

function addTranscriptCell(trow, seg, match, ms_div_id) {
	var c, d;
	if (!seg) {
		c = addCell(trow, {
			'rowspan' : 1,
			'class' : 'col-md-6 transcript-seg',
			'data-seg-start-idx' : -1,
			'data-seg-end-idx' : -1,
			'data-seg-idx' : -1,
			'contenteditable' : false
		});
		d = div({
			'class' : 'row',
			'contenteditable' : false

		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'contenteditable' : false
		}));
		d.append(div({
			'class' : 'col-md-11 seg-txt',
			'contenteditable' : false
		}));

		c.append(d);

		return c;
	}

	// matching segment
	c = addCell(trow, {
		'rowspan' : 1,
		'class' : 'col-md-6 transcript-seg',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
		'contenteditable' : false
	});
	d = div({
		'class' : 'row',
		'contenteditable' : false
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
		'contenteditable' : false,
		'data-ms-div-id' : ms_div_id,
		'data-transcript-key' : curid
	}, useTranscriptSegBtn()));
	d.append(div({
		'class' : 'col-md-11 seg-txt',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
		'contenteditable' : false
	}, seg.getSpan(match, trackchange, 'transcript')));
	c.append(d);
	return c;
};

/*
 * Print master-script(segs1) and aligned transcript (segs2)
 */
function printDiffView(segs1, segs2, match) {
	var trow = $('#script-texts-row');
	trow.hide();
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	trow = appendRow(trow);

	var nmatch, matchseg, unmatchseg;
	var prevmatch_idx = -1;
	var curmatch_idx = 0;
	var prev_seg_end_idx = -1;
	var ms_div_id = 0;

	// Iterate through master-script segments
	for (var i = 0; i < segs1.length; i++) {
		nmatch = segs1[i].matchingSegs.length;
		// If there is at least 1 matching segment in the transcript
		if (nmatch > 0) { // 1 or more matching segments
			matchseg = segs1[i].matchingSegs[0];
			curmatch_idx = matchseg.idx;

			// If the transcript has "improvised" segments that do not match master-script
			if (curmatch_idx > prevmatch_idx + 1) {
				// print "improvised" segment in-between
				for (var j = prevmatch_idx + 1; j < curmatch_idx; j++) {
					unmatchseg = segs2[j];
					if (unmatchseg.matchingSegs.length == 0) {
						addEmptyMasterScriptCell(trow, unmatchseg,
								prev_seg_end_idx, ms_div_id);
						addTranscriptCell(trow, unmatchseg, match, ms_div_id);
						trow = appendRow(trow);
						ms_div_id++;
					}
				}
			}
			addMasterScriptCell(trow, segs1[i], match, ms_div_id);
			prev_seg_end_idx = segs1[i].end;
			addTranscriptCell(trow, matchseg, match, ms_div_id);
			prevmatch_idx = curmatch_idx;

			// if there are more than 1 matching segment
			for (var j = 1; j < nmatch; j++) {
				matchseg = segs1[i].matchingSegs[j];
				trow = appendRow(trow);
				addTranscriptCell(trow, matchseg, match, ms_div_id);
			}
			ms_div_id++;
		} else { // no matching transcript
			addMasterScriptCell(trow, segs1[i], match, ms_div_id);
			$('#'+ms_div_id).addClass('nomatch');
			prev_seg_end_idx = segs1[i].end;
			addTranscriptCell(trow, null, match);
			ms_div_id++;
		}
		trow = appendRow(trow);
	}

	// after all the masterscript cell has been printed
	for (var i = curmatch_idx; i < segs2.length; i++) {
		unmatchseg = segs2[i];
		if (unmatchseg.matchingSegs.length == 0) {
			addEmptyMasterScriptCell(trow, unmatchseg, prev_seg_end_idx,
					ms_div_id);
			addTranscriptCell(trow, unmatchseg, match, ms_div_id);
			trow = appendRow(trow);
			ms_div_id++;
		}
	}

};

function printAlignedScripts() {
	var segmenter = new Segmenter(masterscript, transcripts[curid],
			matches[curid]);
	segmenter.iterateSegment(2);
	var ms_segments = segmenter.getSrc1Segments();
	var t_segments = segmenter.getSrc2Segments();
	TextSegment.matchSegments(ms_segments, t_segments, matches[curid]);
	printDiffView(ms_segments, t_segments, matches[curid]);
};

function printUnalignedScripts() {
	var trow = $('#script-texts-row');

	// remove aligned rows
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	// masterscript
	var td = $('#script-texts-row td:first');// .append(masterscript.getSpans());
	var d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn'
	}, null));
	d.append(div({
		'class' : 'col-md-11 seg-txt'
	}, masterscript.getSpans('masterscript')));
	td.empty().append(d);

	// transcript: get active panel
	d = trow.find('div #' + curid);
	d.empty();

	var content;
	if (trackchange) {
		var transeg = transcript.asSegment();
		transeg.matchingSegs[0] = masterscript.asSegment();
		content = transeg.getDiffViewSpan(match);

	} else {
		content = transcript.getSpans('transcript');
	}
	d.append(div({
		'class' : 'col-md-1 seg-btn'
	}, null));

	d.append(div({
		'class' : 'col-md-11 seg-txt'
	}, content));
	trow.show();

}

function addTranscriptCellWithDropDown(trow, transegs, msdiv) {
	if (transegs.length == 0) {
		addTranscriptCell(trow);
		return;
	}

	// First macthing segment with its context
	var cidx = transegs[0].getContextIDs();
	var cstart = cidx[0];
	var cend = cidx[1];
	var c, d;
	c = addCell(trow, {
		'rowspan' : 1,
		'class' : 'col-md-6 transcript-seg',
		'data-seg-start-idx' : cstart,
		'data-seg-end-idx' : cend,
		'contenteditable' : false
	});
	d = div({
		'class' : 'row dropdown',
		'contenteditable' : false
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'data-seg-start-idx' : cstart,
		'data-seg-end-idx' : cend,
		'contenteditable' : false,
		'data-ms-div-id' : msdiv.attr('id'),
		'data-transcript-key' : transegs[0].tkey
	}, useTranscriptSegBtn()));
	if (transegs.length == 1) {
		d.append(div({
			'class' : 'col-md-11 seg-txt',
			'data-seg-start-idx' : cstart,
			'data-seg-end-idx' : cend,
			'contenteditable' : false
		}, transegs[0].getSpanWithContext(matches[transegs[0].tkey],
				trackchange)));
	} else {
		d.append(div({
			'class' : 'col-md-10 seg-txt',
			'data-seg-start-idx' : cstart,
			'data-seg-end-idx' : cend,
			'contenteditable' : false
		}, transegs[0].getSpanWithContext(matches[transegs[0].tkey],
				trackchange)));
		// drop down div
		var id = 'dropdown-' + msdiv.attr('id');
		// var dropdowndiv = div({
		// 'class' : 'col-md-1 dropdown seg',
		// 'contenteditable' : false
		// }, transcriptDropDownBtn(id))
		d.append(transcriptDropDownBtn(id));
//		d.append(dropdowndiv);
		d.append(transcriptDropDown(transegs.slice(1), id, msdiv));

	}
	c.append(d);
};

function transcriptDropDownBtn(id) {
	var btn = $("<i/>");
	btn
			.attr('class',
					'dropdown-toggle btn btn-circle glyphicon glyphicon-triangle-bottom');
	btn.attr('id', id);
	btn.attr('data-toggle', 'dropdown')
	btn.attr('aria-haspopup', true);
	btn.attr('href', '#');
	return btn;
};

function transcriptDropDown(transegs, id, msdiv) {
	var ul = $("<ul/>");
	ul.attr('class', 'dropdown-menu col-md-12');
	ul.attr('aria-labelledby', id);
	var cidx, cstart, cend;
	var d;

	for (var i = 0; i < transegs.length; i++) {
		cidx = transegs[i].getContextIDs();
		cstart = cidx[0];
		cend = cidx[1];
		var li = $("<li/>");
		d = div({
			'class' : 'row',
			'contenteditable' : false
		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'data-seg-start-idx' : cstart,
			'data-seg-end-idx' : cend,
			'contenteditable' : false,
			'data-ms-div-id' : msdiv.attr('id'),
			'data-transcript-key' : transegs[i].tkey
		}, useTranscriptSegBtn()));
		d.append(div({
			'class' : 'col-md-11 seg-txt',
			'data-seg-start-idx' : cstart,
			'data-seg-end-idx' : cend,
			'contenteditable' : false
		}, transegs[i].getSpanWithContext(matches[transegs[i].tkey],
				trackchange)));
		li.append(d);
		ul.append(li);
	}
	return ul;

};

function printAllTranscriptView() {
	console.log("printAllTranscriptView");
	curid = "All";
	var trow = $('#script-texts-row');
	trow.hide();
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	trow = appendRow(trow);
	var segs1 = masterscript.getSegments();
	var nsegs = segs1.length;
	var td, div, nmatch, rowspan;
	for (var i = 0; i < nsegs; i++) {
		var transegs = getMatchedSegments(segs1[i]);
		// segs1[i].matchingSegs = transegs;
		nmatch = transegs.length;
		td = addMasterScriptCell(trow, segs1[i]);
		div = td.find('.seg-txt').first();
		div.attr('id', 'all-ms-' + i);
		if (nmatch == 0) {
			div.addClass('nomatch');
		}
		// print transcript cell with dropdown button

		td = addTranscriptCellWithDropDown(trow, transegs, div);
		trow = appendRow(trow);
	}
	if (nsegs == 0) { // empty masterscript
		console.log("empty masterscript");
		td = addMasterScriptCell(trow);
		div = td.find('.seg-txt').first();
		div.attr('id', 'all-ms-' + i);

		td = addTranscriptCell(trow);
		td.attr('rowspan', nsegs);
		td.attr('id', 'all_tran_td');
		trow.show();
		trow = appendRow(trow);
	}

	if (printall_selected) {
		printAllMatchedSegments($('#' + printall_selected));
	}
};

function printAllTranscriptView_old() {
	curid = "All";
	var trow = $('#script-texts-row');
	trow.hide();
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	trow = appendRow(trow);
	var segs1 = masterscript.getSegments();
	var nsegs = segs1.length;
	var rowspan = Math.max(1, nsegs);
	var td, div, nmatch;
	for (var i = 0; i < nsegs; i++) {
		nmatch = numMatchedSegments(segs1[i]);
		td = addMasterScriptCell(trow, segs1[i]);
		div = td.find('.seg-txt').first();
		div.attr('id', 'all-ms-' + i);

		if (nmatch == 0) {
			div.addClass('nomatch');
		}
		div.click(function() {
			printAllMatchedSegments($(this));
		});

		if (i == 0) {
			td = addTranscriptCell(trow);
			td.attr('rowspan', nsegs);
			td.attr('id', 'all_tran_td');
		}
		trow = appendRow(trow);
	}
	if (nsegs == 0) { // empty masterscript
		td = addMasterScriptCell(trow);
		div = td.find('.seg-txt').first();
		div.attr('id', 'all-ms-' + i);

		td = addTranscriptCell(trow);
		td.attr('rowspan', nsegs);
		td.attr('id', 'all_tran_td');
		trow.show();
		trow = appendRow(trow);
	}

	if (printall_selected) {
		printAllMatchedSegments($('#' + printall_selected));
	}
};

function numMatchedSegments(msseg) {
	var match, midx, mstart, mend, mscore;
	var nseg = 0;
	var start_idx = msseg.start;
	var end_idx = msseg.end;
	var transeg;
	for ( var key in transcripts) {
		if (key == "All")
			continue;
		match = matches[key];
		midx = transcripts[key].getMatchingSegment(match, start_idx, end_idx);
		mstart = midx[0];
		mend = midx[1];
		if (mstart == -1 || mend == -1)
			continue;
		else {
			transeg = new TextSegment(transcripts[key], mstart, mend);
			transeg.tkey = key;
			mscore = TextSegment.matchScore(msseg, transeg, match);
			if (mscore > 0.5)
				nseg++;
		}
	}
	return nseg;
};

function getMatchedSegments(msseg) {
	var match, midx, mstart, mend, mscore;
	var matchedsegs = [];
	var start_idx = msseg.start;
	var end_idx = msseg.end;
	var transeg;
	for ( var key in transcripts) {
		if (key == "All")
			continue;
		match = matches[key];
		midx = transcripts[key].getMatchingSegment(match, start_idx, end_idx);
		mstart = midx[0];
		mend = midx[1];
		if (mstart == -1 || mend == -1 || mstart == undefined || mend == undefined)
			continue;
		else {
			transeg = new TextSegment(transcripts[key], mstart, mend);
			transeg.tkey = key;
			mscore = TextSegment.matchScore(msseg, transeg, match);
			if (mscore > 0.5) {
				transeg.matchingSegs = [ msseg ];
				matchedsegs.push(transeg);
			}
		}
	}
	return matchedsegs;
};

function printAllMatchedSegments(segdiv) {
	printall_selected = segdiv.attr('id');
	if (!segdiv)
		return;
	$('div.highlight').each(function() {
		$(this).removeClass('highlight');
	});
	$('#' + printall_selected).addClass('highlight');

	var td = segdiv.closest('td');

	var tran_td = $('#all_tran_td');
	var start_idx = Number(td.attr('data-seg-start-idx'));
	var end_idx = Number(td.attr('data-seg-end-idx'));
	var seg_idx = Number(td.attr('data-seg-idx'));
	var match, matchseg, midx, mstart, mend, cstart, cend, d;

	var msseg = new TextSegment(masterscript, start_idx, end_idx);

	tran_td.empty();
	tran_td.attr('data-seg-idx', seg_idx);
	for ( var key in transcripts) {
		if (key == "All")
			continue;
		match = matches[key];
		midx = transcripts[key].getMatchingSegment(match, start_idx, end_idx);
		mstart = midx[0];
		mend = midx[1];

		if (mstart == -1 || mend == -1)
			continue;
		matchseg = new TextSegment(transcripts[key], mstart, mend);
		var mscore = TextSegment.matchScore(msseg, matchseg, match);
		if (mscore < 0.5)
			continue;
		matchseg.matchingSegs[0] = msseg;
		var cidx = matchseg.getContextIDs();
		cstart = cidx[0];
		cend = cidx[1];

		if (matchseg) {
			d = div({
				'class' : 'row'
			});
			d.append(div({
				'class' : 'col-md-1 seg-btn',
				'contenteditable' : false,
				'data-ms-div-id' : segdiv.attr('id'),
				'data-seg-start-idx' : cstart,
				'data-seg-end-idx' : cend,
				'data-transcript-key' : key
			}, useTranscriptSegBtn()));

			d.append(div({
				'class' : 'col-md-11 seg-txt'
			}, matchseg.getSpanWithContext(match, trackchange)));
			tran_td.append(d);
		}
	}
};

function reprint() {
	if (curid == "All") {
		printAllTranscriptView();
	} else if (aligned) {
		printAlignedScripts();
	} else {
		printUnalignedScripts();
	}

	$('#script-texts').contextmenu(function(evt) {
		contextMasterscript(evt);
	});



};
