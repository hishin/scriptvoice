function mergeSegs(mswords, twords, msbreaks, corr_ms2t) {
	
	var n_msseg = msbreaks.length - 1;
	
	var segs = [];
	var sources = []; // indicates whether segment is from MasterScript or transcript 
	
	//iterate through each msseg
	var prev_tid = -1;
	for (var i = 0; i < n_msseg; i++) {
		var ms_start = msbreaks[i] + 1;
		var ms_end = msbreaks[i+1];
		
		// find corresponding tsegs
		var tids = corr_ms2t.slice(ms_start, ms_end+1);
		var cur_tid = minID(tids);
		console.log("min_tid: " + cur_tid);
		
		// append transcript segs
		if (prev_tid + 1 < cur_tid) {
			segs.push(twords.slice(prev_tid+1, cur_tid).map(function(a){return a.word}));
			sources.push(3);
		}

		// append masterscript seg
		segs.push(mswords.slice(ms_start, ms_end+1));
		sources.push(2);
		prev_tid = Math.max(prev_tid, maxID(tids));
	}

	if (prev_tid + 1 < twords.length) {
		segs.push(twords.slice(prev_tid+1, twords.length).map(function(a){return a.word}));
		sources.push(3);
	}	
	
	return [segs, sources];
};


function findSegmentID(ids, tbreaks) {
	// assume that each segment corresponds to at most one segment
	for (var i = 0; i < ids.length; i++) {
		if (ids[i] == -1) // no correspondence
			continue;
		for (var j = 0; j < tbreaks.length-1; j++) { 
			if (tbreaks[j] < ids[i] && ids[i] <= tbreaks[j+1] ) {
				return j;
			}
		}
	}		
	return -1;
};

function minID(ids) {
	var temp = ids.filter(function(a){return a>-1;});
	if (temp.length == 0) return -1;
	return Math.min.apply(Math, temp);
};

function maxID(ids) {
	return Math.max.apply(Math, ids);
};
