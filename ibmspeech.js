/**
 * Created: 2016. 01. 10. Last modified: 2016. 03.11 Uses IBM Watson Speech to
 * Text service to transcribe audio.
 */

"use strict"

/**
 * Obtain token and open a WebSocket connection
 */
var token;
var websocket;

function requestToken() {
	getRequest('requestToken.php', assignToken, tokenFailure);
	return false;
};

function tokenFailure() {
	alert("Failed to obtain token to access IBM Speech to Text Service");
};

function assignToken(responseText) {
	token = responseText;
	openConnection();
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
			+ token + "&model=es-ES_BroadbandModel";
	websocket = new WebSocket(wsURI);
	websocket.onmessage = function(evt) {
		console.log(evt.data);
	};
	websocket.onopen = function(evt) {
		initiateRecognize();
	};
	websocket.onclose = function(evt) {
		console.log("Closing websocket connection!");
	};
	websocket.onerror = function(evt) {
		console.log("Websocket Error!");
	}
};

function initiateRecognize() {
	var message = "{\"action\": \"start\", \"content-type\": \"audio/l16\"," +
			"\"continuous\": true, \"inactivity_timeout\": -1, " +
			"\"max_alternatives\": 3, \"interim_results\": false, " +
			"\"word_alternatives_threshold\": 0.1, \"word_confidence\": true," +
			"\"timestamps\": true}";
	
	websocket.send(message);
};