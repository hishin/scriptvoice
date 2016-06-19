"use strict";

var TextSegment = function(src_, start_index, end_index) {
	this.src = src_;
	this.srcTokens = this.src.getTokens();
	this.start = start_index;
	this.end = end_index;
	this.matchingSegs = [];
	this.idx;
	this.tkey = null;
	this.tend = this.srcTokens[this.end].tend;
	this.getTokens = function() {
		return this.srcTokens.slice(this.start, this.end + 1);
	};

	this.getSpan = function(match, trackchange, play) {
		if (trackchange) {
			return this.getDiffViewSpan(match);
		}
		var spans = [];
		var span;
		var capital = false;
		for (var i = this.start; i <= this.end; i++) {
			var token = this.srcTokens[i];
			if (token.isRecorded && i == this.start) {
				capital = true;
			}
			span = token.getSpan(capital, play, this.tend);
			spans.push(span);
			if (token.isLongPause()) {
				spans.push(Script.whiteSpaceSpan());
				capital = true;
			} else {
				spans.push(Script.whiteSpaceSpan());
				capital = false;
			}
		}
		return spans;
	};

	this.getContextIDs = function() {
		var cstart = this.start;
		while (cstart - 1 >= 0 && !this.srcTokens[cstart - 1].isLongPause()) {
			cstart--;
		}

		var cend = this.end;
		while (cend < this.srcTokens.length
				&& !this.srcTokens[cend].isLongPause()) {
			cend++;
		}
		return [ cstart, cend ];
	};

	this.getSpanWithContext = function(match, trackchange) {
		var cstart = this.start;
		while (cstart - 1 >= 0 && !this.srcTokens[cstart - 1].isLongPause()) {
			cstart--;
		}

		var cend = this.end;
		while (cend < this.srcTokens.length
				&& !this.srcTokens[cend].isLongPause()) {
			cend++;
		}

		if (!trackchange) {
			var spans = [];
			var span;
			var capital = false;
			for (var i = cstart; i <= cend; i++) {
				var token = this.srcTokens[i];
				if (token.isRecorded && i == cstart) {
					capital = true;
				}
				span = token.getSpan(capital, true, this.srcTokens[cend].tend);
				spans.push(span);
				if (token.isLongPause()) {
					spans.push(Script.longPauseSpan());
					capital = true;
				} else {
					spans.push(Script.whiteSpaceSpan());
					capital = false;
				}
				if (i < this.start || i > this.end)
					span.attr('data-iscontext', true);
			}
			return spans;
		} else {
			var other_src = (match.script1 == this.src) ? match.script2
					: match.script1;
			var match_idx = (match.script1 == this.src) ? match.match1to2
					: match.match2to1;

			var token, other_tkn;
			var spans = [];
			var span;
			var capital = false;
			var prevm_idx = this.matchingSegs[0].start - 1;
			var curm_idx;

			for (var i = cstart; i <= cend; i++) {
				token = this.srcTokens[i];
				curm_idx = match_idx[i];
				if (token.isRecorded && i == cstart) {
					capital = true;
				}

				if (curm_idx < 0) {
					span = token.getSpan(capital, true,
							this.srcTokens[cend].tend);
					span.attr('data-hasmatch', false);
					span.attr('data-opcode', 'insert');
					if (i < this.start || i > this.end)
						span.attr('data-iscontext', true);
					spans.push(span);
				} else { // has match
					for (var j = prevm_idx + 1; j < curm_idx
							&& j <= this.matchingSegs[0].end; j++) {
						other_tkn = other_src.getToken(j);
						span = other_tkn.getSpan();
						span.attr('data-hasmatch', false);
						span.attr('data-opcode', 'delete');
						if (i < this.start || i > this.end)
							span.attr('data-iscontext', true);
						spans.push(span);
						if (other_tkn.isLongPause()) {
							spans.push(Script.longPauseSpan());
						} else {
							spans.push(Script.whiteSpaceSpan());
						}
					}
					span = token.getSpan(capital, true,
							this.srcTokens[cend].tend);
					span.attr('data-hasmatch', true);
					span.attr('data-opcode', 'equal');
					if (i < this.start || i > this.end)
						span.attr('data-iscontext', true);
					spans.push(span);

					prevm_idx = curm_idx;
				}

				if (token.isLongPause()) {
					spans.push(Script.longPauseSpan());
					capital = true;
				} else {
					spans.push(Script.whiteSpaceSpan());
					capital = false;
				}

			}
			return spans;
		}
	};

	this.getDiffViewSpan = function(match) {
		var other_src = (match.script1 == this.src) ? match.script2
				: match.script1;
		var match_idx = (match.script1 == this.src) ? match.match1to2
				: match.match2to1;
		if (this.matchingSegs.length == 0) {
			var spans = this.getSpan(match, false, this.tend);
			for (var i = 0; i < spans.length; i++) {
				spans[i].attr('data-hasmatch', false);
				spans[i].attr('data-opcode', 'insert');
			}
			return spans;
		}
		var token, other_tkn;
		var spans = [];
		var span;
		var capital = false;
		var prevm_idx = this.matchingSegs[0].start - 1;
		var curm_idx;

		for (var i = this.start; i <= this.end; i++) {
			token = this.srcTokens[i];
			curm_idx = match_idx[i];
			if (token.isRecorded && i == this.start) {
				capital = true;
			}

			if (curm_idx < 0) {
				span = token.getSpan(capital, true, this.tend);
				span.attr('data-hasmatch', false);
				span.attr('data-opcode', 'insert');
				spans.push(span);
			} else { // has match
				for (var j = prevm_idx + 1; j < curm_idx; j++) {
					other_tkn = other_src.getToken(j);
					span = other_tkn.getSpan();
					span.attr('data-hasmatch', false);
					span.attr('data-opcode', 'delete');
					spans.push(span);
					if (other_tkn.isLongPause()) {
						spans.push(Script.longPauseSpan());
					} else {
						spans.push(Script.whiteSpaceSpan());
					}
				}
				span = token.getSpan(capital, true, this.tend);
				span.attr('data-hasmatch', true);
				span.attr('data-opcode', 'equal');
				spans.push(span);

				prevm_idx = curm_idx;
			}

			if (token.isLongPause()) {
				spans.push(Script.longPauseSpan());
				capital = true;
			} else {
				spans.push(Script.whiteSpaceSpan());
				capital = false;
			}

		}
		return spans;
	};
};

TextSegment.matchScore = function(seg1, seg2, match) {

	var mcount = 0; // total number of matching tokens
	for (var i = seg1.start; i <= seg1.end; i++) {
		if (seg2.start <= match.match1to2[i] && match.match1to2[i] <= seg2.end) {
			mcount++;
		}
	}
	mcount *= 2;

	return mcount / (seg1.end - seg1.start + 1 + seg2.end - seg2.start + 1);
};

TextSegment.matchSegments = function(segs1, segs2, match) {
	for (var i = 0; i < segs1.length; i++)
		segs1[i].matchingSegs = [];
	for (var i = 0; i < segs2.length; i++)
		segs2[i].matchingSegs = [];

	for (var i = 0; i < segs2.length; i++) {
		var bestscore = -1.0;
		var bestid = -1;
		for (var j = 0; j < segs1.length; j++) {
			var score = TextSegment.matchScore(segs1[j], segs2[i], match);
			if (score > bestscore) {
				bestscore = score;
				bestid = j;
			}
		}
		if (bestscore > 0.5) {
			segs2[i].matchingSegs.push(segs1[bestid]);
			segs1[bestid].matchingSegs.push(segs2[i]);
		}
	}
};

var Segmenter = function(script1, script2, match) {

	// Score for consistency in match_seq[i, j]
	// Higher score if fraction of match is close to 0 or 1
	var matchConsistencyScore = function(match_seq, i, j) {
		var nmatch = 0;
		for (var n = i; n <= j; n++) {
			if (match_seq[n] != -1)
				nmatch++;
		}
		var pmatch = nmatch / (j - i + 1);
		var score = Math.abs(2 * pmatch - 1);
		return score;
	};

	// Score for consistency in matching segment ids
	var matchSegmentScore = function(match_seq, seg_ids, i, j) {
		var prev_m = findPrevMatch(match_seq, j);
		var next_m = findNextMatch(match_seq, j);
		var score = null;
		if (prev_m == -1 || next_m == -1) // first or last match
			score = 1.0;
		else if (seg_ids[prev_m] != seg_ids[next_m]) { // cut btw different
			// segments
			score = 1.0;
		} else { // cut btw same segments
			score = -1.0;
		}
		return score;
	};

	// Return index of closest next match, -1 if none.
	function findNextMatch(match_seq, i) {
		for (var j = i + 1; j < match_seq.length; j++) {
			if (match_seq[j] != -1)
				return match_seq[j];
		}
		return -1;
	}
	;

	// Return index of closest previous match, -1 if none.
	function findPrevMatch(match_seq, i) {
		for (var j = i; j >= 0; j--) {
			if (match_seq[j] != -1)
				return match_seq[j];
		}
		return -1;
	}
	;

	// Compute LineScore
	var getSrc1LineScore = function(i, j) {
		var score = src1PauseScore[j] + 0.5
				* matchConsistencyScore(match1to2, i, j)
				+ matchSegmentScore(match1to2, src2SegIDs, i, j) - 2.0;
		return score;
	};

	var getSrc2LineScore = function(i, j) {
		var score = src2PauseScore[j] + 0.5
				* matchConsistencyScore(match2to1, i, j)
				+ matchSegmentScore(match2to1, src1SegIDs, i, j) - 2.0;
		return score;
	};

	var computeSrc1LineScore = function() {
		for (var i = 0; i < n1Words; i++) {
			for (var j = i; j < n1Words; j++) {
				src1LineScore[i][j] = getSrc1LineScore(i, j);
			}
		}
	};

	var computeSrc2LineScore = function() {
		for (var i = 0; i < n2Words; i++) {
			for (var j = i; j < n2Words; j++) {
				src2LineScore[i][j] = getSrc2LineScore(i, j);
			}
		}
	};

	var computeTotalScore = function(totalscore, trace, linescore) {
		totalscore[0] = linescore[0][0];
		var tempscore;
		for (var i = 1; i < linescore.length; i++) {
			totalscore[i] = Number.NEGATIVE_INFINITY;
			for (var j = 0; j <= i; j++) {
				if (j == 0)
					tempscore = linescore[j][i];
				else
					tempscore = totalscore[j - 1] + linescore[j][i];
				if (totalscore[i] < tempscore) {
					totalscore[i] = tempscore;
					trace[i] = j;
				}
			}
		}
	};

	// Compute and store segments from total score
	var getSegments = function(src, trace, segIDs) {
		var segs = [];
		var n = trace.length - 1;
		var segindex = 0;
		while (n >= 0) {
			var seg = new TextSegment(src, trace[n], n);
			for (var i = trace[n]; i <= n; i++) {
				segIDs[i] = segindex;
			}
			segs.push(seg);
			segindex++;
			n = trace[n] - 1;
		}
		// reverse segID
		var nsegs = segs.length;
		for (var i = 0; i < segIDs.length; i++) {
			segIDs[i] = nsegs - segIDs[i] - 1;
		}
		segs.reverse();
		for (var i = 0; i < segs.length; i++)
			segs[i].idx = i;
		return segs;
	};

	this.segmentSrc1 = function() {
		if (src1Tokens.length == 0) {
			src1Segments = [];
		} else {
			computeSrc1LineScore();
			computeTotalScore(src1TotalScore, src1Trace, src1LineScore);
			src1Segments = getSegments(src1, src1Trace, src1SegIDs);
		}
	};

	this.segmentSrc2 = function() {
		if (src2Tokens.length == 0)
			src2Segments = [];
		else {
			computeSrc2LineScore();
			computeTotalScore(src2TotalScore, src2Trace, src2LineScore);
			src2Segments = getSegments(src2, src2Trace, src2SegIDs);
		}
	};

	this.getSrc1Segments = function() {
		return src1Segments;
	};

	this.getSrc2Segments = function() {
		return src2Segments;
	};

	this.iterateSegment = function(n) {
		for (var i = 0; i < n; i++) {
			this.segmentSrc1();
			this.segmentSrc2();
		}
	};

	// /////////////////////////////////////////////////////////////////////////////
	// Initialization
	// /////////////////////////////////////////////////////////////////////////////
	var self = this;
	var src1 = script1;
	var src2 = script2;
	var src1Tokens = src1.getTokens();
	var src2Tokens = src2.getTokens();
	var match1to2 = match.script1 == src1 ? match.match1to2 : match.match2to1;
	var match2to1 = match.script2 == src2 ? match.match2to1 : match.match1to2;

	// length of each src
	var n1Words = src1Tokens.length;
	var n2Words = src2Tokens.length;

	// output segments
	var src1Segments = null;
	var src2Segments = null;

	var src1PauseScore = [];
	var src1SegIDs = [];
	var segID = 0;
	for (var i = 0; i < n1Words; i++) {
		src1PauseScore.push(src1Tokens[i].pauseScore)
		src1SegIDs.push(segID);
		if (src1Tokens[i].isLongPause())
			segID++;
	}

	var src2PauseScore = [];
	var src2SegIDs = [];
	segID = 0;
	for (var i = 0; i < n2Words; i++) {
		if (src2Tokens[i].isLongPause())
			src2PauseScore.push(src2Tokens[i].pauseScore + 10.0);
		else
			src2PauseScore.push(src2Tokens[i].pauseScore);

		src2SegIDs.push(segID);
		if (src2Tokens[i].isLongPause())
			segID++;
	}

	// LineScore[i][j]: score of a line containing tokens i through j
	var src1LineScore = new Array(n1Words);
	for (var i = 0; i < src1LineScore.length; i++) {
		src1LineScore[i] = Array.apply(null, Array(n1Words)).map(
				Number.prototype.valueOf, 0);
	}
	var src2LineScore = new Array(n2Words);
	for (var i = 0; i < src2LineScore.length; i++) {
		src2LineScore[i] = Array.apply(null, Array(n2Words)).map(
				Number.prototype.valueOf, 0);
	}

	// TotalScore[i]: score of optimal line breaks for tokens 0 through i
	var src1TotalScore = Array.apply(null, Array(n1Words)).map(
			Number.prototype.valueOf, Number.NEGATIVE_INFINITY);
	var src2TotalScore = Array.apply(null, Array(n2Words)).map(
			Number.prototype.valueOf, Number.NEGATIVE_INFINITY);

	// Trace: optimal line consists of word[trace[n]] through word[n]
	var src1Trace = Array.apply(null, Array(n1Words)).map(
			Number.prototype.valueOf, 0);
	var src2Trace = Array.apply(null, Array(n2Words)).map(
			Number.prototype.valueOf, 0);

};

/**
 * Given lists of mutual correspondence
 * 
 * @param correspondence
 *            lists: m1, m2
 * @param start
 *            index for m1: s1
 * @param end
 *            index for m1: e1
 * @param start
 *            index for m2: s2
 * @param end
 *            index for m2: e2
 */
function segmentMatchScore(m1, s1, e1, m2, s2, e2) {
	var mcount = 0; // total number of matches
	for (var i = s1; i <= e1; i++) {
		if (s2 <= m1[i] && m1[i] <= e2)
			mcount++;
	}
	mcount *= 2;

	return mcount / (e1 - s1 + 1 + e2 - s2 + 1);
};
