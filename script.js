"use strict";

Token.fromObject = function(obj) {
	var t = new Token(obj.word);
	t.isRecorded = obj.isRecorded;
	t.confidence = obj.confidence;
	t.pauseScore = obj.pauseScore;

	t.tstart = obj.tstart;
	t.tend = obj.tend;
	t.audiofile = obj.audiofile;
	t.isDirty = obj.isDirty;
	t.isHesitation = obj.isHesitation;
	t.index = obj.index;
	t.audio_index = obj.audio_index;
	t.comments = [];
	t.utterN = obj.utterN;

	t.alt_words = [];
	t.alt_confidences = [];

	t.isMessage = obj.isMessage;
	return t;
};

function Token(word) {
	this.word = word;
	this.isRecorded = null;
	this.confidence = null;
	this.pauseScore = 0.0;
	this.isLongPause = function() {
		return (this.pauseScore >= Script.LONGPAUSE);
	};
	this.tstart = null;
	this.tend = null;
	this.audiofile = null;
	this.isDirty = null;
	this.isHesitation = null;
	this.index = null;
	this.audio_index = null;
	this.comments = [];
	this.utterN = -1;

	this.alt_words = [];

	this.alt_confidences = [];

	this.isMessage = false;

	this.capitalizedWord = function() {
		return word.charAt(0).toUpperCase() + word.slice(1);
	};

	this.getSpan = function(capitalize, play, playend) {
		var span = $("<span/>");
		if (capitalize)
			span.append(this.capitalizedWord());
		else
			span.append(this.word);

		span.attr('data-word', this.word.trim());
		span.attr('data-isrecorded', this.isRecorded);
		span.attr('data-pausescore', this.pauseScore);
		span.attr('data-islongpause', this.isLongPause());
		span.attr('data-tstart', this.tstart);
		span.attr('data-tend', this.tend);
		span.attr('data-confidence', this.confidence);
		span.attr('data-audiofile', this.audiofile);
		span.attr('data-isdirty', this.isDirty);
		span.attr('data-index', this.index);
		span.attr('data-audio-idx', this.audio_index);
		span.attr('data-alternatives', JSON.stringify(this.alt_words));
		span.attr('data-ms-tstart', this.ms_tstart);
		span.attr('data-ms-tend', this.ms_tend);
		if (this.isDirty) {
			span.addClass('dirty');
		}
		if (this.isHesitation) {
			span.addClass('hesitation');
		}
		if (this.isRecorded && play == 'transcript')
			span.attr('ondblclick', 'playAudioFrom(' + this.tstart + ', '
					+ playend + ', \'' + this.audiofile + '\')');
		if (this.isRecorded && play == 'masterscript')
			span.attr('ondblclick', 'playMasterscriptAudioFrom('
					+ this.ms_tstart + ')');

		if (this.isMessage) {
			span.addClass('msg');
		}
		return span;
	};

};

Token.createFromSpan = function(span) {
	var word = $(span).text().trim();
	var t = new Token(word);
	if (span.attr('data-isrecorded') == 'true')
		t.isRecorded = true;
	else
		t.isRecorded = false;
	t.confidence = Number(span.attr('data-confidence'));
	t.pauseScore = Number(span.attr('data-pausescore'));
	t.tstart = Number(span.attr('data-tstart'));
	t.tend = Number(span.attr('data-tend'));
	t.ms_tstart = Number(span.attr('data-ms-tstart'));
	t.ms_tend = Number(span.attr('data-ms-tend'));
	t.audiofile = span.attr('data-audiofile');
	t.audio_index = span.attr('data-audio-idx');
	t.isDirty = span.hasClass('dirty');
	t.alternatives = $.parseJSON(span.attr('data-alternatives'));

	return t;
};

Token.containsPunct = function(word) {
	var punct = new RegExp("[:!?.\\n]");
	if (punct.test(word))
		return true;
	return false;
};

var Script = function() {
	var self = this;
	var tokens = [];
	var json_file;
	var audio_url;

	this.getUtterances = function() {
		if (tokens.length == 0) {
			return [];
		}
		var utters = [];
		var uid = tokens[0].utterN;
		var utter = [];
		for (var i = 0; i < tokens.length; i++) {
			if (uid == tokens[i].utterN) {
				utter.push(tokens[i]);
			} else {
				utters.push(utter);
				utter = [];
				utter.push(tokens[i]);
			}
			uid = tokens[i].utterN;
		}
		utters.push(utter);
		return utters;
	};

	this.reset = function(newtokens) {
		tokens = newtokens;
	};

	this.asSegment = function() {
		return new TextSegment(this, 0, tokens.length - 1);
	};

	this.setJSONFile = function(filename) {
		json_file = filename;
	};

	this.setAudioURL = function(url) {
		audio_url = url;
	};

	this.getWords = function() {
		var words = this.tokens.map(function(a) {
			return a.word;
		});
		return words;
	}

	this.getText = function() {
		var string = '';
		var capital = false;
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (i == 0 && token.isRecorded)
				capital = true;
			if (capital)
				string += token.capitalizedWord();
			else
				string += token.word;
			// long pause
			if (token.isLongPause()) {
				// string += ' \n';
				capital = true;
			} else {
				string += ' ';
				capital = false;
			}
		}
		return string;
	};

	this.getWordsRange = function(begin, end) {
		var words = tokens.slice(begin, end).map(function(a) {
			return a.word;
		});
		return words;
	}

	this.getTokens = function() {
		return tokens;
	};

	this.getToken = function(i) {
		return tokens[i];
	};

	this.getSpans = function(play) {
		var spans = [];
		var capital = false;
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (i == 0 && token.isRecorded)
				capital = true;

			spans.push(token.getSpan(capital, play)); // insert line break at

			// long pause
			if (token.isLongPause()) {
				spans.push(Script.longPauseSpan());
				// spans.push(Script.whiteSpaceSpan());
				capital = true;
			} else {
				spans.push(Script.whiteSpaceSpan());
				capital = false;
			}
		}
		return spans;
	};

	this.initFromText = function(text_string) {
		this.tokens = Script.tokenizeText(text_string);
	};

	this.initFromAudio = function(json_string, audio_file) {
		this.tokens = Script.tokenizeJSON(json_string, audio_file);
	};

	this.initFromAudio_old = function(json_string, audio_file) {
		tokens = Script.tokenizeJSON_old(json_string, audio_file);
	};

	// this.initFromSpans = function(spans) {
	// tokens = Script.tokenizeSpans(spans);
	// };

	this.addTokens = function(newtokens) {
		var temp = tokens.concat(newtokens);
		tokens = temp;
	};

	this.replaceTokens = function(start, end, newtokens) {
		start = Math.max(start, 0);
		var temp1 = tokens.slice(0, start);
		var temp2 = tokens.slice(end + 1, tokens.length + 1);
		var temp = temp1.concat(newtokens, temp2);
		tokens = temp;
	};

	this.removeTokens = function(start, end) {
		console.log("start " + start + " end " + end);
		start = Math.max(start, 0);
		var temp1 = tokens.slice(0, start);
		var temp2 = tokens.slice(end + 1, tokens.length + 1);
		var temp = temp1.concat(temp2);
		tokens = temp;
	};

	this.getSegments = function() {
		var segs = [];
		var seg, token;
		var start = 0;
		for (var i = 0; i < tokens.length; i++) {
			token = tokens[i];
			if (token.isLongPause()) {
				seg = new TextSegment(this, start, i);
				seg.idx = segs.length;
				segs.push(seg);
				start = i + 1;
			}
		}
		if (start < tokens.length) {
			seg = new TextSegment(this, start, tokens.length - 1);
			seg.idx = segs.length;
			segs.push(seg);
		}
		return segs;
	};

	this.getMatchingSegment = function(match, start_idx, end_idx) {
		var match_idx = (this == match.script1) ? match.match2to1
				: match.match1to2;
		var mstart = -1;
		var mend = -1;

		for (var i = start_idx; i <= end_idx; i++) {
			if (match_idx[i] != -1) {
				mstart = match_idx[i];
				break;
			}
		}

		for (var i = end_idx; i >= start_idx; i--) {
			if (match_idx[i] != -1) {
				mend = match_idx[i];
				break;
			}
		}
		return [ mstart, mend ];

	};
};

Script.whiteSpaceSpan = function() {
	var span = $("<span/>");
	span.append(' ');
	span.addClass('whitespace');
	span.attr('data-word', '');
	span.attr('data-isrecorded', false);
	return span;
};

Script.longPauseSpan = function(symbol) {
	var span = $("<span/>");
	span.append(' ');
	span.addClass('whitespace');
	span.attr('data-word', '');
	span.attr('data-isrecorded', false);
	span.attr('data-islongpause', true);
	span.append(symbol);
	return span;
};

Script.tokenizeText = function(text_string) {
	var split_text = text_string.split(/(\S+\s+)/).filter(function(n) {
		if (n != ' ')
			return n;
	});

	var tokens = [];
	for (var i = 0; i < split_text.length; i++) {
		var word = split_text[i];
		word = word.replace(/ /g, ''); // get rid of spaces but not line breaks
		var token = new Token(word);
		token.isRecorded = false;
		token.confidence = 1.0;
		token.pauseScore = Script.punctuationScore(token.word);
		token.index = tokens.length;
		tokens.push(token);
	}
	return tokens;
};

Script.tokenizeJSON_old = function(json_string, audio_file) {
	var json_obj = JSON.parse(json_string);
	var n_utterance = json_obj.transcript.length;
	var tokens = [];
	// Parse best alternative
	for (var i = 0; i < n_utterance; i++) {
		var best_result = json_obj.transcript[i].results[0].alternatives[0];
		var ntokens = best_result.word_confidence.length;
		for (var j = 0; j < ntokens; j++) {
			var word = best_result.word_confidence[j][0];
			word = word + ' ';
			var token = new Token(word);
			token.confidence = best_result.word_confidence[j][1];
			token.isRecorded = true;
			for (var k = 0; k < best_result.word_confidence[j].length; k += 2) {
				token.alt_words.push(best_result.word_confidence[j][k]);
				token.alt_confidences
						.push(best_result.word_confidence[j][k + 1]);
			}
			token.tstart = best_result.timestamps[j][1];
			token.tend = best_result.timestamps[j][2];
			token.audiofile = audio_file;
			token.index = tokens.length;
			tokens.push(token);
		}
	}

	for (var i = 0; i < tokens.length - 1; i++) {
		tokens[i].pauseScore = tokens[i + 1].tstart - tokens[i].tend;
	}
	tokens[tokens.length - 1].pauseScore = Script.PERIOD_PAUSE = 1.5;
	return tokens;
};

Script.tokenizeJSON = function(json_string, audio_file) {
	var tokens = [];
	var json_obj = JSON.parse(json_string);
	var results = json_obj.results;
	var n_utterance = results.length;

	// Parse results
	for (var i = 0; i < n_utterance; i++) {
		var script_words = results[i].alternatives[0].timestamps;
		for (var j = 0; j < script_words.length; j++) {
			var tstart = script_words[j][1];
			var tend = script_words[j][2];
			// var alternatives = script_words[j].alternatives;
			var word = script_words[j][0];// alternatives[0].word;
			// var conf = alternatives[0].confidence;
			var token = new Token(word);
			if (word == '%HESITATION') {
				token.word = 'umm'
				token.isHesitation = true;
			}
			// token.confidence = conf;
			token.isRecorded = true;
			token.utterN = i;
			token.tstart = tstart;
			token.tend = tend;
			token.audiofile = audio_file;
			// for (var k = 1; k < alternatives.length; k++) {
			// if (alternatives[k].word == '%HESITATION') {
			// continue;
			// }
			// token.alt_words.push(alternatives[k].word);
			// token.alt_confidences.push(alternatives[k].confidence);
			// }
			token.index = tokens.length;
			token.audio_index = tokens.length;
			tokens.push(token);
		}
	}

	for (var i = 0; i < tokens.length - 1; i++) {
		tokens[i].pauseScore = tokens[i + 1].tstart - tokens[i].tend;
	}
	tokens[tokens.length - 1].pauseScore = Script.PERIOD_PAUSE;
	return tokens;
};

Script.tokenizeSpans = function(spans) {
	var span;
	var word;
	var text_string;
	var text_tokens;
	var tokens = [];

	for (var i = 0; i < spans.length; i++) {
		span = spans[i];
		if (span.getAttribute('data-word') == '')
			continue;
		text_string = $(span).text();
		text_tokens = Script.tokenizeText(text_string);
		for (var j = 0; j < text_tokens.length; j++) {
			var token = text_tokens[j];
			if (span.getAttribute('data-isrecorded') == 'true') {
				token.isRecorded = true;
				token.confidence = Number(span.getAttribute('data-confidence'));
				token.pauseScore = Number(span.getAttribute('data-pausescore'));
				token.tstart = Number(span.getAttribute('data-tstart'));
				token.tend = Number(span.getAttribute('data-tend'));
				token.audiofile = span.getAttribute('data-audiofile');
				token.isDirty = span.getAttribute('data-isdirty');
				token.alternatives = $.parseJSON(span
						.getAttribute('data-alternatives'));
				token.ms_tstart = span.getAttribute('data-ms-tstart');
				token.ms_tend = span.getAttribute('data-ms-tend');
			}
			token.index = tokens.length;
			tokens.push(text_tokens[j]);
		}
	}
	return tokens;
};

Script.punctuationScore = function(word) {
	var comma = new RegExp("[,]");
	var period = new RegExp("[:!?.]");
	var newline = new RegExp("\\n");

	if (newline.test(word) || period.test(word))
		return Script.PERIOD_PAUSE;
	if (comma.test(word))
		return Script.COMMA_PAUSE;
	return Script.NO_PAUSE;
};

Script.AppendProgressMessage = function(trans, msg) {
	var token = new Token(msg);
	token.isMessage = true;
	trans.addTokens([ token ]);
};

Script.AppendToTranscript = function(trans, json_string, audio_file) {
	var newtokens = Script.tokenizeJSON(json_string, audio_file);
	var oldtokens = trans.getTokens();
	if (oldtokens.length != 0) {
		var old_endt = oldtokens[oldtokens.length - 1].tend;
		for (var i = 0; i < newtokens.length; i++)
			newtokens[i].tend += old_endt;
	}
	trans.reset(newtokens);
};

/** Saves current view of masterscript * */
Script.saveCurrentMasterscript = function() {
	// read all spans of masterscript
	var ms_spans = [];
	ms_spans = $('#script-texts .masterscript-seg .seg-txt:not(.unmatched) span');
	ms_spans = ms_spans.filter(":visible");

	var idx = 0;
	var span;
	var new_tokens = [];
	var unrecorded_spans;
	var rtokens;
	while (idx < ms_spans.length) {
		span = $(ms_spans[idx]);

		unrecorded_spans = [];
		while (span.attr('data-isrecorded') == 'false') {
			unrecorded_spans.push(span);
			idx++;
			if (idx >= ms_spans.length)
				// || (span.attr('data-islongpause') == 'true'))
				break;
			else
				span = $(ms_spans[idx]);
		}
		if (unrecorded_spans.length > 0) {
			rtokens = Script.retokenize(unrecorded_spans);
			new_tokens = new_tokens.concat(rtokens);
		}
		if (idx >= ms_spans.length)
			break;
		if (span.attr('data-isrecorded') == 'true') { // recorded
			// if (!span.hasClass('dirty')) { // as is
			var t = Token.createFromSpan(span);
			if (span.hasClass('dirty'))
				t.isDirty = true;

			new_tokens.push(t);

			// } else {// also retokenize
			// rtokens = Script.retokenize([ span ]);
			// check if any of the rtokens match old span
			// var tempword = rtokens[0].word;
			// rtokens[0] = Token.createFromSpan(span);
			// rtokens[0].word = tempword;
			// for (var i = 0; i < rtokens; i++) {
			// if (rtokens[i].word == span.attr('data-word')) {
			// rtokens[i] = Token.createFromSpan(span);
			// break;
			// }
			// }
			// new_tokens = new_tokens.concat(rtokens);
			// }
			idx++;
		}
	}
	masterscript.reset(new_tokens);
};

Script.saveMasterscriptAudio = function() {
	var ms_spans = [];
	ms_spans = $('#script-texts .masterscript-seg .seg-txt:not(.unmatched) span');
	ms_spans = ms_spans.filter(":visible");

	var idx = 0;
	var span;
	var prev_audiosrc = null; // Source of the previous recorded word
	var prev_audioidx = -2; // index of word within a recording
	var audiosrc, audioidx, startt, endt; // Src, id, timing of current word
	var prev_aseg = null; // Previous audio segment appended to master-script
	// audio
	var prev_endt = null; // endt of previous word
	
	var ms_startt = 0.0;
	var ms_endt = 0.0;

	msaudios = [];
	while (idx < ms_spans.length) {
		span = $(ms_spans[idx]);
		// Iterate through all recorded word in master-script
		if (span.attr('data-isrecorded') == 'true') {
			audiosrc = span.attr('data-audiofile');
			audioidx = Number(span.attr('data-audio-idx'));

			// Get start and end time within transcript audio
			startt = Number(span.attr('data-tstart'));
			endt = Number(span.attr('data-tend'));

			// If it is a new audio source, or a jump cut within a source
			if (audiosrc !== prev_audiosrc || audioidx != prev_audioidx + 1) {
				// Create a new audio segment from audiosrc, starting at startt.
				// aseg.endt will be updated
				var aseg = new AudioSegment(audiosrc, startt, endt);
				// Append audio segment to master-script audio
				msaudios.push(aseg);
				// If there was a previous audio segment, update its endt
				// At this point, master-script audio += (prev_endt - startt)
				if (prev_aseg && prev_endt) {
					prev_aseg.tend = prev_endt;
				}
				prev_aseg = aseg;
				prev_endt = startt; // no previous word, since we started a new audio segment
			}
			prev_audiosrc = audiosrc;
			prev_audioidx = audioidx;

			ms_endt += (endt - prev_endt);
			span.attr('data-ms-tstart', ms_startt);
			span.attr('data-ms-tend', ms_endt);

			ms_startt = ms_endt;
			prev_endt = endt; 
		}
		idx++;
	}
	if (prev_aseg && prev_endt)
		prev_aseg.tend = prev_endt;
	updateMasterscriptAudio();

};

Script.retokenize = function(spans) {
	var string = '';
	if (spans.length == 1 && spans[0].hasClass('whitespace')
			&& !spans[0].hasClass('dirty')) {
		console.log("returning empty");
		return [];
	}
	for (var i = 0; i < spans.length; i++) {
		console.log(spans[i][0].innerHTML);
		var spantext = spans[i][0].innerHTML.replace(/<br\s*[\/]?>/gi, "\n");
		string += spantext;
	}

	var rtokens = Script.tokenizeText(string);
	return rtokens;
};

Script.PERIOD_PAUSE = 1.0;
Script.COMMA_PAUSE = 0.15;
Script.NO_PAUSE = -1.0;
Script.LONGPAUSE = 0.55;
