"use strict";

function mergeSegs2Script(cell_ids) {
	
	var spans = [];
	var cellspans;
	for (var i = 0; i < cell_ids.length; i++) {
		cellspans = $('#'+cell_ids[i]).children();
		spans.push.apply(spans, cellspans);
	}
	var script = new Script();
	script.initFromSpans(spans);
	return script;	
};

function getCheckedSegs(tableid) {
	var cells = [];
	$(tableid + ' input:radio').each(function() {
		if ($(this).is(':checked')) {
			var value = $(this).attr('value');
			cells.push(value);
		}
	});	
	return cells;
};


