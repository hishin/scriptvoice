"use strict"

function testRequest() {
	var token = "SUwV3dFxeoI8sAmy0f5XKo6S3DhrkK5yMXOC4%2Bw8UYrhCiLLVb3ENrXZvGbshOmSTUeaymON8OkvqAhCGSBX7DRvzaIdazF%2FUyJ3xbvqPbh4%2B7JCL5W2hf4iP9IwqiRrWBLPFtijhTkBVI0OfoagTqvNQvVtqVPa9O1csLllw60q3hXro6klmzsudfXbiK4WHSOwFilX7saZ4eIu%2F%2F0XL9FNRYHcZTZUxNL8WRp9pw3eIysarihIxitp9nqbah7ihkjjG50AevweifwEzI4YotOod6HAJ1ziDgc9F28ZH0U7l7NxbmR0zTYhLMl8s4FBzVB%2Fp96%2B56tt0P8EF7q6S07DSYHhdEEmr2b%2FWsucMH7q1Q0Kpssku5oP16vlXeOhHlV6zRinuoymL3zBr%2B1fcQXNdJ0O02SDfx%2B3yCJDgIJZexJX%2BYeU5Dchsq9gK%2BMSqmAgVaDBRjq6K7LpwLbtpwpwp1iPQ6rzxlR9VozZIqZgza7b4aKl2DEFucqy4CodzwSarrpw47XuAE9p27bjPwobjQxVvfI4SZQGNHGFYKsSGhlXk3tCim2B7%2FeojdR5lA7H%2BM6vnXXCRDmIwlJP0BJPyIM7YDigR4dgZ3Fnssa3aJ1bSa14r2sDhwT9MFb87cBHPqWojTi8iAGwon%2B2s0V5G17tjv0IpFqwzVX3MsTc1GqIcE7QX1pqF%2FIbD6xwK6UyLgRJ8d2uSwmKyby0MNJHS6p50g422uHMDPjeo6q5MGNyjtnfRedyoR88Ks16jLPZ8Asqktj%2B8k4lMGdJI3XnIh2ykXXKxd8j6L26X42p5sRQdAUVC1Spr4hwFqnnsnfSiKX%2BbMtKHlbeXUOibkPS3BWRBiDc"
	var wsURI = "wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token="
			+ token + "&model=es-ES_BroadbandModel";
	var websocket = new WebSocket(wsURI);
	websocket.onopen = function(evt) {
		console.log("open");
		var message = "{\"action\": \"start\", \"content-type\": \"audio/l16\"}";
		websocket.send(message);
	};
	
	websocket.onmessage = function(evt) {
		console.log(evt.data);
	};
};

function successCallback(mediaStream) {
    // RecordRTC usage goes here
	console.log("here");
	var recordRTC = RecordRTC(mediaStream);
	recordRTC.startRecording();
	recordRTC.stopRecording(function(audioURL) {
	   recordRTC.save("myfile.wav")
	});
}

function errorCallback(error) {
    // maybe another application is using the device
}



