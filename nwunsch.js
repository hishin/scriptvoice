"use strict";
function NeedlemanWunsch() {
	this.pmatch = 1;
	this.pmis = -2;
	this.pgap = -1;

	this.script1 = null;
	this.script2 = null;
	this.cost = [];
	this.directions = [];

	this.setScripts = function(script_1, script_2) {
		this.script1 = script_1;
		this.script2 = script_2;
		this.cost = [];
		this.directions = [];
	};

	this.alignUtter = function() {
		var text1 = this.script1.getWords();
		var text2utters = this.script2.getUtterances();
		var nutter = text2utters.length;
		var begin = 0;
		var end;
		var text2;
		var umatch, umatch1to2, umatch2to1;
		var match1to2 = [];
		var match2to1 = [];
		for (var i = 0; i < nutter; i++) {
			var utterance = text2utters[i];
			end = begin + utterance.length;
			text2 = this.script2.getWordsRange(begin, end);
			umatch = this.alignTexts(text1, text2);
			umatch1to2 = umatch.match1to2;
			umatch2to1 = umatch.match2to1;
			for (var m = 0; m < umatch1to2.length; m++) {
				var fixedm = umatch1to2[m] + begin;
				match1to2.push(fixedm);
			}
			match2to1 = match2to1.concat(umatch2to1);
		}
		return new Match(this.script1, this.script2, match1to2, match2to1);
	};

	this.alignTexts = function(text1, text2) {
		this.length1 = text1.length;
		this.length2 = text2.length;

		// initialize cost and direction matrix
		for (var n = 0; n < this.length1 + 1; n++) {
			this.cost[n] = new Array(this.length2 + 1);
			this.directions[n] = new Array(this.length2 + 1);
		}

		this.cost[0][0] = 0.;
		for (var i = 1; i <= this.length1; i++) {
			this.cost[i][0] = this.cost[i - 1][0] + this.pgap;
		}
		for (var j = 1; j <= this.length2; j++) {
			this.cost[0][j] = this.cost[0][j - 1] + this.pgap;
		}

		// propagate this.cost
		var top, left, diag;
		for (var i = 1; i <= this.length1; i++) {
			for (var j = 1; j <= this.length2; j++) {
				top = this.cost[i - 1][j] + this.pgap;
				left = this.cost[i][j - 1] + this.pgap;
				diag = this.cost[i - 1][j - 1]
						+ (NeedlemanWunsch.isMatch(text1[i - 1], text2[j - 1]) ? this.pmatch
								: this.pmis);
				this.cost[i][j] = Math.max(top, left, diag);

				/*
				 * Store direction from which score was assigned When there are
				 * two ways that have the same score, we assign diagonal the
				 * highest priority, then top and then left.
				 */
				if (this.cost[i][j] == left) {
					this.directions[i][j] = 'l';
				} else if (this.cost[i][j] == top) {
					this.directions[i][j] = 't';
				} else if (this.cost[i][j] == diag) {
					this.directions[i][j] = 'd';
				}
			}
		}
		var matches = this.getMatchArrays();
		return new Match(this.script1, this.script2, matches[0], matches[1]);
	}

	this.align = function() {
		var text1 = this.script1.getWords();
		var text2 = this.script2.getWords();

		return this.alignTexts(text1, text2);
	};

	this.makeCostTable = function() {
		var tmp_text1 = this.text1.slice();
		tmp_text1.unshift([ ' ' ]);
		var tmp_text2 = this.text2.slice();
		tmp_text2.unshift(' ', ' ');

		var table = $("<table/>").addClass('dataTable');
		var row = $("<tr/>");
		for (var n = 0; n < tmp_text2.length; n++) {
			row.append($("<th/>").text(tmp_text2[n]));
		}
		table.append(row);

		for (var i = 0; i <= this.length1; i++) {
			row = $("<tr/>");
			row.append($("<th/>").text(tmp_text1[i]));
			for (var j = 0; j <= this.length2; j++) {
				var d = (this.directions[i][j] == undefined ? ''
						: this.directions[i][j]);
				row.append($("<td/>").text(this.cost[i][j] + " " + d));
			}
			table.append(row);
		}
		return table;
	};

	/**
	 * Returns correspondence between two lists. Call after alignment is
	 * computed using align().
	 * 
	 * @return corr1: indices into list2 from list1
	 * @return corr2: indices into list1 from list2
	 */
	this.getMatchArrays = function() {
		var corr1 = new Array(this.length1);
		var corr2 = new Array(this.length2);
		var i = this.length1;
		var j = this.length2;

		while (i > 0 || j > 0) {
			if (i == 0) { // text2[j-1] corresponds to a gap in text1
				corr2[j - 1] = -1;
				j--;
			} else if (j == 0) { // text1[i-1] corresponds to a gap in text2
				corr1[i - 1] = -1;
				i--;
			} else if (this.directions[i][j] == 'l') { // text2[j-1]
				// corresponds to a gap
				// in text1
				corr2[j - 1] = -1;
				j--;
			} else if (this.directions[i][j] == 't') { // text1[i-1]
				// corresponds to a gap
				// in text2
				corr1[i - 1] = -1;
				i--;
			} else if (this.directions[i][j] == 'd') { // text1[i-1]
				// corresponds to
				// text2[j-1]
				corr1[i - 1] = j - 1;
				corr2[j - 1] = i - 1;
				i--;
				j--;
			}
		}
		return [ corr1, corr2 ];
	};

	this.traceback = function() {

		var text1_align = [];
		var text2_align = [];

		var i = this.length1;
		var j = this.length2;

		while (i > 0 || j > 0) {
			if (i == 0) {
				text1_align.push('-');
				text2_align.push(text2[j - 1]);
				j--;
			} else if (j == 0) {
				text1_align.push(text1[i - 1]);
				text2_align.push('-');
				i--;
			} else if (this.directions[i][j] == 'l') { // move from left: gap
				// in text 1
				text1_align.push('-');
				text2_align.push(text2[j - 1]);
				j--;
			} else if (this.directions[i][j] == 't') { // move from top: gap in
				// text 2
				text1_align.push(text1[i - 1]);
				text2_align.push('-');
				i--;
			} else if (this.directions[i][j] == 'd') { // diagonal move
				text1_align.push(text1[i - 1]);
				text2_align.push(text2[j - 1]);
				i--;
				j--;
			}
		}

		return [ text1_align, text2_align ];
	};
}

// strip punctuation and make lowercase
NeedlemanWunsch.strip = function(text) {
	var stripped = text.replace(/[.,!?;:()]/g, "").trim().toLowerCase();
	return stripped;
};

NeedlemanWunsch.isMatch = function(text1, text2) {
	var text1strip = NeedlemanWunsch.strip(text1);
	var text2strip = NeedlemanWunsch.strip(text2);
	return text1strip == text2strip;
};

NeedlemanWunsch.matchAlternative = function(alternatives, word) {
	if (alternatives == null)
		return false;
	for (var i = 0; i < alternatives.length; i++) {
		if (NeedlemanWunsch.isMatch(alternatives[i], word)) {
			return true;
		}
	}
	return false;
};

var Match = function(script1, script2, match1to2, match2to1) {
	var self = this;
	this.script1 = script1;
	this.script2 = script2;
	this.match1to2 = match1to2;
	this.match2to1 = match2to1;
}
