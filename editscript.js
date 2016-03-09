"use strict"

var edit_nodes;
var edit_alternatives;

function editMasterscript(event) {
	var selectednodes = getSelectedNodes();
	var affectednodes = getAffectedNodes(selectednodes);
	if (isPrintable(event.keyCode)) {
		markDirtyEdit(edit_alternatives, edit_nodes)
	}
};

function getText(nodes) {
	var text = '';
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		text = text + $(node).text();
	}
	return text;
};

function contextMasterscript(event) {
	if (event.ctrlKey)
		return;
	var sel = window.getSelection();
	if (!sel.isCollapsed) {
		event.preventDefault();
		var $menu = $('#contextEditMenu').show().css({
			position : "absolute",
			left : getMenuPosition(event.clientX, 'width', 'scrollLeft'),
			top : getMenuPosition(event.clientY, 'height', 'scrollTop')
		}).off('click').on('click', 'a', function(e) {
			$menu.hide();
		});
	}
};

function markDirtyEdit(edit_alternatives, edit_nodes) {
	for (var i = 0; i < edit_alternatives.length; i++) {
		var alternatives = edit_alternatives[i];
		
		
		if (!NeedlemanWunsch.matchAlternative(alternatives, $(edit_nodes[i]).text())) {
			$(edit_nodes[i]).attr('data-isdirty', true);
		} else {
			console.log(alternatives);
			console.log($(edit_nodes[i]).text());
			$(edit_nodes[i]).attr('data-isdirty', false);
		}
	}	
};

function markDirty(nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (isRecorded(node))
			$(node).attr('data-isdirty', true);
	}
};

function markClean(nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (isRecorded(node))
			$(node).attr('data-isdirty', false);
	}
};

function markSelectedDirty() {
	var selectednodes = getSelectedNodes();
	markDirty(selectednodes);
};

function markSelectedClean() {
	var selectednodes = getSelectedNodes();
	markClean(selectednodes);
};

function getMenuPosition(mouse, direction, scrollDir) {
	var win = $(window)[direction]();
	var scroll = $(window)[scrollDir]();
	var menu = $('#contextEditMenu')[direction]();
	var position = mouse + scroll;

	// opening menu would pass the side of the page
	if (mouse + menu > win && menu < mouse)
		position -= menu;

	return position;
};

function getAffectedNodes(selectednodes) {
	if (selectednodes.length == 0)
		return [];
	var prevNode = selectednodes[0].previousSibling;
	var nextNode = selectednodes[selectednodes.length - 1].nextSibling;
	var prevnodes = [];
	while (prevNode && isRecorded(prevNode) && !isLongPause(prevNode)) {
		prevnodes.push(prevNode);
		prevNode = prevNode.previousSibling;
	}
	prevnodes.reverse();

	var nextnodes = [];
	prevNode = selectednodes[selectednodes.length - 1];
	while (isRecorded(nextNode) && !isLongPause(prevNode)) {
		nextnodes.push(nextNode);
		prevNode = nextNode;
		nextNode = nextNode.nextSibling;
	}

	var temp = prevnodes.concat(selectednodes)
	var allnodes = temp.concat(nextnodes);
	return allnodes;

};

function isRecorded(node) {
	if (node)
		return node.getAttribute('data-isrecorded') == 'true';
	return false;
};

function isLongPause(node) {
	if (node)
		return node.getAttribute('data-islongpause') == 'true';
	return false;
};

function isPrintable(keycode) {
	var valid = (keycode > 47 && keycode < 58) || // number keys
	(keycode == 8 || keycode == 46) || // backspace and delete keys
	(keycode == 32 || keycode == 13) || // spacebar and return keys
	(keycode > 64 && keycode < 91) || // letter keys
	(keycode > 95 && keycode < 112) || // numpad keys
	(keycode > 185 && keycode < 193) || // ;=,-./` (in order)
	(keycode > 218 && keycode < 223); // [\]' (in order)

	return valid;
};

function nextNode(node) {
	if (!node.nextSibling) {
		return null;
	}
	return node.nextSibling;
};

function getRangeSelectedNodes(range) {
	var node;
	if (range.startContainer.parentNode.tagName == "SPAN") {
		node = range.startContainer.parentNode;
	} else if (range.startContainer.tagName == "SPAN") {
		node = range.startContainer;
	}
	var endNode;
	if (range.endContainer.parentNode.tagName == "SPAN") {
		endNode = range.startContainer.parentNode;
	} else if (range.endContainer.tagName == "SPAN") {
		endNode = range.startContainer;
	}

	// Special case for a range that is contained within a single node
	if (node == endNode) {
		return [ node ];
	}

	// Iterate nodes until we hit the end container
	var rangeNodes = [];
	while (node && node != endNode) {
		rangeNodes.push(node = nextNode(node));
	}

	// Add partially selected nodes at the start of the range
	rangeNodes.unshift(node);

	return rangeNodes;
};

function saveEditNodes() {
	// nodes that are possibly edited by this keydown
	var selectednodes = getSelectedNodes();
	edit_nodes = getEditNodes(selectednodes);
	var alternative;
	edit_alternatives = [];
	for (var i = 0; i < edit_nodes.length; i++) {
		alternative = $.parseJSON(edit_nodes[i]
				.getAttribute('data-alternatives'));
		edit_alternatives.push(alternative);
	}
};

function getEditNodes(selectednodes) {
	if (selectednodes.length == 0) {
		console.log("Error: No nodes selected.")
		return [];
	}
	var prevNode = selectednodes[0].previousSibling;
	var nextNode = selectednodes[selectednodes.length - 1].nextSibling;

	var prevnodes = [ prevNode ];
	var nextnodes = [ nextNode ];
	var temp = prevnodes.concat(selectednodes)
	var allnodes = temp.concat(nextnodes);
	return allnodes;
};

function getSelectedNodes() {
	if (window.getSelection) {
		var sel = window.getSelection();
		if (!sel.isCollapsed) {
			return getRangeSelectedNodes(sel.getRangeAt(0));
		} else {
			if (window.getSelection().anchorNode.parentNode.tagName == "SPAN") {
				return [ window.getSelection().anchorNode.parentNode ];
			} else if (window.getSelection().anchorNode.tagName == "SPAN") {
				return [ window.getSelection().anchorNode ];
			} else {
				console.log(window.getSelection().anchorNode.tagName);
			}
		}
	}
	return [];
};