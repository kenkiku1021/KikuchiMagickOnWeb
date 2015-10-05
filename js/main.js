var init = function() {
    $("#container").html($("#select-file-template").html());
    // Drag & Dropの初期化
    var dndController = new DnDFileController("#drop-area",
					      srcFilesSelected, "droppable");
    $("#src-files").on("change", function(e) {
	srcFilesSelected(this.files);
    });
};

var srcFilesSelected = function(files) {
    if(files.length == 0) {
	alert("ファイルが選択されていません。");
    }
    else if(files.length == 1) {
	alert("ファイルは2個以上選択する必要があります。");
    }
    else {
	var compositeController = new CompositeController(files);
	var loaded = $("#loaded-template").html();
	$("#container").html(loaded);
	$("#start-btn").click(function(e) {
	    $("#loaded-message #message").text("コンポジット実行中");
	    compositeController.composite();
	    $("#start-btn").attr("disabled", "disabled");
	    $("#abort-btn").removeAttr("disabled");
	});
	$("#abort-btn").click(function(e) {
	    compositeController.requestAbort();
	    init();
	});
    }
};

var CompositeController = function(files) {
    var controller = this;
    this.onmessage = function(e) {
	//console.log(this, controller, e.data);
	if(e.data instanceof ImageData) {
	    var context = controller.canvas.getContext("2d");
	    context.putImageData(e.data, 0, 0);
	    var imgUrl = controller.canvas.toDataURL("image/jpeg");
	    var resultImg = $("<img>").attr("src", imgUrl);
	    $("#container").html($("#result-template").html());
	    $("#result-image").html(resultImg);
	    $("#init-button").click(function(e) {
		init();
	    });
	}
	else {
	    switch(e.data.type) {
	    case "notify":
		switch(e.data.message) {
		case "finish":
		    // コンポジット完了
		    controller.updateProgress();
		    controller.pushImage();
		    break;
		}
		break;
	    case "error":
		// エラー
		alert(e.data.message);
	    }
	}
    };

    this.updateProgress = function() {
	var ratio = controller.currentImageIndex * 100.0 / controller.files.length;
	$("#composite-progress").css("width", ratio + "%");
	$("#composite-progress").text(String(controller.currentImageIndex)
				      + " / "
				      + String(controller.files.length));
    };
    
    this.pushImage = function() {
	if(this.abort) {
	    // 中断
	}
	else if(this.currentImageIndex < this.files.length) {
	    var reader = new FileReader();
	    reader.readAsDataURL(this.files[this.currentImageIndex]);
	    this.currentImageIndex++;
	    reader.onload = function() {
		var img = new Image();
		img.onload = function() {
		    if(!controller.canvas) {
			controller.canvas = document.createElement("canvas");
			controller.canvas.width = img.width;
			controller.canvas.height = img.height;
		    }
		    var context = controller.canvas.getContext("2d");
		    context.drawImage(img, 0, 0,
				      controller.canvas.width,
				      controller.canvas.height);
		    var imageData = context.getImageData(0, 0,
							 controller.canvas.width,
							 controller.canvas.height);
		    controller.worker.postMessage(imageData,
						  [imageData.data.buffer]);
		};
		img.src = reader.result;
	    };
	}
	else {
	    // コンポジット終了
	    //console.log("composite completed");
	    $("#composite-progress").removeClass("active");
	    controller.command("getImageData", null);
	}
    };

    this.command = function(cmd, data) {
	controller.worker.postMessage({
	    cmd: cmd,
	    data: data
	});
    };
    
    this.composite = function() {
	$("#composite-progress").addClass("active");
	this.pushImage(); // 1枚目
	this.pushImage(); // 2枚目
    };

    this.requestAbort = function() {
	// コンポジットの中断
	controller.abort = true;
    };

    this.abort = false;
    this.files = files;
    this.worker = new Worker("js/composite_worker.js");
    this.worker.onmessage = this.onmessage;
    this.currentImageIndex = 0;
}

$(function() {
    init();
});
