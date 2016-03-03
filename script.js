"use strict";

var Token = function(word) {
	this.word = word;

	var whitespace = new RegExp("\\s");
	this.isWhiteSpace = (whitespace.test(this.word) || this.word === "");
	this.isRecorded = null;
	this.pauseScore = 0.0;
	this.tstart = null;
	this.tend = null;
	this.confidence = null;
	this.audiofile = null;
	this.prevToken = null;
	this.nextToken = null;

	this.isLongPause = function() {
		return (this.pauseScore > Script.LONGPAUSE);
	};

	this.addPrevToken = function(prev) {
		if (this.prevToken != null) {
			prev.prevToken = this.prevToken;
			this.prevToken.nextToken = prev;
		}
		this.prevToken = prev;
		if (prev)
			prev.nextToken = this;
	};

	this.capitalizedWord = function() {
		return word.charAt(0).toUpperCase() + word.slice(1);
	};
	
	this.getSpan = function(capitalize) {
		var span = $("<span/>");
		if (capitalize) span.append(this.capitalizedWord());
		else span.append(this.word);
		span.attr('data-word', this.word);
		span.attr('data-iswhitespace', this.isWhiteSpace)
		span.attr('data-isrecorded', this.isRecorded);
		span.attr('data-pausescore', this.pauseScore);
		span.attr('data-islongpause', this.isLongPause());
		span.attr('data-tstart', this.tstart);
		span.attr('data-tend', this.tend);
		span.attr('data-confidence', this.confidence);
		span.attr('data-audiofile', this.audiofile);
		
		if (!this.isRecorded) {
			span.attr('contentEditable', true);	
		}
		else {
			span.attr('contentEditable', false);
		}
		
		return span;
	};

};

Token.WhiteSpaceToken = function() {
	var token = new Token(" ");
	token.isRecorded = false;
	token.confidence = 1.0;
	return token;
};

Token.containsPunct = function(word) {
	var punct = new RegExp("[!?.\\n]");
	if (punct.test(word))
		return true;
	return false;
};

var Script = function() {
	var self = this;
	var firstToken = null;
	var tokens = null;
	
	this.getWords = function() {
		var token = firstToken;
		var words = [];
		while (token) {
			if (!token.isWhiteSpace) {
				words.push(token.word);
			}
			token = token.nextToken;
		}
		return words;
	};
	
	this.getWordTokens = function() {
		var token = firstToken;
		var wtokens = [];
		while (token) {
			if (!token.isWhiteSpace) {
				wtokens.push(token);
			}
			token = token.nextToken;
		}
		return wtokens;
	};

	this.assignTokensArray = function() {
		tokens = [];
		var token = firstToken;
		while (token) {
			tokens.push(token);
			token = token.nextToken;
		}
		return tokens;
	};

	this.getSpans = function() {
		var spans = [];
		var token = firstToken;
		while(token) {
			if (token.prevToken == null || token.prevToken.isLongPause()) {
				spans.push(token.getSpan(true));
			}
			else {
				spans.push(token.getSpan(false));
			}
			
			if (token.isLongPause() && !token.isWhiteSpace) {
				var span = $("<span/>");
				span.append('&para; ');
				spans.push(span);
			}
			token = token.nextToken;
		}
		return spans;
	};

	this.getToken = function(i) {
		if (!tokens) tokens = assignTokensArray();
		if (i > tokens.length) {
			console.log("Script.getToken Error: Index exceeds number of tokens");
		}
		return tokens[i];
	};

	this.initFromText = function(text_string) {
		firstToken = Script.tokenizeText(text_string);
		this.assignTokensArray();
	};

	this.initFromAudio = function(json_string, audio_file) {
		firstToken = Script.tokenizeJSON(json_string, audio_file);
		this.assignTokensArray();
	};

	// TODO: correct for linked list
	this.initFromSpans = function(spans) {
		firstToken = Script.tokenizeSpans(spans);
		this.assignTokensArray();
	};

	/**
	 * Return binary array indicating isRecorded Status
	 */
	this.getRecorded = function() {
		var tokens = this.getTokensArray();
		return tokens.map(function(t) {
			return t.isRecorded;
		});
	};
};

Script.appendWhiteSpace = function(token) {
	var wtoken = Token.WhiteSpaceToken();
	wtoken.addPrevToken(token);
	return wtoken;
};

Script.prependWhiteSpace = function(token) {
	var wtoken = Token.WhiteSpaceToken();
	token.addPrevToken(wtoken);
	return wtoken;
};

Script.tokenizeText = function(text_string) {
	var split_text = text_string.split(/(\s+)/);
	var firstToken;
	var prev = null;
	var token;
	for (var i = 0; i < split_text.length; i++) {
		token = new Token(split_text[i]);
		token.isRecorded = false;
		token.confidence = 1.0;
		if (i == 0)
			firstToken = token;
		token.addPrevToken(prev);
		prev = token;
	}
	var lastToken = token;

	// Add whitespace token at the beginning and end
	if (!firstToken.isWhiteSpace) {
		firstToken = Script.prependWhiteSpace(firstToken);
	}
	if (!lastToken.isWhiteSpace) {
		lastToken = Script.appendWhiteSpace(lastToken);
	}

	// Assign pause score
	token = firstToken;
	var newline = new RegExp("\\n");
	while (token) {
		if (token.isWhiteSpace) {
			// first white space
			if (!token.prevToken)
				token.pauseScore = Script.PERIOD_PAUSE;
			else if (newline.test(token.word)) {
				token.pauseScore = Script.PERIOD_PAUSE;
				// propagate to previous tokens until passing non-whitespace
				var prevToken = token.prevToken;
				var passNonWhiteSpace = false;
				while (prevToken && !passNonWhiteSpace) {
					prevToken.pauseScore = Script.PERIOD_PAUSE;
					passNonWhiteSpace = !prevToken.isWhiteSpace;
					prevToken = prevToken.prevToken;
				}
			} else {
				token.pauseScore = token.prevToken.pauseScore;
			}
		} else {
			token.pauseScore = Script.punctuationScore(token.word);
		}
		token = token.nextToken;
	}

	return firstToken;
};

Script.tokenizeJSON = function(json_string, audio_file) {
	var json_obj = JSON.parse(json_string);
	var n_utterance = json_obj.transcript.length;
	var token;
	var firstToken;
	var prev = null;
	// Parse best alternative
	for (var i = 0; i < n_utterance; i++) {
		var best_result = json_obj.transcript[i].results[0].alternatives[0];
		var ntokens = best_result.word_confidence.length;
		for (var j = 0; j < ntokens; j++) {
			var word = best_result.word_confidence[j][0];
			token = new Token(word);
			token.isRecorded = true;
			token.tstart = best_result.timestamps[j][1];
			token.tend = best_result.timestamps[j][2];
			token.confidence = best_result.word_confidence[j][1];
			token.audiofile = audio_file;
			if (i == 0 && j == 0)
				firstToken = token;
			token.addPrevToken(prev);

			// Add white space token in-between word tokens
			if (i < n_utterance - 1 || j < ntokens - 1) {
				prev = Script.appendWhiteSpace(token);
			}
		}
	}

	// Assign pause score
	token = firstToken;
	while (token) {
		if (token.isWhiteSpace) {
			// first white space
			if (!token.prevToken)
				token.pauseScore = Script.PERIOD_PAUSE;
			else {
				// propagate FROM previous
				token.pauseScore = token.prevToken.pauseScore;
			}
		} else {
			var nextWordToken = token.nextToken;
			while (nextWordToken && nextWordToken.isWhiteSpace) {
				nextWordToken = nextWordToken.nextToken;
			}
			if (nextWordToken == null)
				token.pauseScore = Script.PERIOD_PAUSE;
			else
				token.pauseScore = nextWordToken.tstart - token.tend;
		}
		token = token.nextToken;
	}

	return firstToken;
};

Script.tokenizeSpans = function(spans) {
	var span;
	var word;
	var prev = null;
	var firstToken = null;
	for (var i = 0; i < spans.length; i++) {
		span = spans[i];
		word = span.getAttribute('data-word');
		if (word == null) continue;
		var token = new Token(word);
		if (firstToken == null) firstToken = token;
		token.isRecorded = (span.getAttribute('data-isrecorded') == 'true');
		token.pauseScore = Number(span.getAttribute('data-pausescore'));
		token.tstart = Number(span.getAttribute('data-tstart'));
		token.tend = Number(span.getAttribute('data-tend'));
		token.confidence = Number(span.getAttribute('data-confidence'));
		token.audiofile = span.getAttribute('data-audiofile');
		token.addPrevToken(prev);
		prev = token;
	}
	return firstToken;
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
		if (tokens[i - 1].isLongPause) {
			span.append(' ' + tokens[i].capitalizedWord());
		} else {
			span.append('  ' + tokens[i].word);
		}
		if (tokens[i].isLongPause) {
			span.append('&para;');
		}
		spans.push(span);
	}

	return spans;
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
