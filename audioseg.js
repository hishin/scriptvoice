var dataOffset = 44;
var byteRate = 88200;

var AudioSegment = function(_src, _tstart, _tend) {
	this.src = _src;
	this.tstart = _tstart;
	this.tend = _tend;
};

function clickSave() {
	if (msblob) {
		var seconds = new Date().getTime() / 1000;
		seconds = Math.round(seconds);
		uploadBlobToServer(msblob, 'audio', 'masterscript_' +seconds.toString()+'.wav');
	}
};

function updateMasterscriptAudio() {
	if (msaudios.length == 0)
		return;
	var asrc, ablob, astart, aend, alength;
	var headerblob;
	var datablob = [];
	var wavsize = 0;
	for (var i = 0; i < msaudios.length; i++) {
		aseg = msaudios[i];
		console.log(aseg.src);
		ablob = audioblobs[aseg.src];
		if (i == 0) {
			headerblob = getWavHeader(ablob);
			datablob.push(headerblob);
		}

		var temp = new wav(ablob);
		temp.onloadend = function() {
			console.log(this);
		};
		alength = Math.ceil((aseg.tend - aseg.tstart) * 100) / 100;
		sliceblob = sliceWavBlob(ablob, aseg.tstart, alength);
		console.log('start=' + aseg.tstart + ' alength=' + alength + ' size='
				+ sliceblob.size);

		wavsize += sliceblob.size;
		datablob.push(sliceblob);

	}
	var newblob = new Blob(datablob);
	var reader = new FileReader();
	reader.readAsArrayBuffer(newblob);
	reader.onloadend = function() {

		// update chunkSize in header
		var chunkSize = new Uint8Array(this.result, 4, 4);
		tolittleEndianDecBytes(chunkSize, 36 + wavsize);

		// update dataChunkSize in header
		var dataChunkSize = new Uint8Array(this.result, 40, 4);
		tolittleEndianDecBytes(dataChunkSize, wavsize);

		msblob = new Blob([ this.result ]);

		msaudiosrc = URL.createObjectURL(msblob);
		$('#ms-audio-player').attr('src', msaudiosrc);
		
		console.log($('#ms-audio-player').attr('src'));

	};
}

function sliceWavBlob(wavblob, start, length) {
	var start = Math.floor(dataOffset + (start * byteRate) * 100) / 100;
	var end = start + (length * byteRate);
	var dataBlob = wavblob.slice(start, end);
	return dataBlob;
};

function getWavHeader(wavblob) {
	var headerBlob = wavblob.slice(0, 44);
	return headerBlob;
};

function tolittleEndianDecBytes(a, decimalVal) {
	for (var i = 0; i < a.length; i++) {
		a[i] = decimalVal & 0xFF;
		decimalVal >>= 8;
	}
	return a;
};