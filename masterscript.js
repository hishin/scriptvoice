/**
 * Created: 2016. 02. 03.
 * Last modified: 2016. 02. 03
 * Master Script object
 */

var Masterscript = function(text) {
	// Split text into words and punctuations.
	var self = this;
	var tokens = splitText(text);
	
	function getTokens() {
		return tokens;
	};
	
	this.words = splitText(text);
}

/**
 * Splits text into words and punctuations.
 */
function splitText(text) {
	// separate non-word character (a-Z, A-Z, 0-9, _) 
//	var temp = text.replace(/[^\w’*\w]/g, function ($1) { return ' ' + $1 + ' ';}).replace(/[' ']+/g, ' ');
	var splitted = text.trim().split(/(\S+\s+)/).filter(function(n) {return n});
	console.log(splitted);
	return splitted;
}