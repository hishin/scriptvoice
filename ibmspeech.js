/**
 * Created: 2016. 01. 10. Last modified: 2016. 03.11 Uses IBM Watson Speech to
 * Text service to transcribe audio.
 */

"use strict"

var IBMSpeech2TextService = function(commonConfig, audio, record_id) {
	var self = this;
	var token = null;
	var websocket = null;
	var keepalive;

	function getToken() {
		return token;
	};
	
	function requestToken() {
		getRequest('requestToken.php', tokenSuccess, tokenFailure);
		return false;
	};

	function tokenSuccess(responseText) {
		token = responseText;
		openConnection(record_id);
		captureAudio(commonConfig, audio);
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

	function openConnection(record_id) {
		var wsURI = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token="
				+ token + "&model=en-US_BroadbandModel";
		websocket = new WebSocket(wsURI);
		websocket.onmessage = function(evt) {
			if(isRecognitionData(evt.data)) {
				$('#ibm-status').empty();

				Script.AppendToTranscript(transcripts[record_id], evt.data, record_id+'.wav');
				saveJSONToServer(JSON.parse(evt.data), record_id);
				saveTxtToServer(transcripts[record_id].getText(), record_id);
				// Realign Current Script
				match = computeMatch(masterscript, transcripts[record_id]);
				matches[record_id] = match;
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
				+ "\"word_alternatives_threshold\": 0.0, \"word_confidence\": true,"
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
		var spinner = $('<i/>');
		spinner.attr('class', 'fa fa-spinner fa-spin');
// spinner.attr('style', "font-size:24px");
		$('#ibm-status').append("Processing Speech...");
		$('#ibm-status').append(spinner);
		
		reprint();
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
 
 function uploadBlobToServer(blob, filetype, filename) {
     // create FormData
     var formData = new FormData();
     formData.append(filetype + '-filename', filename);
     formData.append(filetype + '-blob', blob);
     makeXMLHttpRequest('save.php', formData, function(progress) {
    	 if (progress !== 'upload-ended') {
    		 console.log(progress);
    		 return;
    	 }
         var initialURL = location.href.replace(location.href.split('/').pop(), '') + 'uploads/';

         console.log('ended', initialURL + filename);
         // to make sure we can delete as soon as visitor leaves
         // listOfFilesUploaded.push(initialURL + fileName);
     });
 };
 

 
 function uploadToServer(recordRTC, record_id) {
	 var blob = recordRTC.blob;
     var fileType = 'audio';
     var fileName = record_id +'.wav';
     uploadBlobToServer(blob, fileType, fileName);
 };
 
 function saveJSONToServer(json_obj, record_id) {
	 var fileName = record_id+'.json';
// uploadBlobToServer(blob, fileType, fileName);
	 $.post("json.php", {json : JSON.stringify(json_obj), filename: fileName});
 };
 
 function saveTxtToServer(txt, record_id) {
	var fileName = record_id + '.txt';
	$.post("json.php", {json : txt, filename: fileName});
 };
 
 function saveMasterscriptToServer(masterscript) {
	 
	var seconds = new Date().getTime() / 1000;
	seconds = Math.round(seconds);
	var fileName = 'masterscript_' + seconds.toString() + '.json'; 
	$.post("json.php", {json: JSON.stringify(masterscript.getTokens()), filename: fileName});
 };
 
 function makeXMLHttpRequest(url, data, callback) {
     var request = new XMLHttpRequest();
     request.onreadystatechange = function() {
         if (request.readyState == 4 && request.status == 200) {
             callback('upload-ended');
         }
     };
     request.upload.onloadstart = function() {
         callback('Upload started...');
     };
     request.upload.onprogress = function(event) {
         callback('Upload Progress ' + Math.round(event.loaded / event.total * 100) + "%");
     };
     request.upload.onload = function() {
         callback('progress-about-to-end');
     };
     request.upload.onload = function() {
         callback('progress-ended');
     };
     request.upload.onerror = function(error) {
         callback('Failed to upload to server');
         console.error('XMLHttpRequest failed', error);
     };
     request.upload.onabort = function(error) {
         callback('Upload aborted.');
         console.error('XMLHttpRequest aborted', error);
     };
     request.open('POST', url);
     request.send(data);
 };
 
 
	
	
	
function clickRecord(button, audio) {
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
		},
		onMediaCapturingFailed : function(error) {
			alert(error);
			commonConfig.onMediaStopped();
		}
	};
	
	addNewTranscript();		
	var record_id = curid;
	// Connect to IBM Speech-to-Text Service
	var IBMSpeech = new IBMSpeech2TextService(commonConfig, audio, record_id);

	// if media capture succeeds, start recording
	button.mediaCapturedCallback = function() {
		
		button.recordRTC = RecordRTC(button.stream,
			{
				type : 'audio',
				bufferSize : 0,
				sampleRate : 44100,
				leftChannel : true,
				disableLogs : false,
				recorderType : null
			});
		recorders[record_id] = button.recordRTC;
		
		
		button.sendRTC = RecordRTC(
				button.stream, 
				{
					type: 'audio',
					bufferSize : 0,
					sampleRate : 44100,
					leftChannel : true,
					disableLogs : false,
					recorderType : null
				});

		button.recordingEndedCallback = function(url) {
			audiosrcs[record_id] = url;
			audioblobs[record_id+'.wav'] = button.recordRTC.blob;
			uploadToServer(button.recordRTC, record_id);
			audio.src = audiosrcs[curid];
			audio.controls = true;
			audio.onended = function() {
				audio.pause();
			};
			clearInterval(button.showTime);
		};
		
		button.sendingEndedCallback = function(url) {
			clearInterval(button.sendBlob);
			IBMSpeech.recognizeBlob(button.sendRTC.blob);
			IBMSpeech.stopRecognition();
		};
		

		// Capture audio
		button.recordRTC.startRecording();
		var start = new Date().getTime();
		button.sendRTC.startRecording();
		button.sendBlob = window.setInterval(function() {
			if (button.sendRTC.blob != null) {
				IBMSpeech.recognizeBlob(button.sendRTC.blob);
				sendRTC.clearRecordedData();
			}
		}, 500);
		
		button.showTime = window.setInterval(function() {
			var end = new Date().getTime();
			var duration = end-start;
			$('#audio-duration').text('(Recording: '+(duration/1000.0).toFixed(2)+'s)');
		}, 100.00);
	};

	button.disabled = true;
	
};

