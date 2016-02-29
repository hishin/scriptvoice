"use strict";

function mergeSegs2Script(src1, src2, srcids, start, end) {
	
	var tokens = [];
	var src;	
	for (var i = 0; i < srcids.length; i++) {
		if (srcids[i] == 0) src = src1;
		else if (srcids[i] == 1) src = src2;
		else if (srcids[i] == -1) continue;
		else console.log("Error: source index must be -1, 0, or 1!")
		tokens.push.apply(tokens, src.getTokens().slice(start[i], end[i]+1));
	}
	
	var script = new Script();
	script.initFromTokens(tokens);
	return script;	
};

function getCheckedSegs(tableid) {
	var sources = [];
	var startids = [];
	var endids = [];
	$(tableid + ' input:radio').each(function() {
		if ($(this).is(':checked')) {
			var parent = $(this).parent();
			var src = parent.attr('data-src');
			var start = parent.attr('data-startid');
			var end = parent.attr('data-endid');
			sources.push(Number(src));
			startids.push(Number(start));
			endids.push(Number(end));
			console.log("src " + src + " start " + start + " end " + end);
		}
	});
	
	return [sources, startids, endids];
};


