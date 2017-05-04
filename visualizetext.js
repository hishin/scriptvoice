"use strict"

function visualizeMatch(spans, match) {
	for (var i = 0; i < spans.length; i++) {if (match[i] >= 0)
		spans[i].addClass('hasMatch');
	else
		spans[i].addClass('noMatch');
	}
	return spans;
};

function printAlignedTextSegments(tableid, segs1, segs2) {
	$(tableid + ' tbody').empty();

	for (var i = 0; i < segs1.length; i++) {
		var nmatch = segs1[i].matchingSegs.length;

		$(tableid + ' tbody:last').append('<tr></tr>');
		var trowID = 'src1-seg' + i;
		var trow = $( tableid+" tr:last" );
		trow.attr('id', trowID);

		trow.append('<td></td>');
		var tdID = trowID+'-src1';
		var td = $('#' + trowID + ' td:last')
		td.attr('id', tdID);
		td.attr('rowspan', nmatch);

		// segment from src1
		var segspan= segs1[i].getSpan();
		td.append(segspan);

		// matching segments

		for (var j = 0; j < nmatch; j++) {
			if (j > 0) {
				$(tableid + ' tbody:last').append('<tr></tr>');
				trowID = 'src1-seg' + i + '-' + j;
				trow = $( tableid+" tr:last" );
				trow.attr('id', trowID);
			}
			trow.append('<td></td>');
			td = $('#' + trowID + ' td:last')
			tdID = trowID+'-src2-'+j;
			td.attr('id', tdID);
			td.append(segs1[i].matchingSegs[j].getSpan());
		}
		if (nmatch == 0) {
			trow.append('<td></td>');
		}
	}

	for (var i = 0; i < segs2.length; i++) {
		if (segs2[i].matchingSegs.length == 0) {
			$(tableid + ' tbody:last').append('<tr></tr>');
			var trowID = 'src2-seg' + i;
			var trow = $( tableid+" tr:last" );
			trow.attr('id', trowID);

			trow.append('<td></td>');
			trow.append('<td></td>');
			var tdID = trowID+'-src2';
			var td = $('#' + trowID + ' td:last')
			td.attr('id', tdID);

			// segment from src2
			var segspan= segs2[i].getSpan();
			td.append(segspan);
		}
	}

};


var textcolors = ['FF9900', '00ff66', 'blue', 'black', 'orange'];
var textbgcolors = ['none', '00ff66', '99FFFF', 'FFCC00', 'orange'];

function getColoredText(list_of_words, colors) {
	var spans = [];
	var span = $("<span/>");
	var c = colors[0];
	var prevc = c;
	span.css('background-color', textcolors[c % textcolors.length]);
	for (var i = 0; i < list_of_words.length; i++) {
		// if color change, start new span
		if (colors[i] != c) {
			spans.push(span);
			span = $("<span/>");
			c = colors[i];
			if (c >= 0) {
				span.css('background-color', textcolors[c % textcolors.length]);
				prevc = c;
			}

		}
		// append the new word
		span.append(" " + list_of_words[i]);
	}
	spans.push(span);
	return spans;
};

function getBgColoredTextSegs(list_of_textseg, bgcolors) {
	var spans = [];
	for (var i = 0; i < list_of_textseg.length; i++) {
		var span = $("<span/>");
		span.css('background-color', textbgcolors[bgcolors[i]]);
		for (var j = 0; j < list_of_textseg[i].length; j++) {
			span.append(" " + list_of_textseg[i][j]);
		}
		span.append("<br><br>");
		spans.push(span);
	}

	return spans;
};