"use strict";

var Token = function(word) {
	this.word = word;
	this.isRecorded = null;
	this.confidence = null;
	this.pauseScore = 0.0;
	this.isLongPause = function() {
		return (this.pauseScore > Script.LONGPAUSE);
	};
	this.tstart = null;
	this.tend = null;
	this.audiofile = null;
	this.isDirty = null;
	this.index = null;
	this.comments = [];

	this.alternatives = [];
	this.alt_confidences = [];
	
	this.capitalizedWord = function() {
		return word.charAt(0).toUpperCase() + word.slice(1);
	};

	this.getSpan = function(capitalize, linebreak) {
		var span = $("<span/>");
		if (capitalize)
			span.append(' ' + this.capitalizedWord().trim());
		else
			span.append(' ' + this.word.trim());
		if (linebreak && this.isLongPause()) {
			span.append('<br/><br/>');
		}

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
		span.attr('data-alternatives', JSON.stringify(this.alternatives));
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

			spans.push(token.getSpan(capital, true)); // insert line break at
			// long pause
			if (token.isLongPause()) {
				capital = true;
			} else {
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

	this.initFromSpans = function(spans) {
		tokens = Script.tokenizeSpans(spans);
	};

};

Script.whiteSpaceSpan = function() {
	var span = $("<span/>");
	span.append(' ');
	span.attr('data-word', ' ');
	span.attr('data-isrecorded', false);
	return span;
};

Script.longPauseSpan = function(symbol) {
	var span = $("<span/>");
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
		var token = new Token(word);
		token.isRecorded = false;
		token.confidence = 1.0;
		token.pauseScore = Script.punctuationScore(token.word);
		token.index = tokens.length;
		tokens.push(token);
	}
	return tokens;
};

Script.tokenizeJSON = function(json_string, audio_file) {
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
			for (var k = 0; k < best_result.word_confidence[j].length; k+=2) {
				token.alternatives.push(best_result.word_confidence[j][k]);
				token.alt_confidences.push(best_result.word_confidence[j][k+1]);
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

Script.tokenizeSpans = function(spans) {
	var span;
	var word;
	var text_string;
	var text_tokens;
	var tokens = [];

	for (var i = 0; i < spans.length; i++) {
		span = spans[i];
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
				token.alternatives = $.parseJSON(span.getAttribute('data-alternatives'));
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

Script.PERIOD_PAUSE = 1.5;
Script.COMMA_PAUSE = 0.15;
Script.NO_PAUSE = -1.0;
Script.LONGPAUSE = 0.5;
