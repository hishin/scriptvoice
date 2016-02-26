"use strict";

var Token = function(word) {
	this.word = word;
	this.isRecorded = null;
	this.isLongPause = false;
	this.tstart = null;
	this.tend = null;
	this.confidence = null;
	this.audiofile = null;
	
	this.capitalizedWord = function() {
		return word.charAt(0).toUpperCase() + word.slice(1); 
	};
	
};

Token.containsPunct = function (word){
	var punct = new RegExp("[!?.\\n]");
	if (punct.test(word)) return true;
	return false;
};

var Script = function() {
	var self = this;
	var tokens = null;
	
	this.getWords = function() {
		var words = tokens.map(function(a) {return a.word});
		return words;
	}
	
	this.getTokens = function() {
		return tokens;
	};
	
	this.getToken = function(i) {
		return tokens[i];
	};
	
	this.initFromText = function(text_string) {
		tokens = Script.tokenizeText(text_string);
	};
	
	this.initFromAudio = function(json_string, audio_file){
		tokens = Script.tokenizeJSON(json_string, audio_file);
	};
	
	this.initFromTokens = function (t) {
		tokens = t;
	};
	
};

Script.tokenizeText = function(text_string) {
	var split_text = text_string.trim().split(/(\S+\s+)/).filter(function(n) {return n});
	var tokens = [];
	for (var i = 0; i < split_text.length; i++) {
		var token = new Token(split_text[i]);
		token.isRecorded = false;
		token.confidence = 1.0;
		if (Token.containsPunct(token.word)) {
			token.isLongPause = true;
		}
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
			var token = new Token(word);
			token.isRecorded = true;
			token.tstart = best_result.timestamps[j][1];
			token.tend = best_result.timestamps[j][2];
			token.confidence = best_result.word_confidence[j][1];
			token.audiofile = audio_file;
			tokens.push(token);
		}
	}
	
	for (var i = 0; i < tokens.length-1; i++) {
		if (tokens[i+1].tstart - tokens[i].tend > Script.LONGPAUSE) {
			tokens[i].isLongPause = true;
		}
	}
	tokens[tokens.length-1].isLongPause = true;
	
	return tokens;
};

Script.tokens2spans = function(tokens) {
	var spans = [];
	var span = $("<span/>");
	span.append(tokens[0].capitalizedWord());
	if (tokens[0].isLongPause) {
		span.append('&para;');
	}
	spans.push(span);
	
	for (var i = 1; i < tokens.length; i++) {
		span = $("<span/>");
		if (tokens[i-1].isLongpause) {
			span.append(' ' + tokens[i].capitalizedWord());
		}	
		else {
			span.append('  ' + tokens[i].word);
		}
		if (tokens[i].isLongPause) {
			span.append('&para;');
		}
		spans.push(span);
	}
	
	return spans;
};


Script.LONGPAUSE = 0.5;



