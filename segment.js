"use strict";

var TextSegment = function(script_src, start_index, end_index) {

	this.script = script_src;
	this.start = start_index;
	this.end = end_index;
	this.matchingSegs = [];

	this.getSpan = function() {
		return Script.tokens2spans(this.script.getTokens().slice(this.start, this.end+1));
	};
};

TextSegment.matchScore = function(seg1, seg2, match) {
	if (match.script1 != seg1.script || match.script2 != seg2.script) {
		console.log("Error: inconsistent segment and match arguments!")
		return;
	}

	var mcount = 0; // total number of matching tokens
	for (var i = seg1.start; i <= seg1.end; i++) {
		if (seg2.start <= match.match1to2[i] && match.match1to2[i] <= seg2.end) {
			mcount++;
		}
	}
	mcount *= 2;

	return mcount / (seg1.end - seg1.start + 1 + seg2.end - seg2.start + 1);
};

TextSegment.matchSegments = function(segs1, segs2, match)
{
	for (var i = 0; i < segs1.length; i++) segs1[i].matchingSegs = [];
	for (var i = 0; i < segs2.length; i++) segs2[i].matchingSegs = [];
	
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

var Segmenter = function(txt_src1, txt_src2, match) {

	// pause score btw src.tokens[i], src.tokens[i+1]
	var pauseScore = function(src, i) {
		var token1 = src.getToken(i);

		// src.token[i] is last token
		if (src.getTokens().length <= i + 1) {
			return 0;
		}

		var token2 = src.getToken(i + 1);
		if (!token1.isRecorded && !token2.isRecorded) {
			return punctuationScore(token1.word);
		} else if (token1.isRecorded != token2.isRecorded) {
			return 1.0;
		} else {
			return token2.tstart - token1.tend;
		}
	};

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

	// Score for punctuation in unrecorded text
	function punctuationScore(word) {
		var comma = new RegExp("[,]");
		var period = new RegExp("[!?.]");
		var newline = new RegExp("\\n");

		if (newline.test(word) || period.test(word))
			return 1.5;
		if (comma.test(word))
			return 0.15;
		return -1.0;
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
		for (var i = 0; i < n1Tokens; i++) {
			for (var j = i; j < n1Tokens; j++) {
				src1LineScore[i][j] = getSrc1LineScore(i, j);

			}
		}
	};

	var computeSrc2LineScore = function() {
		for (var i = 0; i < n2Tokens; i++) {
			for (var j = i; j < n2Tokens; j++) {
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
		return segs;
	};

	this.segmentSrc1 = function() {
		computeSrc1LineScore();
		computeTotalScore(src1TotalScore, src1Trace, src1LineScore);
		src1Segments = getSegments(src1, src1Trace, src1SegIDs);
	};

	this.segmentSrc2 = function() {
		computeSrc2LineScore();
		computeTotalScore(src2TotalScore, src2Trace, src2LineScore);
		src2Segments = getSegments(src2, src2Trace, src2SegIDs);
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
	var src1 = txt_src1;
	var src2 = txt_src2;
	var src1Tokens = src1.getTokens();
	var src2Tokens = src2.getTokens();
	var match1to2 = match.match1to2;
	var match2to1 = match.match2to1;

	// length of each src
	var n1Tokens = src1Tokens.length;
	var n2Tokens = src2Tokens.length;

	// output segments
	var src1Segments = null;
	var src2Segments = null;

	var src1PauseScore = [];
	var src1SegIDs = [];
	var segID = 0;
	for (var i = 0; i < n1Tokens; i++) {
		src1PauseScore.push(pauseScore(src1, i))
		src1SegIDs.push(segID);
		if (src1PauseScore[i] > Segmenter.LONGPAUSE)
			segID++;
	}


	var src2PauseScore = [];
	var src2SegIDs = [];
	segID = 0;
	for (var i = 0; i < n2Tokens; i++) {
		src2PauseScore.push(pauseScore(src2, i));
		src2SegIDs.push(segID);
		if (src2PauseScore[i] > Segmenter.LONGPAUSE)
			segID++;
	}

	// LineScore[i][j]: score of a line containing tokens i through j
	var src1LineScore = new Array(n1Tokens);
	for (var i = 0; i < src1LineScore.length; i++) {
		src1LineScore[i] = Array.apply(null, Array(n1Tokens)).map(
				Number.prototype.valueOf, 0);
	}
	var src2LineScore = new Array(n2Tokens);
	for (var i = 0; i < src2LineScore.length; i++) {
		src2LineScore[i] = Array.apply(null, Array(n2Tokens)).map(
				Number.prototype.valueOf, 0);
	}

	// TotalScore[i]: score of optimal line breaks for tokens 0 through i
	var src1TotalScore = Array.apply(null, Array(n1Tokens)).map(
			Number.prototype.valueOf, Number.NEGATIVE_INFINITY);
	var src2TotalScore = Array.apply(null, Array(n2Tokens)).map(
			Number.prototype.valueOf, Number.NEGATIVE_INFINITY);

	// Trace: optimal line consists of word[trace[n]] through word[n]
	var src1Trace = Array.apply(null, Array(n1Tokens)).map(
			Number.prototype.valueOf, 0);
	var src2Trace = Array.apply(null, Array(n2Tokens)).map(
			Number.prototype.valueOf, 0);

	// Print segments
	this.printTextSegments = function(words, segtrace, n) {
		if (segtrace[n] > 0) {
			this.printTextSegments(words, segtrace, segtrace[n] - 1);
		}
		console.log(words.slice(segtrace[n], n + 1) + "\n");
	};

	// Get segmented script text
	this.getSegmentText = function(segwords) {
		var text = '';
		for (var i = 0; i < segwords.length; i++) {
			for (var j = 0; j < segwords[i].length; j++) {
				text = text + segwords[i][j] + ' ';
			}
			text = text + '<br><br>';
		}
		return text;
	};

	this.getMasterScriptSegmentText = function() {
		return this.getSegmentText(this.ms_segwords);
	};

	this.getTranscriptSegmentText = function() {
		return this.getSegmentText(this.t_segwords);
	};

	this.getTranscriptSegment = function(id) {
		if (id >= this.t_segwords.length) {
			console.log("Error: index exceeds segment length");
			return;
		}
		return this.t_segwords[id];
	};

	this.getMasterScriptSegment = function(id) {
		if (id >= this.ms_segwords.length) {
			console.log("Error: index exceeds segment length");
			return;
		}
		return this.ms_segwords[id];
	};

};

Segmenter.LONGPAUSE = 0.5;

function isSegRecorded(corr, thres) {
	// Returns true if more than 50% of words in seg has correspondence
	thres = typeof thres !== 'undefined' ? thres : 0.50;
	var count = 0;
	for (var i = 0; i < corr.length; i++) {
		if (corr[i] >= 0)
			count++;
	}
	if (count / corr.length >= thres)
		return true;
	// console.log("Segment is not recorded: " + count + " / " + corr.length);
	return false;
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
}
