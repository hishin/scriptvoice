"use strict"

function addDataMatch(spans, match) {
	var m = 0;
	for (var i = 0; i < spans.length; i++) {
		var span = spans[i];
		var iswhitespace = spans[i].attr('data-iswhitespace');
		if (iswhitespace == "true") {
			span.attr('data-hasmatch', false);
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

function printAlignedTextSegments(tableid, segs1, segs2, match) {
	$(tableid + ' tbody').empty();
	var cellid = 0;
	var selectid;
	for (var i = 0; i < segs1.length; i++) {
		var nmatch = segs1[i].matchingSegs.length;
		var inputname = 'seg1-' + i;
		selectid = 'cell' + cellid; 
		var trow = $("<tr/>");
		$(tableid + ' tbody:last').append(trow);
		// segment 1
		var td = $("<td/>");
		td.addClass('col-md-6');
		td.attr('rowspan', Math.max(1, nmatch));
		td.attr('id', selectid)
		var segspan = segs1[i].getSpan(match.match1to2);
		td.append(segspan);
		trow.append(td);

		if (nmatch == 0) {
			// radio button for seg1
			td = addRadioButton(trow, 1, inputname, "checked", selectid);			
			// radio button for seg2
			cellid++;
			selectid = 'cell' + cellid; 
			td = addRadioButton(trow, 1, inputname, "", selectid);
			// empty for matching seg2
			td = $("<td/>");
			td.addClass('col-md-6');
			td.attr('id', selectid)
			trow.append(td);
		} else {
			var matchseg = segs1[i].matchingSegs[0];
			var mscore = TextSegment.matchScore(segs1[i], matchseg, match);

			// radio button for seg1
			td = addRadioButton(trow, nmatch, inputname, "", selectid);
			
			// radio button for seg2
			cellid++;
			selectid = 'cell' + cellid; 
			td = addRadioButton(trow, 1, inputname, "checked", selectid);
			
			// matching seg2
			td = $("<td/>");
			td.addClass('col-md-6');
			segspan = matchseg.getSpan(match.match2to1);
			td.attr('id', selectid)
			td.append(segspan);
			trow.append(td);

			if (mscore > 0.75) {
				trow.addClass("success");
			} else if (mscore > 0.5) {
				trow.addClass("warning");
			}

			// if there are more than 1 match
			for (var j = 1; j < nmatch; j++) {
				matchseg = segs1[i].matchingSegs[j];
				mscore = TextSegment.matchScore(segs1[i], matchseg, match);
				trow = $("<tr/>");
				$(tableid + ' tbody:last').append(trow);

				// radio button for seg2
				cellid++;
				selectid = 'cell' + cellid; 
				td = addRadioButton(trow, 1, inputname, "", selectid);
				trow.append(td);

				// matching seg2
				td = $("<td/>");
				td.addClass('col-md-6');
				trow.append(td);
				segspan = matchseg.getSpan(match.match2to1);
				td.append(segspan);
				td.attr('id', selectid)

				if (mscore > 0.75) {
					trow.addClass("success");
				} else if (mscore > 0.5) {
					trow.addClass("warning");
				}
			}
		}
		cellid++;
	}

	// For unmatched seg2
	for (var i = 0; i < segs2.length; i++) {
		if (segs2[i].matchingSegs.length == 0) {
			var trow = $('<tr/>');
			$(tableid + ' tbody:last').append(trow);
			var inputname = 'seg2-' + i;

			// empty cell for seg1
			cellid++;
			selectid = 'cell' + cellid; 
			var td = $('<td/>');
			td.addClass('col-md-6');
			td.attr('id', selectid)
			trow.append(td);
			// radio button for seg1
			td = addRadioButton(trow, 1, inputname, "", selectid);

			// radio button for seg2
			cellid++;
			selectid = 'cell' + cellid;
			td = addRadioButton(trow, 1, inputname, "checked", selectid);
			td.addClass("danger");

			td = $('<td/>');
			td.addClass("danger");
			td.addClass('col-md-6');
			td.attr('id', selectid);
			trow.append(td);
			var segspan = segs2[i].getSpan(match.match2to1);
			td.append(segspan);
		}
	}

	$(tableid + ' tbody').sortable().disableSelection();
};

