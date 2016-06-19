"use strict"

/**
 * Save nodes that could be affected by this keystroke and other nodes that may
 * be affected by them
 */
var edit_nodes;
var edit_nodes_affected;

function printSpans(spans) {
	var string = '';
	for (var i = 0; i < spans.length; i++) {
		string += spans[i].innerText;
	}
	console.log(string);
};

function markNodes(event) {
	if (!isPrintable(event.which))
		return;

	var selected_spans = getSelectedSpans();
	markDirty(selected_spans);
//	var dirtied_spans = getDirtySpans(selected_spans);
//	markDirty(dirtied_spans);

	if (event.which == 13) {
		var doxExec = false;
		try {
			doxExec = document.execCommand('insertBrOnReturn', false, true);
		} catch (error) {
		}
		if (doxExec) {
			return true;
		} else {
			event.preventDefault();

			var selection = window.getSelection(), range = selection
					.getRangeAt(0), br = document.createElement('br');

			range.deleteContents();

			range.insertNode(br);

			range.setStartAfter(br);

			range.setEndAfter(br);

			range.collapse(false);

			selection.removeAllRanges();

			selection.addRange(range);

			return false;
		}
	}

};

function markDirty(nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		$(node).addClass('dirty');
	}
};

function markClean(nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		$(node).removeClass('dirty');
	}
};

function markEdited(nodes) {
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		$(node).addClass('edited');
	}
};

function getSelectedSpans() {
	var sel = window.getSelection();
	if (!sel.isCollapsed) {
		return getRangeSelectedNodes(sel.getRangeAt(0));
	} else {
		var parentnode = window.getSelection().anchorNode.parentNode;
		var node = window.getSelection().anchorNode;
		if (parentnode.tagName == "SPAN" && inMasterscript(parentnode)) {
			return [ parentnode ];
		} else if (node.tagName == "SPAN" && inMasterscript(node)) {
			return [ node ];
		} else if (node.firstChild && node.firstChild.tagName == "SPAN") {
			return [ node.firstChild ];
		} else {
			return [];
		}
	}
};

function getDirtySpans(spans) {
	if (spans.length == 0)
		return [];
	var prevnode = prevNode(spans[0]);
	var nextnode = nextNode(spans[spans.length - 1]);
	var prevnodes = [];
	while (prevnode) {
		if (prevnode.tagName == "SPAN" && inMasterscript(prevnode)
				&& !isLongPause(prevnode))
			prevnodes.push(prevnode);
		else if (prevnode.tagName == "SPAN" && inMasterscript(prevnode)
				&& (isLongPause(prevnode) || !isRecorded(prevnode)))
			break;
		prevnode = prevNode(prevnode);
	}
	prevnodes.reverse();

	var nextnodes = [];
	prevnode = spans[spans.length - 1];
	while (nextnode) {
		if (nextnode.tagName == "SPAN" && inMasterscript(nextnode)
				&& !isLongPause(prevnode)) {
			nextnodes.push(nextnode);
			prevnode = nextnode;
		} else if (nextnode.tagName == "SPAN" && inMasterscript(nextnode)
				&& (isLongPause(prevnode) || !isRecorded(prevnode)))
			break;
		nextnode = nextNode(nextnode);
	}

	var temp = prevnodes.concat(spans)
	var allspans = temp.concat(nextnodes);
	return allspans;
};

function getRangeSelectedNodes(range) {
	var node;

	if (range.startContainer.parentNode.tagName == "SPAN") {
		node = range.startContainer.parentNode;
	} else if (range.startContainer.tagName == "SPAN") {
		node = range.startContainer;
	} else if (range.startContainer.firstChild.tagName == "SPAN") {
		node = range.startContainer.firstChild;
	}

	var endNode;
	if (range.endContainer.parentNode.tagName == "SPAN") {
		endNode = range.endContainer.parentNode;
	} else if (range.endContainer.tagName == "SPAN") {
		endNode = range.endContainer;
	} else if (range.endContainer.firstChild.tagName == "SPAN") {
		endNode = range.endContainer.firstChild;
	}

	// Special case for a range that is contained within a single node
	if (node == endNode && inMasterscript(node)) {
		return [ node ];
	}

	// Iterate nodes until we hit the end container
	var rangeNodes = [];
	while (node && node != endNode) {
		if (node.tagName == "SPAN" && inMasterscript(node))
			rangeNodes.push(node);
		node = nextNode(node);
	}

	// Add partially selected nodes at the start of the range
	node = range.endContainer;
	while (node && node != range.commonAncestorContainer) {
		if (node.tagName == "SPAN" && inMasterscript(node))
			rangeNodes.push(node);
		node = node.parentNode;
	}
	return rangeNodes;
};

function nextNode(node) {
	if (node.hasChildNodes()) {
		return node.firstChild;
	} else {
		while (node && !node.nextSibling) {
			node = node.parentNode;
		}
		if (!node) {
			return null;
		}
		return node.nextSibling;
	}
};

function prevNode(node) {
	if (node.hasChildNodes()) {
		return node.lastChild;
	}
	while (node && !node.previousSibling) {
		node = node.parentNode;
	}
	if (!node) {
		return null;
	}
	return node.previousSibling;

};

function inMasterscript(node) {
	while (node && node.parentNode) {
		if (hasClass(node, "masterscript-seg")) {
			return true;
		}
		node = node.parentNode;
	}
	return false;

};

function hasClass(node, cls) {
	return (' ' + node.className + ' ').indexOf(' ' + cls + ' ') > -1;
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

function markSelectedDirty() {
	var selectedspans = getSelectedSpans();
	markDirty(selectedspans);
};

function markSelectedClean() {
	var selectedspans = getSelectedSpans();
	markClean(selectedspans);
};

/**
 * Functions below this point are currently not used
 */

function getAffectedNodes(selectednodes) {
	if (selectednodes.length == 0)
		return [];
	var prevNode = selectednodes[0].previousSibling;
	var nextNode = selectednodes[selectednodes.length - 1].nextSibling;
	var prevnodes = [];
	while (prevNode && !isLongPause(prevNode)) {
		prevnodes.push(prevNode);
		prevNode = prevNode.previousSibling;
	}
	prevnodes.reverse();

	var nextnodes = [];
	prevNode = selectednodes[selectednodes.length - 1];
	while (nextNode && !isLongPause(prevNode)) {
		nextnodes.push(nextNode);
		prevNode = nextNode;
		nextNode = nextNode.nextSibling;
	}

	var temp = prevnodes.concat(selectednodes)
	var allnodes = temp.concat(nextnodes);
	return allnodes;

};

function saveEditNodes() {
	// nodes that are possibly edited by this keydown
	var selectednodes = getSelectedNodes();
	// including previous node and next node
	edit_nodes = getEditNodes(selectednodes);
	for (var i = 0; i < edit_nodes.length; i++) {
		console.log(edit_nodes[i]);
	}

	edit_nodes_affected = [];
	for (var i = 0; i < edit_nodes.length; i++) {
		var affectednodes = getAffectedNodes([ edit_nodes[i] ]);
		edit_nodes_affected.push(affectednodes);
	}
};

function editMasterscript(event) {
	if (isPrintable(event.keyCode)) {
		var dirtynodes = getDirtyNodes(edit_nodes);
		markDirty(dirtynodes);
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

/**
 * Check if keystroke altered or deleted the nodes
 */
function getDirtyNodes(edit_nodes) {
	var dirtynodes = [];
	for (var i = 0; i < edit_nodes.length; i++) {
		var origword = edit_nodes[i].getAttribute('data-word');
		// if the node was deleted
		if (!document.body.contains(edit_nodes[i])) {
			for (var j = 0; j < edit_nodes_affected[i].length; j++) {
				dirtynodes.push(edit_nodes_affected[i][j]);
			}
		} else if (!NeedlemanWunsch.isMatch(origword, $(edit_nodes[i]).text())) {
			for (var j = 0; j < edit_nodes_affected[i].length; j++) {
				dirtynodes.push(edit_nodes_affected[i][j]);
			}
		}
	}
	return dirtynodes;
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

