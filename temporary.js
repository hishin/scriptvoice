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
			prev_seg_end_idx = segs1[i].end;
			addTranscriptCell(trow);
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

function addTranscriptCell(trow, seg, match, ms_div_id) {
	var c, d;
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
	}, seg.getSpan(match, trackchange, true)));
	c.append(d);
	return c;
};
