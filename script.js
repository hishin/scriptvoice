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
		var span;
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

	this.initFromSpans = function(spans) {
		tokens = Script.tokenizeSpans(spans);
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
	span.append('<br><br>');
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

Script.PERIOD_PAUSE = 1.5;
Script.COMMA_PAUSE = 0.15;
Script.NO_PAUSE = -1.0;
Script.LONGPAUSE = 0.5;
