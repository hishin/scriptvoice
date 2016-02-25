/**
 * Created: 2015. 01. 09.
 * Last modified: 2015. 01. 09
 * Uses Google Speech API to transcribe audio into text.
 */

var recognizing = false;
var ignore_onend;
var start_timestamp;
var final_transcript = '';
var alternatives = ['', '', ''];


if (!('webkitSpeechRecognition' in window)) {
} else {
	var recognition = new webkitSpeechRecognition();
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.maxAlternatives = 4;
	
	recognition.onstart = function() {
		recognizing = true;
		showInfo('Speak now.');
		start_speech_img.src = 'images/mic-animate.gif';
	};

	recognition.onerror = function(event) {
		console.log("recognition error: " + event.error);
		if (event.error == 'no-speech') {
			start_speech_img.src = 'images/mic.gif';
			showInfo('No speech was detected. You may need to adjust your microphone settings.')
			ignore_onend = true;
		}
		if (event.error == 'audio-capture') {
			start_speech_img.src = 'images/mic.gif';
			showInfo('No microphone was found.');
			ignore_onend = true;
		}
		if (event.error == 'not-allowed') {
			
			if (event.timeStamp - start_timestamp < 100) {
				showInfo('Permission to use microphone is blocked.');
			} else {
				showInfo('Permission to use microphone was denied.');
			}
			ignore_onend = true;
		}
	};

	recognition.onend = function(event) {
		console.log("Recognition ended: " + event.timeStamp);
		recognizing = false;
		if (ignore_onend) {
			return;
		}
		start_speech_img.src = 'images/mic.gif';
		showInfo('Click and begin speaking.');
		return;
	};

	recognition.onresult = function(event) {
		var interim_transcript = '';
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal) {
				console.log("onresult event " +  event.resultIndex + "length: " + event.results.length + " timestamp: " + event.timeStamp);

				final_transcript += event.results[i][0].transcript;
			} 
		}
		final_transcript = capitalize(final_transcript);
		transcript_span.innerHTML = linebreak(final_transcript);
		alternativeTexts(event);
		var altlist = $('<ol/>');
		for (var i = 0; i < alternatives.length; i++) {
			alternatives[i] = capitalize(alternatives[i]);
			altlist.append($('<li></li>').text(alternatives[i]))
		}
		$('#alternative-text').empty().append(altlist);
	};
}

function alternativeTexts(event) {
	for (var i = event.resultIndex; i < event.results.length; ++i) {
		if (event.results[i].isFinal) {
			console.log('num hypothesis:' + event.results[i].length);
			for (var j = 0; j < 3; j++) {
				if (event.results[i].length > j+1) {
					alternatives[j] += event.results[i][j+1].transcript;
				}
				else
					alternatives[j] += event.results[i][event.results[i].length -1];
			}
		}
	}
}


function startSpeech(event) {
	if (recognizing) {
		recognition.stop();
		return;
	}
	console.log("Recognition Starting: " + event.timeStamp);
	recognition.start();
	ignore_onend = false;
	start_timestamp = event.timeStamp;
};

function showInfo(string) {
	$('#speech_instruction').text(string);
};

var two_line = /\n\n/g;
var one_line = /\n/g;
function linebreak(s) {
  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

var first_char = /\S/;
function capitalize(s) {
  return s.replace(first_char, function(m) { return m.toUpperCase(); });
}