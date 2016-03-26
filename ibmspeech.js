/**
 * Created: 2016. 01. 10. Last modified: 2016. 03.11 Uses IBM Watson Speech to
 * Text service to transcribe audio.
 */

"use strict"

var IBMSpeech2TextService = function() {
	var self = this;
	var token = null;
	var websocket = null;
	var keepalive;

	function requestToken() {
		getRequest('requestToken.php', tokenSuccess, tokenFailure);
		return false;
	};

	function tokenSuccess(responseText) {
		token = responseText;
		openConnection();
	};
	
	function tokenFailure() {
		alert("Failed to obtain token to access IBM Speech to Text Service");
	};

	function getRequest(url, success, error) {
		var req = false;
		try {
			req = new XMLHttpRequest();
		} catch (e) {
			// IE
			try {
				req = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				// try an older version
				try {
					req = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					return false;
				}
			}
		}
		if (!req)
			error();
		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				return req.status === 200 ? success(req.responseText)
						: error(req.status);
			}
		}
		req.open("GET", url, true);
		req.send(null);
		return req;
	};

	function openConnection() {
		var wsURI = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token="
				+ token + "&model=en-US_BroadbandModel";
		websocket = new WebSocket(wsURI);
		websocket.onmessage = function(evt) {
			if(isRecognitionData(evt.data)) {
				Script.AppendToCurrentTranscript(evt.data);
				// Realign Current Script
				match = computeMatch(masterscript, transcript);
				matches[curid] = match;
				reprint();
			}
		};
		websocket.onopen = function(evt) {
			console.log("websocket connection opened.");
			initiateRecognize();
			keepConnectionAlive();
		};
		websocket.onclose = function(evt) {
			clearInterval(keepalive);
			console.log("websocket connection closed.");
		};
		websocket.onerror = function(evt) {
			alert("websocket Error!");
		}
	};
	
	function keepConnectionAlive() {
		keepalive = window.setInterval(function() {
			var message = "{\"action\": \"no-op\"}"; 
			websocket.send(message);
		}, 15000);
	};
	

	 function initiateRecognize() {
		var message = "{\"action\": \"start\", \"content-type\": \"audio/wav\","
				+ "\"continuous\": true, \"inactivity_timeout\": -1, "
				+ "\"max_alternatives\": 3, \"interim_results\": false, "
				+ "\"word_alternatives_threshold\": 0.05, \"word_confidence\": true,"
				+ "\"timestamps\": true}";
		websocket.send(message);
	};
	
	this.recognizeBlob = function(blob) {
		websocket.send(blob);
		console.log("send blob:");
		console.log(blob);
	};
	
	this.stopRecognition = function() {
		var message = "{\"action\": \"stop\"}";
		websocket.send(message);
		console.log("stop recognition");
	};

	requestToken();
};

function isRecognitionData(data) {
	var res = JSON.parse(data);
	return res.results != undefined; 
};

function toggleRecordToStop(button, to_stop) {
	// toggle back to start-record button
	var icon = $(button).children("i");
	if (to_stop) {
		icon.attr('class', 'glyphicon glyphicon-stop');
		icon.attr('title', "Stop Recording");
		$(button).attr('class', "btn btn-primary btn-circle");
		$(button).attr('data-state', 'stop-record');
	} else {
		icon.attr('class', 'glyphicon glyphicon-record');
		icon.attr('title', "Start Recording");
		$(button).attr('class', "btn btn-danger btn-circle");
		$(button).attr('data-state', "start-record");
	}

};

function stopStream(button) {
	if (button.stream && button.stream.stop) {
		button.stream.stop();
		button.stream = null;
	}
};

function captureAudio(config, audio) {
	captureUserMedia({
		audio : true, video: false
	}, function(audioStream) {
		config.onMediaCaptured(audioStream);
		audioStream.onended = function() {
			config.onMediaStopped();
		};
	}, function(error) {
		config.onMediaCapturingFailed(error);
	});
};

 function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
     navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
 };


function clickRecord(IBMSpeech, button, audio) {
	// stop-record button
	
	if (button.getAttribute('data-state') == 'stop-record') {
		button.disabled = true;
		button.disableStateWaiting = true;
		setTimeout(function() {
			button.disabled = false;
			button.disableStateWaiting = false;
		}, 2 * 1000);

		toggleRecordToStop(button, false);

		button.recordRTC.stopRecording(function(url) {
			button.recordingEndedCallback(url);
			stopStream(button);
		});
		
		button.sendRTC.stopRecording(function(url) {
			button.sendingEndedCallback(url);
		});
		return;
	}
	
	// if media capture succeeds, start recording
	button.mediaCapturedCallback = function() {
		button.recordRTC = RecordRTC(
				button.stream,
				{
					type : 'audio',
					bufferSize : 0,
					sampleRate : 44100,
					leftChannel : false,
					disableLogs : false,
					recorderType : null
				});
		
		button.sendRTC = RecordRTC(
				button.stream, 
				{
					type: 'audio',
					bufferSize : 0,
					sampleRate : 44100,
					leftChannel : false,
					disableLogs : false,
					recorderType : null
				});

		button.recordingEndedCallback = function(url) {
			audio.src = url;
			audio.controls = true;
			audio.onended = function() {
				audio.pause();
				audio.src = URL.createObjectURL(button.recordRTC.blob);
			};
		};
		
		button.sendingEndedCallback = function(url) {
			IBMSpeech.recognizeBlob(button.sendRTC.blob);
			clearInterval(button.sendBlob);
			IBMSpeech.stopRecognition();
		};
		

		button.recordRTC.startRecording();
		button.sendRTC.startRecording();
		button.sendBlob = window.setInterval(function() {
			if (button.sendRTC.blob != null) {
				IBMSpeech.recognizeBlob(button.sendRTC.blob);
				sendRTC.clearRecordedData();
			}
		}, 1000);
	};
	
	// configuration for media capture
	var commonConfig = {
		onMediaCaptured : function(stream) {
			button.stream = stream;
			if (button.mediaCapturedCallback) {
				button.mediaCapturedCallback();
			}
			toggleRecordToStop(button, true);
			button.disabled = false;
		},
		onMediaStopped : function() {
// toggleRecordToStop(button, false);
// if (!button.disableStateWaiting) {
// button.disabled = false;
// }
		},
		onMediaCapturingFailed : function(error) {
			alert(error);
			commonConfig.onMediaStopped();
		}
	};
	
	button.disabled = true;
	// Capture audio
	captureAudio(commonConfig, audio);

};

