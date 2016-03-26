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
	var useseg = new TextSegment(transcript, tr_start_idx, tr_end_idx);

	var trtd = icon.closest('td');
	var mstd = trtd.siblings('.masterscript-seg').first();
	var mstxtdiv = mstd.find('.seg-txt');
	var msbtn = mstd.find('.seg-btn');

	var ms_start_idx = parseInt(mstxtdiv.attr('data-seg-start-idx'));
	var ms_end_idx = parseInt(mstxtdiv.attr('data-seg-end-idx'));

	//masterscript.replaceTokens(ms_start_idx, ms_end_idx, useseg.getTokens());

	mstxtdiv.empty().append(useseg.getSpan());
	mstxtdiv.removeClass('unmatched');
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
		var useseg = new TextSegment(transcript, tr_start_idx, tr_end_idx);
		masterscript
				.replaceTokens(ms_start_idx, ms_end_idx, useseg.getTokens());
		mstxtdiv.removeClass('unmatched');
	} else {
		masterscript.removeTokens(ms_start_idx, ms_start_idx + tr_ntokens - 1);
		mstxtdiv.addClass('unmatched');
	}
	toggleConfirmBtn(icon);
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

function addEmptyMasterScriptCell(trow, unmatchseg, prev_seg_end_idx) {

	var c, d;
	c = addCell(trow, {
		'rowspan' : 1,
		'class' : 'col-md-6 masterscript-seg',
		'data-seg-start-idx' : -1,
		'data-seg-end-idx' : -1,
		'data-seg-idx' : -1,
		'contenteditable' : true
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
	}, unmatchseg.getSpan(match)));

	c.append(d);

	return c;
};

function addMasterScriptCell(trow, seg, match) {
	var c, d;
	if (!seg) { // empty cell
		c = addCell(trow, {
			'rowspan' : 1,
			'class' : 'col-md-6 masterscript-seg',
			'data-seg-start-idx' : -1,
			'data-seg-end-idx' : -1,
			'data-seg-idx' : -1,
			'contenteditable' : true
		});
		d = div({
			'class' : 'row'
		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'contenteditable' : false
		}));
		d.append(div({
			'class' : 'col-md-11 seg-txt'
		}));

		c.append(d);

		return c;
	}

	var nmatch = seg.matchingSegs.length;
	var rowspan = Math.max(1, nmatch);
	c = addCell(trow, {
		'rowspan' : rowspan,
		'class' : 'col-md-6 masterscript-seg',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
		'contenteditable' : true
	});
	d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'contenteditable' : false,
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
	}, origMasterscriptSegBtn()));
	d.append(div({
		'class' : 'col-md-11 seg-txt',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx,
	}, seg.getSpan(match)));

	c.append(d);
	return c;
};

function addTranscriptCell(trow, seg, match) {
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
			'class' : 'row'
		});
		d.append(div({
			'class' : 'col-md-1 seg-btn',
			'contenteditable' : false
		}));
		d.append(div({
			'class' : 'col-md-11 seg-txt'
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
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn',
		'contenteditable' : false,
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx
	}, useTranscriptSegBtn()));
	d.append(div({
		'class' : 'col-md-11 seg-txt',
		'data-seg-start-idx' : seg.start,
		'data-seg-end-idx' : seg.end,
		'data-seg-idx' : seg.idx
	}, seg.getSpan(match, trackchange)));
	c.append(d);
	return c;
};

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

	for (var i = 0; i < segs1.length; i++) {
		nmatch = segs1[i].matchingSegs.length;
		if (nmatch > 0) { // 1 or more matching segments
			matchseg = segs1[i].matchingSegs[0];
			curmatch_idx = matchseg.idx;
			if (curmatch_idx > prevmatch_idx + 1) {
				// print unmatched segments in-between
				for (var j = prevmatch_idx + 1; j < curmatch_idx; j++) {
					unmatchseg = segs2[j];
					if (unmatchseg.matchingSegs.length == 0) {
						addEmptyMasterScriptCell(trow, unmatchseg,
								prev_seg_end_idx);
						addTranscriptCell(trow, unmatchseg, match);
						trow = appendRow(trow);
					}
				}
			}
			addMasterScriptCell(trow, segs1[i], match);
			prev_seg_end_idx = segs1[i].end;
			addTranscriptCell(trow, matchseg, match);
			prevmatch_idx = curmatch_idx;

			// if there are more than 1 matching segment
			for (var j = 1; j < nmatch; j++) {
				matchseg = segs1[i].matchingSegs[j];
				trow = appendRow(trow);
				addTranscriptCell(trow, matchseg, match);
			}
		} else { // no matching transcript
			addMasterScriptCell(trow, segs1[i], match);
			prev_seg_end_idx = segs1[i].end;
			addTranscriptCell(trow);
		}
		trow = appendRow(trow);
	}

	// after all the masterscript cell has been printed
	for (var i = curmatch_idx; i < segs2.length; i++) {
		unmatchseg = segs2[i];
		if (unmatchseg.matchingSegs.length == 0) {
			addEmptyMasterScriptCell(trow, unmatchseg, prev_seg_end_idx);
			addTranscriptCell(trow, unmatchseg, match);
			trow = appendRow(trow);
		}
	}

};

function printAlignedScripts() {
	var segmenter = new Segmenter(masterscript, transcript, match);
	segmenter.iterateSegment(2);
	var ms_segments = segmenter.getSrc1Segments();
	var t_segments = segmenter.getSrc2Segments();
	TextSegment.matchSegments(ms_segments, t_segments, match);
	printDiffView(ms_segments, t_segments, match);
};

function printUnalignedScripts() {
	var trow = $('#script-texts-row');

	// remove aligned rows
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	// masterscript

	console.log(masterscript.getTokens().length);
	var td = $('#script-texts-row td:first');// .append(masterscript.getSpans());
	var d = div({
		'class' : 'row'
	});
	d.append(div({
		'class' : 'col-md-1 seg-btn'
	}, null));
	d.append(div({
		'class' : 'col-md-11 seg-txt'
	}, masterscript.getSpans()));
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
		content = transcript.getSpans();

	}
	d.append(div({
		'class' : 'col-md-1 seg-btn'
	}, null));

	d.append(div({
		'class' : 'col-md-11 seg-txt'
	}, content));
	trow.show();

}

function printAllTranscriptView() {
	transcript = "All"

	var trow = $('#script-texts-row');
	trow.hide();
	trow.siblings('tr').each(function() {
		$(this).remove();
	});

	trow = appendRow(trow);
	var segs1 = masterscript.getSegments();
	var nsegs = segs1.length;
	var rowspan = Math.max(1, nsegs);
	var td, div;
	for (var i = 0; i < nsegs; i++) {
		td = addMasterScriptCell(trow, segs1[i]);
		div = td.find('.seg-txt').first();
		div.attr('id', 'all-ms-' + i);
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
	if (printall_selected) {
		printAllMatchedSegments($('#' + printall_selected));
	}
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
	var start_idx = td.attr('data-seg-start-idx');
	var end_idx = td.attr('data-seg-end-idx');
	var seg_idx = td.attr('data-seg-idx');
	var match, matchseg, d;

	var msseg = new TextSegment(masterscript, start_idx, end_idx);

	tran_td.empty();
	tran_td.attr('data-seg-idx', seg_idx);
	for ( var key in transcripts) {
		if (key == "All")
			continue;
		match = matches[key];
		matchseg = transcripts[key].getMatchingSegment(match, start_idx,
				end_idx);
		if (!matchseg)
			continue;
		matchseg.matchingSegs[0] = msseg;
		if (matchseg) {
			d = div({
				'class' : 'row'
			});
			d.append(div({
				'class' : 'col-md-1 seg-btn',
				'contenteditable' : false
			}, useTranscriptSegBtn()));

			d.append(div({
				'class' : 'col-md-11 seg-txt'
			}, matchseg.getSpanWithContext(match, trackchange)));
			tran_td.append(d);
		}
	}
};

function reprint() {
	if (transcript == "All") {
		printAllTranscriptView();
	} else if (aligned) {
		printAlignedScripts();
	} else {
		printUnalignedScripts();
	}

};
