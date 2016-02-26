"use strict"

function printMatch(spans, match) {
	for (var i = 0; i < spans.length; i++) {
		if (match[i] >= 0)
			spans[i].addClass('hasMatch');
		else
			spans[i].addClass('noMatch');
	}
	return spans;
};

function addRadioButton(trow, rowspan, name, checked) {
	var td = $("<td/>");
	td.attr('rowspan', rowspan);
	td.append("<input type=\'radio\' name=\'" + name + "\' " + checked + "\>");
	trow.append(td);
	return td;
};

function printAlignedTextSegments(tableid, segs1, segs2, match) {
	$(tableid + ' tbody').empty();
	for (var i = 0; i < segs1.length; i++) {
		var nmatch = segs1[i].matchingSegs.length;
		var inputname = 'seg1-' + i;

		var trow = $("<tr/>");
		$(tableid + ' tbody:last').append(trow);
		var td = $("<td/>");
		td.attr('rowspan', Math.max(1, nmatch));
		var segspan = printMatch(segs1[i].getSpan(), match.match1to2.slice(
				segs1[i].start, segs1[i].end + 1));
		td.append(segspan);
		trow.append(td);

		if (nmatch == 0) {
			// radio button for seg1
			td = addRadioButton(trow, 1, inputname, "checked");
			td.attr('data-src', 0);
			td.attr('data-startid', segs1[i].start);
			td.attr('data-endid', segs1[i].end);

			// radio button for seg2
			addRadioButton(trow, 1, inputname, "");
			// empty for matching seg2
			td = $("<td/>");
			trow.append(td);
		} else {
			var matchseg = segs1[i].matchingSegs[0];
			var mscore = TextSegment.matchScore(segs1[i], matchseg, match);

			// radio button for seg1
			td = addRadioButton(trow, nmatch, inputname, "");
			td.attr('data-src', 0);
			td.attr('data-startid', segs1[i].start);
			td.attr('data-endid', segs1[i].end);

			// radio button for seg2
			td = addRadioButton(trow, 1, inputname, "checked");
			if (mscore > 0.75) {
				td.addClass("success");
			} else if (mscore > 0.5) {
				td.addClass("warning");
			}
			td.attr('data-src', 1);
			td.attr('data-startid', matchseg.start);
			td.attr('data-endid', matchseg.end);

			// print seg1[i] and matching seg2
			td = $("<td/>");
			if (mscore > 0.75) {
				td.addClass("success");
			} else if (mscore > 0.5) {
				td.addClass("warning");
			}
			segspan = printMatch(matchseg.getSpan(), match.match2to1.slice(
					matchseg.start, matchseg.end + 1));
			td.append(segspan);
			trow.append(td);

			// if there are more than 1 match
			for (var j = 1; j < nmatch; j++) {
				matchseg = segs1[i].matchingSegs[j];
				mscore = TextSegment.matchScore(segs1[i], matchseg, match);
				trow = $("<tr/>");
				$(tableid + ' tbody:last').append(trow);

				// radio button for seg2
				td = addRadioButton(trow, 1, inputname, "");
				if (mscore > 0.75) {
					td.addClass("success");
				} else if (mscore > 0.5) {
					td.addClass("warning");
				}
				td.attr('data-src', 1);
				td.attr('data-startid', matchseg.start);
				td.attr('data-endid', matchseg.end);
				trow.append(td);

				// matching seg2
				td = $("<td/>");
				if (mscore > 0.75) {
					td.addClass("success");
				} else if (mscore > 0.5) {
					td.addClass("warning");
				}
				trow.append(td);
				segspan = printMatch(matchseg.getSpan(), match.match2to1.slice(
						matchseg.start, matchseg.end + 1));
				td.append(segspan);
			}
		}
	}

	// For unmatched seg2
	for (var i = 0; i < segs2.length; i++) {
		if (segs2[i].matchingSegs.length == 0) {
			var trow = $('<tr/>');
			$(tableid + ' tbody:last').append(trow);

			var inputname = 'seg2-' + i;

			// empty cell for seg1
			var td = $('<td/>');
			trow.append(td);
			// radio button for seg1
			addRadioButton(trow, 1, inputname, "");

			// radio button for seg2
			td = addRadioButton(trow, 1, inputname, "checked");
			td.addClass("danger");
			td.attr('data-src', 1);
			td.attr('data-startid', segs2[i].start);
			td.attr('data-endid', segs2[i].end);

			td = $('<td/>');
			td.addClass("danger");
			trow.append(td);
			var segspan = printMatch(segs2[i].getSpan(), match.match2to1.slice(
					segs2[i].start, segs2[i].end + 1));
			td.append(segspan);
		}
	}
};

