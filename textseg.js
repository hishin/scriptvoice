"use strict";

var TextSegment = function(source, start_index, end_index) {
	var self = this;
	var src = source;
	var start = start_index;
	var end = end_index;
	

		
};



function TextSeg(masterscript, transcript, m_s2t, m_t2s) {
	this.mswords = masterscript.getWords();
	this.twords = transcript.getWords();
	this.n_mswords = this.mswords.length;
	this.n_twords = this.twords.length;
	this.ms_segwords = [];
	this.t_segwords = [];
	this.n_mssegs = 0;
	this.n_tsegs = 0;
	this.ms_breaks = []; // index of last word in each segment for MasterScript
	this.t_breaks = []; // index of last word in each segment for Transcript 
	// initialize default segments
	this.msseg = Array.apply(null, Array(this.n_mswords).map(Number.prototype.valueOf, -1.0));
	this.tseg = Array.apply(null, Array(this.n_twords).map(Number.prototype.valueOf, -1.0));
	
	// punctuation score for master script
	this.mspunctscore = Array.apply(null, Array(this.n_mswords).map(Number.prototype.valueOf, -1.0));
	var s = 0;
	for (var i = 0; i < this.n_mswords; i++) {
		this.mspunctscore[i] = punctScore(this.mswords[i]);
		this.msseg[i] = s;
		if (this.mspunctscore[i] > 1.0) s++;
	}
	
	// pause score for transcript
	this.tpausescore = Array.apply(null, Array(this.n_twords).map(Number.prototype.valueOf, -1.0));
	for (var i = 0; i < this.n_twords - 1; i++) {
		this.tpausescore[i] =  this.twords[i+1].tstart - this.twords[i].tfinish;
	} 	
	
	
	this.tpausescore[this.n_twords-1] = -1.0;
	console.log(this.tpausescore);
	for (var i = 0; i < this.n_twords; i++) {
		this.tseg[i] = this.twords[i].utterance;
	}
	
//	this.msbreakscore = Array.apply(null, Array(this.n_mswords).map(Number.prototype.valueOf, 0));
//	for (var i = 0; i < this.n_mswords; i++) {
//		var s_punct = punctScore(this.mswords[i]);
//		var prev_m = findPrevMatch(m_s2t, i);
//		var next_m = findNextMatch(m_s2t, i);
//		var s_pause = -1.0;
//		if (prev_m == -1 || next_m == -1)
//			s_pause = 0.0;
//		else {
//			var pause;
//			for (var m = prev_m + 1; m <= next_m; m++) {
//				pause = this.twords[m].tstart - this.twords[m-1].tfinish - 1.0;
//				s_pause = Math.max(s_pause, pause);
//			}
//		}
//		console.log(i + ", " + s_pause);
//		var score = s_punct;// + s_pause;
//		this.msbreakscore[i] = score;
//	}
		
	// mslinescore[i][j]: score of a masterscript line containing words i
	// through j
	this.mslinescore = new Array(this.n_mswords);
	for (var i = 0; i < this.n_mswords; i++) {
	  this.mslinescore[i] = Array.apply(null, Array(this.n_mswords)).map(Number.prototype.valueOf, 0);
	}
	// tlinescore[i][j]: score of a transcript line containing words i through j
	this.tlinescore = new Array(this.n_twords);
	for (var i = 0; i < this.n_twords; i++) {
		this.tlinescore[i] = Array.apply(null, Array(this.n_twords)).map(Number.prototype.valueOf, 0);
	}

	// totalscore[i]: score of optimal line breaks for words 0 through i
	this.mstotalscore = Array.apply(null, Array(this.n_mswords)).map(Number.prototype.valueOf,Number.NEGATIVE_INFINITY);
	this.ttotalscore = Array.apply(null, Array(this.n_twords)).map(Number.prototype.valueOf, Number.NEGATIVE_INFINITY);
	
	// trace: optimal line consists of word[trace[n]] through word[n]
	this.mstrace = Array.apply(null, Array(this.n_mswords)).map(Number.prototype.valueOf, 0);
	this.ttrace = Array.apply(null, Array(this.n_twords)).map(Number.prototype.valueOf, 0);
	
	// Compute line score. The value linescore[i][j] indicates
	// score of putting words [i,j] in a single line
	this.computeMSLineScore = function(){
	    for (var i = 0; i < this.n_mswords; i++) {
	        for (var j = i; j < this.n_mswords; j++) {
	        		this.mslinescore[i][j] = this.scriptLineScore(i,j);

	        }
	    }
	};
	
	this.computeTLineScore = function(){
		for (var i = 0; i < this.n_twords; i++) {
			for (var j = i; j < this.n_twords; j++) {
				this.tlinescore[i][j] = this.transcriptLineScore(i,j);
			}
		}
	};
		
    // Compute maximum score and find maximum-score arrangement.
    // The value totalscore[i] indicates optimized score to arrange words [0,i]
	this.computeMSTotalScore = function() {
		this.mstotalscore[0] = this.mslinescore[0][0];
		for (var i = 1; i < this.n_mswords; i++) {
			this.mstotalscore[i] = Number.NEGATIVE_INFINITY;
			for (var j = 0; j <= i; j++) {
				var tempscore;
				if (j == 0) tempscore = this.mslinescore[j][i];
				else tempscore = this.mstotalscore[j-1] + this.mslinescore[j][i]; 			
				if (this.mstotalscore[i] < tempscore) {
					this.mstotalscore[i] = tempscore;
					this.mstrace[i] = j;
				}
			}
		}
	};
	
    this.computeTranTotalScore = function() {
    		this.ttotalscore[0] = this.tlinescore[0][0];
    		for (var i = 1; i < this.n_twords; i++) {
    			this.ttotalscore[i] = Number.NEGATIVE_INFINITY;
    			for (var j = 0; j <=i; j++) {
    				var tempscore;
    				if (j==0) tempscore = this.tlinescore[j][i];
    				else tempscore = this.ttotalscore[j-1] + this.tlinescore[j][i];
    				if (this.ttotalscore[i] < tempscore) {
    					this.ttotalscore[i] = tempscore;
    					this.ttrace[i] = j;
    				}
    			}
    		}
    };
	
	// Score of a line containing words i through j
	this.scriptLineScore = function(i, j) {
		var score = this.mspunctscore[j] + 0.5*this.matchConsistencyScore(m_s2t, i, j) + this.matchSegConsistencyScore(m_s2t, this.tseg, i, j) - 2.0;
		return score;
	};
	
	this.transcriptLineScore = function(i, j) {
		var score =  this.tpausescore[j] + 0.5*this.matchConsistencyScore(m_t2s, i, j) + this.matchSegConsistencyScore(m_t2s, this.msseg, i, j) - 2.0;
		return score;
	}
	
	// Score for consistency in match for words [i, j]
	// A segment should either have a match or not.
	this.matchConsistencyScore = function(match, i, j) {
		var nmatch = 0;
		for (var n = i; n <= j; n++) {
			if (match[n] != -1)
				nmatch++;
		}
		var pmatch = nmatch / (j-i+1);
		// Score is higher if pmatch is close to 0 or 1: abs(2*pmatch-)
		var score = Math.abs(2*pmatch - 1);
		return score;
	};
	
	// Score for consistency in matching segments: 
	// A segment should match an entire segment or not.
	this.matchSegConsistencyScore = function(match, seg, i, j) {
		var prev_m = findPrevMatch(match, j);
		var next_m = findNextMatch(match, j);
		var segcut_score;
		if (prev_m == -1 || next_m == -1)
			segcut_score = 1.0;
		else if (seg[prev_m] != seg[next_m]) { // if the cut is between different segments
			segcut_score = 1.0;
		} else {
			segcut_score = -1.0;
		}

		return segcut_score;
	}
	
	// Score to enforce that a segment matches at most 1 segment
	this.uniqueSegMatchScore = function(match, seg, i, j) {
		// index into matching text
		var start_m = match[i]; 
		var end_m = match[j]; 
		
		var match_segs = seg.slice(start_m, end_m+1);
		match_segs = match_segs.filter(function(a){return a>-1;}); // get all matching segment ids
		
		var counts = {};
		console.log(match_segs);
		for (var m = 0; m < match_segs.length; m++) {
			counts[match_segs[m]] = 1 + (counts[match_segs[m]] || 0);
		}
		console.log(counts);
		if (counts.length > 1) {
			return -10.0;
		}
		return 0.0;
		
	}
	
	// Score for script punctuation
	function punctScore(word) {
		var comma = new RegExp("[,]");
		var period = new RegExp("[!?.]");
		var newline = new RegExp("\\n");
		
		if (newline.test(word)) {
			console.log("This is a newline: " + word);
			return 3;
		}
		if (comma.test(word))
			return 2;
		if (period.test(word))
			return 1.5;
		
		// penalty for splitting at non-punctuation
		return -1.0;
	};
	
	// Returns index of closest next match, -1 if none.
	function findNextMatch(match, i) {
		for (var j = i+1; j < match.length; j++) {
			if (match[j] != -1)
				return match[j];
		}
		return -1;
	};
	
	// Returns index of closest previous match, -1 if none.
	function findPrevMatch(match, i) {
		for (var j = i; j >= 0; j--) {
			if (match[j] != -1)
				return match[j];
		}
		return -1;
	};
	
	// Print segments
	this.printTextSegments = function(words, segtrace, n) {
		if (segtrace[n] > 0) {
			this.printTextSegments(words, segtrace, segtrace[n] - 1);
		}
		console.log(words.slice(segtrace[n], n+1) + "\n");
	};
	
	// Store segmentation results in this.ms_segwords & this.msseg 
	this.computeMasterScriptSegments = function () {
		console.log(this.mstrace);
		this.ms_segwords = [];
		this.ms_breaks = [];
		var n = this.n_mswords - 1;
		var segindex = 0;
		while (this.mstrace[n] >= 0) {
			this.ms_breaks.push(n);
			this.ms_segwords.push(this.mswords.slice(this.mstrace[n], n+1));
			for (var i = this.mstrace[n]; i <= n; i++) {
				this.msseg[i] = segindex;
			}
			segindex++;
			n = this.mstrace[n] - 1;
		}
		// reverse segments and index
		this.ms_segwords.reverse();
		this.ms_breaks.push(-1);
		this.ms_breaks.reverse();
		console.log("ms_breaks");
		console.log(this.ms_breaks);
		this.n_msseg = this.ms_segwords.length;
		for (var i = 0; i < this.msseg.length; i++) this.msseg[i]  = this.n_msseg - this.msseg[i] -1;
	};
	
	this.computeTranscriptSegments = function() {
		this.t_segwords = [];
		this.t_breaks = [];
		var n = this.n_twords - 1;
		var segindex = 0;
		while (this.ttrace[n] >= 0) {
			this.t_breaks.push(n);
			this.t_segwords.push(this.twords.slice(this.ttrace[n], n+1).map(function(a){return a.word}));
			for (var i = this.ttrace[n]; i <= n; i++) {
				this.tseg[i] = segindex;
			}
			segindex++;
			n = this.ttrace[n] - 1;
		}		
		this.t_segwords.reverse();
		this.t_breaks.push(-1);
		this.t_breaks.reverse();
		this.n_tseg = this.t_segwords.length;
		for (var i = 0; i < this.tseg.length; i++) this.tseg[i]  = this.n_tseg - this.tseg[i] -1;
	};
	
	// Get segmented script text
	this.getSegmentText = function(segwords) {
		var text='';
		for (var i = 0; i < segwords.length; i++) {
			for (var j = 0; j < segwords[i].length; j++) {
					text = text + segwords[i][j] + ' ';
			}
			text = text + '<br><br>';
		}
		return text;
	};
	
	this.getMasterScriptSegmentText = function () {
		return this.getSegmentText(this.ms_segwords);
	};
	
	this.getTranscriptSegmentText = function() {
		return this.getSegmentText(this.t_segwords);
	};
	
	this.getTranscriptSegment = function (id) {
		if (id >= this.t_segwords.length) {
			console.log("Error: index exceeds segment length");
			return;
		}
		return this.t_segwords[id];
	};
	
	this.getMasterScriptSegment = function (id) {
		if (id >= this.ms_segwords.length) {
			console.log("Error: index exceeds segment length");
			return;
		}
		return this.ms_segwords[id];		
	};
	
	this.segmentMS = function() {
		// Compute MasterScript Segments
		this.computeMSLineScore(); 
		this.computeMSTotalScore(); 
		this.computeMasterScriptSegments(); 
	};
	
	this.segmentT = function() {
		// Compute Transcript Segments
		this.computeTLineScore();
		this.computeTranTotalScore();
		this.computeTranscriptSegments();		
	};
	
	this.iterateSegment = function() {
		this.segmentMS();
		this.segmentT();
	};	
};

function isSegRecorded(corr, thres) {
	// Returns true if more than 50% of words in seg has correspondence
	thres = typeof thres !== 'undefined' ? thres : 0.50;
	var count = 0;
	for (var i = 0; i < corr.length; i++) {
		if (corr[i] >= 0) count++;
	}
	if (count/corr.length >= thres) return true;
//	console.log("Segment is not recorded: " + count + " / " + corr.length);
	return false;
};

/** Given lists of mutual correspondence 
 * @param correspondence lists: m1, m2
 * @param start index for m1: s1
 * @param end index for m1: e1
 * @param start index for m2: s2
 * @param end index for m2: e2
 */
function segmentMatchScore (m1, s1, e1, m2, s2, e2) {
	var mcount = 0; // total number of matches
	for (var i = s1; i <= e1; i++) {
		if (s2 <= m1[i] && m1[i] <= e2) mcount++;
	}
	mcount *= 2;
	
	return mcount/(e1-s1+1+e2-s2+1);
}


