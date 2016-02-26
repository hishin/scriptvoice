"use strict"

function visualizeMatch(spans, match) {
	for (var i = 0; i < spans.length; i++) {
		if (match[i] >= 0)
			spans[i].addClass('hasMatch');
		else
			spans[i].addClass('noMatch');
	}
	return spans;
};

function printAlignedTextSegments(tableid, segs1, segs2, match) {
	$(tableid + ' tbody').empty();

	for (var i = 0; i < segs1.length; i++) { // iterate through segs1
		var nmatch = segs1[i].matchingSegs.length;
		// print seg1[i] on separate row
		var trow = $("<tr/>");
		$(tableid + ' tbody:last').append(trow);
		var td = $("<td/>");
		td.attr('rowspan', nmatch);
		var segspan = visualizeMatch(segs1[i].getSpan(), match.match1to2.slice(
				segs1[i].start, segs1[i].end + 1));
		td.append(segspan);
		trow.append(td);
		
		// radio button for seg1
		td = $("<td/>");
		td.append("<input type=\'radio\' name=\'seg1-" + i +"\'>");
		trow.append(td);
		
		if (nmatch == 0) {
			// empty for matching seg2
			td = $("<td/>");
			trow.append(td);
		} else {
			var matchseg = segs1[i].matchingSegs[0];
			var mscore = TextSegment.matchScore(segs1[i], matchseg, match);
			
			// radio button for seg2
			td = $("<td/>");
			td.append("<input type=\'radio\' name=\'seg1-" + i +"\'>");
			if (mscore > 0.75) {
				td.addClass("success");
			} else if (mscore > 0.5) {
				td.addClass("warning");
			}
			trow.append(td);
			
			// print seg1[i] and matching seg2
			td = $("<td/>");
			if (mscore > 0.75) {
				td.addClass("success");
			} else if (mscore > 0.5) {
				td.addClass("warning");
			}
			segspan = visualizeMatch(matchseg.getSpan(), match.match2to1.slice(
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
				td = $("<td/>");
				td.append("<input type=\'radio\' name=\'seg1-" + i +"\'>");
				if (mscore > 0.75) {
					td.addClass("success");
				} else if (mscore > 0.5) {
					td.addClass("warning");
				}
				trow.append(td);
				
				// matching seg2
				td = $("<td/>");
				if (mscore > 0.75) {
					td.addClass("success");
				} else if (mscore > 0.5) {
					td.addClass("warning");
				}
				trow.append(td);
				segspan = visualizeMatch(matchseg.getSpan(), match.match2to1
						.slice(matchseg.start, matchseg.end + 1));
				td.append(segspan);
			}
		}
	}

	// For unmatched seg2
	for (var i = 0; i < segs2.length; i++) {
		if (segs2[i].matchingSegs.length == 0) {
			var trow = $('<tr/>');
			$(tableid + ' tbody:last').append(trow);
			var td = $('<td/>');
			trow.append(td);
			td = $('<td/>');
			td.addClass("danger");
			trow.append(td);
			var segspan = visualizeMatch(segs2[i].getSpan(), match.match2to1
					.slice(segs2[i].start, segs2[i].end + 1));
			td.append(segspan);
		}
	}
};

