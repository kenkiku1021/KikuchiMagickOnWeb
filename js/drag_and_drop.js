function DnDFileController(selector, onDropCallback, droppable) {
    var el = $(selector);

    this.onDragEnter = function(e) {
	e.stopPropagation();
	e.preventDefault();
	el.addClass(droppable);
    };

    this.onDragOver = function(e) {
	e.stopPropagation();
	e.preventDefault();
    };

    this.onDragLeave = function(e) {
	e.stopPropagation();
	e.preventDefault();
	el.removeClass(droppable);
    };

    this.onDrop = function(e) {
	e.stopPropagation();
	e.preventDefault();
	el.removeClass(droppable);
	onDropCallback(e.originalEvent.dataTransfer.files);
    };

    el.on('dragenter', this.onDragEnter);
    el.on('dragover', this.onDragOver);
    el.on('dragleave', this.onDragLeave);
    el.on('drop', this.onDrop);
}
