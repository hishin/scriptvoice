/**
 * Created: 2016. 02. 02.
 * Last modified: 2016. 02. 02
 * Transcript object from JSON file
 */

function TranscriptWord(word, conf, tstart, tfinish, utter) {
	this.word = word;
	this.confidence = conf;
	this.tstart = tstart;
	this.tfinish = tfinish;
	this.utterance = utter;
}

function Transcript(jsontext) {

	this.obj = JSON.parse(jsontext); // Raw JSON object
	this.nutter = this.obj.transcript.length; // Number of utterances
	this.utterances = new Array(this.nutter);
	for (var i = 0; i < this.nutter; i++) {
		  this.utterances[i] = new Array();
		}
	this.words = [];
	
	// Parse best alternative ONLY
	for (var i = 0; i < this.nutter; i++) {
		var result = this.obj.transcript[i].results[0].alternatives[0]; // Best alternative
		var nwords = result.word_confidence.length;
		for (var j = 0; j < nwords; j++) {
			var wstring = result.word_confidence[j][0];
			var wconf = result.word_confidence[j][1];
			var tstart = result.timestamps[j][1];
			var tfinish = result.timestamps[j][2];
			var tword = new TranscriptWord(wstring, wconf, tstart, tfinish, i);			
			this.utterances[i].push(tword);
			this.words.push(tword);
		}
	}
	
	this.getWords = function() {
		var words_only = this.words.map(function(a) {return a.word;});
		return words_only;
	};
	
	this.getText = function() {
		var text ='';
		for (var i = 0; i < this.utterances.length; i++) {
			for (var j = 0; j < this.utterances[i].length; j++) {
				text = text + this.utterances[i][j].word + ' ';
			}
			if (i < this.utterances.length - 1) {
				var start = this.utterances[i+1][0].tstart;
				var finish = this.utterances[i][this.utterances[i].length-1].tfinish;
				var pause = start - finish;
				pause = pause.toFixed(2);
				text = text + ' [' + pause + ']';
			}
			text = text + '<br><br>';
			
		}
		return text;
	};
	
	
}