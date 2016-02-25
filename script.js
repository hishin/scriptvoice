"use strict";

var Token = function(word) {
	this.word = word;
	this.isRecorded = null;
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
	var textstring = null;
	
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
	
	this.getTextString = function() {
		return textstring;
	};
	
	this.initFromText = function(text_string) {
		textstring = text_string;
		tokens = Script.tokenizeText(textstring);
	};
	
	this.initFromAudio = function(json_string, audio_file){
		tokens = Script.tokenizeJSON(json_string);
		textstring = Script.tokens2string(tokens);
	};
	
};

Script.tokenizeText = function(text_string) {
	var split_text = text_string.trim().split(/(\S+\s+)/).filter(function(n) {return n});
	var tokens = [];
	for (var i = 0; i < split_text.length; i++) {
		var token = new Token(split_text[i]);
		token.isRecorded = false;
		token.confidence = 1.0;
		tokens.push(token);
	}
	return tokens;
};

Script.tokenizeJSON = function(json_string) {
	var json_obj = JSON.parse(json_string);
	var n_utterance = json_obj.transcript.length;
	var tokens = [];
	// Parse best alternative
	console.log("n_utterance: " + n_utterance);
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
			tokens.push(token);
		}
	}
	return tokens;
};

Script.tokens2spans = function(tokens) {
	var spans = [];
	var span = $("<span/>");
	span.append(tokens[0].capitalizedWord());
	spans.push(span);
	
	for (var i = 1; i < tokens.length; i++) {
		var longpause = Script.isLongPause(tokens[i-1], tokens[i]);
		span = $("<span/>");
		if (longpause) {
			span.append('<br> ' + tokens[i].capitalizedWord());
		}	
		else {
			span.append('  ' + tokens[i].word);
		}
		spans.push(span);
	}
	
	return spans;
};

Script.tokens2string = function(tokens) {
	var textstring = '';
	textstring = textstring + tokens[0].capitalizedWord();
	
	for (var i = 1; i < tokens.length; i++) {
		var longpause = Script.isLongPause(tokens[i-1], tokens[i]);
		if (longpause) {
			textstring = textstring + '<br><br> ' + tokens[i].capitalizedWord();
		}	
		else {
			textstring = textstring + '  ' + tokens[i].word;
		}
	}
	
	return textstring;
};

Script.LONGPAUSE = 0.5;
Script.isLongPause = function(token1, token2) {
	if (token1.isRecorded && token2.isRecorded) {
		return (token2.tstart - token1.tend > Script.LONGPAUSE);
	}
	if (!token1.isRecorded && !token2.isRecorded) {
		return Token.containsPunct(token1.word);
	}
	if (token1.isRecorded != token2.isRecorded) {
		return true;
	}
};


