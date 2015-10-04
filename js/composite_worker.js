var LIGHTEN_COMPOSITE = 1;
var DARKEN_COMPOSITE = 2;

self.imageData = null;
self.compositeData = [];
self.processing = false;

self.onmessage = function(e) {
    //console.log(e.data);
    if(e.data instanceof ImageData) {
	if(!self.imageData) {
	    self.imageData = e.data;
	}
	else {
	    self.compositeData.push(e.data);
	    self.composite();
	}
    }
    else {
	switch(e.data.cmd) {
	case "getImageData":
	    self.postMessage(self.imageData, [self.imageData.data.buffer]);
	    break;
	default:
	}
    }
};

self.composite = function() {
    if(!self.processing && self.compositeData.length > 0) {
	self.processing = true;
	//console.log("composite start");
	var compositeData = self.compositeData.shift();
	if(self.imageData.data.length != compositeData.data.length) {
	    // 異なったサイズの画像が渡された
	    self.error("画像サイズが異なります。");
	}
	else {
	    var bufferLength = compositeData.data.length;
	    for(var i=0; i<bufferLength; i+=4) {
		var dR = compositeData.data[i] - self.imageData.data[i];
		var dG = compositeData.data[i+1] - self.imageData.data[i+1];
		var dB = compositeData.data[i+2] - self.imageData.data[i+2];
		var dLightness = 0.299*dR + 0.587*dG + 0.144*dB;
		if(dLightness > 0) {
		    // compositeDataのピクセルが明るい
		    self.imageData.data[i] = compositeData.data[i];
		    self.imageData.data[i+1] = compositeData.data[i+1];
		    self.imageData.data[i+2] = compositeData.data[i+2];
		    self.imageData.data[i+3] = compositeData.data[i+3];
		}
	    }
	    self.notify("finish", null);
	}
	self.processing = false;
    }
};

self.notify = function(message, data) {
    var notify = {
	type: "notify",
	message: message,
	data: data
    };
    self.postMessage(notify);
};

self.error = function(message) {
    var error = {
	type: "error",
	message: message
    };
    self.postMessage(error);
};
