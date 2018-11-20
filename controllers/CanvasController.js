const path = require('path');
const { ipcRenderer } = require('electron');

class CanvasController {

    constructor() {

        this.canvas = document.querySelector("#canvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.context = this.canvas.getContext("2d");

        ipcRenderer.on('select-file', (event, data) => {

            console.log('select-file', data);
            this.addImage(data.file, data.zoom);

        });

        ipcRenderer.on('clear-view', (event, arg)=>{

            this.currentFile = null;
            this.clearAll();

        });

        ipcRenderer.on('change-zoom', (event, zoom)=>{

            this.setZoomInImage(zoom);

        });

    }

    sendChangeView() {

        ipcRenderer.send('change-view', {
            dataUrl: this.getBase64()
        });

    }

    clearAll() {

        this.context.restore();

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.save();

        this.sendChangeView();

    }

    setZoomInImage(zoom) {

        if (this.currentFile) this.addImage(this.currentFile, zoom);


    }

    addImage(file, zoom) {

        if (!file.content) {
            this.clearAll();
            return false;
        }

        if (!zoom) zoom = 1;
        this.currentFile = file;

        this.clearAll();

        this.image = new Image();
        this.image.src = file.content;

        this.image.onload = () => {

            this.context.setTransform(zoom, 0, 0, zoom, this.context.canvas.width / 2, this.context.canvas.height / 2);
            this.context.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);

            this.sendChangeView();

        }

    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = this.context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        this.context.fillText(line, x, y);
    }

    setText(text) {

        this.clearAll();

        this.context.font = "64px Arial";
        this.context.fillStyle = '#FFF';
        this.context.textAlign = "center";

        this.wrapText(text, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width - 100, 64);

        this.sendChangeView();

    }

    getBase64() {

        return this.canvas.toDataURL();

    }

}

module.exports = CanvasController;