"use strict";

var Token = function(word) {
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
	this.index = null;
	this.comments = [];

	this.alt_words = [];
	this.alt_confidences = [];

	this.capitalizedWord = function() {
		return word.charAt(0).toUpperCase() + word.slice(1);
	};

	this.getSpan = function(capitalize) {
		var span = $("<span/>");
		if (capitalize)
			span.append(this.capitalizedWord().trim());
		else
			span.append(this.word.trim());

		span.attr('data-word', this.word);
		span.attr('data-isrecorded', this.isRecorded);
		span.attr('data-pausescore', this.pauseScore);
		span.attr('data-islongpause', this.isLongPause());
		span.attr('data-tstart', this.tstart);
		span.attr('data-tend', this.tend);
		span.attr('data-confidence', this.confidence);
		span.attr('data-audiofile', this.audiofile);
		span.attr('data-isdirty', this.isDirty);
		span.attr('data-index', this.index);
		span.attr('data-alternatives', JSON.stringify(this.alt_words));
		return span;
	};

};

Token.containsPunct = function(word) {
	var punct = new RegExp("[!?.\\n]");
	if (punct.test(word))
		return true;
	return false;
};

var Script = function() {
	var self = this;
	var tokens = [];
	var json_file;
	var audio_url;

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
		var words = tokens.map(function(a) {
			return a.word
		});
		return words;
	}

	this.getTokens = function() {
		return tokens;
	};

	this.getToken = function(i) {
		return tokens[i];
	};

	this.getSpans = function() {
		var spans = [];
		var capital = false;
		for (var i = 0; i < tokens.length; i++) {
			var token = tokens[i];
			if (i == 0 && token.isRecorded)
				capital = true;

			spans.push(token.getSpan(capital)); // insert line break at

			// long pause
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

	this.initFromText = function(text_string) {
		tokens = Script.tokenizeText(text_string);
	};

	this.initFromAudio = function(json_string, audio_file) {
		tokens = Script.tokenizeJSON(json_string, audio_file);
	};

	this.initFromAudio_old = function(json_string, audio_file) {
		tokens = Script.tokenizeJSON_old(json_string, audio_file);
	};

	this.initFromSpans = function(spans) {
		tokens = Script.tokenizeSpans(spans);
	};

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

		if (mstart == -1 || mend == -1)
			return null;
		return new TextSegment(this, mstart, mend);

	};
};

Script.whiteSpaceSpan = function() {
	var span = $("<span/>");
	span.append(' ');
	span.attr('data-word', '');
	span.attr('data-isrecorded', false);
	return span;
};

Script.longPauseSpan = function(symbol) {
	var span = $("<span/>");
	span.append('<br>');
	span.attr('data-word', '');
	span.attr('data-isrecorded', false);
	span.attr('data-islongpause', true);
	span.append(symbol);
	return span;
};

Script.tokenizeText = function(text_string) {

	var split_text = text_string.split(/(\S+\s+)/).filter(function(n) {
		return n;
	});

	var tokens = [];
	for (var i = 0; i < split_text.length; i++) {
		var word = split_text[i];
		var token = new Token(word.trim());
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
		var script_words = results[i].word_alternatives;
		for (var j = 0; j < script_words.length; j++) {
			var tstart = script_words[j].start_time;
			var tend = script_words[j].end_time;
			var alternatives = script_words[j].alternatives;
			var word = alternatives[0].word;
			var conf = alternatives[0].confidence;
			var token = new Token(word);
			token.confidence = conf;
			token.isRecorded = true;
			token.tstart = tstart;
			token.tend = tend;
			token.audiofile = audio_file;
			for (var k = 1; k < alternatives.length; k++) {
				token.alt_words.push(alternatives[k].word);
				token.alt_confidences.push(alternatives[k].confidence);
			}
			token.index = tokens.length;
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
			}
			token.index = tokens.length;
			tokens.push(text_tokens[j]);
		}
	}
	return tokens;
};

Script.punctuationScore = function(word) {
	var comma = new RegExp("[,]");
	var period = new RegExp("[!?.]");
	var newline = new RegExp("\\n");

	if (newline.test(word) || period.test(word))
		return Script.PERIOD_PAUSE;
	if (comma.test(word))
		return Script.COMMA_PAUSE;
	return Script.NO_PAUSE;
};

Script.AppendToCurrentTranscript = function(json_string, audio_file) {
	var newtokens = Script.tokenizeJSON(json_string, audio_file);
	var oldtokens = transcript.getTokens();
	if (oldtokens.length != 0) {
		var old_endt = oldtokens[oldtokens.length - 1].tend;
		for (var i = 0; i < newtokens.length; i++)
			newtokens[i].tend += old_endt;
	}
	transcript.addTokens(newtokens);

};

Script.PERIOD_PAUSE = 1.5;
Script.COMMA_PAUSE = 0.15;
Script.NO_PAUSE = -1.0;
Script.LONGPAUSE = 0.5;
