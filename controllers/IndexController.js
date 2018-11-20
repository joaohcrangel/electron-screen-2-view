const Datastore = require('nedb');
const { ipcRenderer } = require('electron');

class IndexController {

    constructor() {

        this.db = new Datastore({
            filename: './data.db',
            autoload: true
        });

        this.inputZoom = document.querySelector('#input-zoom');
        this.btnClearView = document.querySelector('#btn-clear-view');
        this.cardView = document.querySelector('#card-view');
        this.list = document.querySelector('#list');
        this.inputFile = document.querySelector('#file');
        this.btnAddFile = document.querySelector('#btn-add-file');
        this.body = document.querySelector('body');

        this.inputZoom.addEventListener('mousemove', e => {

            if (this.inputZoom.value !== this.currentZoom) {

                this.currentZoom = this.inputZoom.value;

                ipcRenderer.send('change-zoom', this.currentZoom);

            }

        });

        ipcRenderer.on('change-view', (event, data) => {

            this.cardView.src = data.dataUrl;

        });

        this.btnClearView.addEventListener('click', e => {

            ipcRenderer.send('clear-view');

        });

        this.body.addEventListener('dragend', e => {

            e.preventDefault();

        });

        this.body.addEventListener('dragstart', e => {

            e.preventDefault();

        });

        this.body.addEventListener('dragover', e => {

            e.preventDefault();

        });

        this.body.addEventListener('drop', e => {

            e.preventDefault();

            if (e.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < e.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (e.dataTransfer.items[i].kind === 'file') {
                        var file = e.dataTransfer.items[i].getAsFile();

                        this.readerFile(file).then(content => {

                            this.saveFile({
                                name: file.name,
                                size: file.size,
                                content
                            }).then(newDoc => {
                                this.renderFile(newDoc);
                            });

                        });
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < e.dataTransfer.files.length; i++) {
                    var file = e.dataTransfer.items[i].getAsFile();

                    this.readerFile(file).then(content => {

                        this.saveFile({
                            name: file.name,
                            size: file.size,
                            content
                        }).then(newDoc => {
                            this.renderFile(newDoc);
                        });

                    });
                }
            }

        });

        this.btnAddFile.addEventListener('click', e => {

            this.inputFile.click();

        });

        this.inputFile.addEventListener('change', e => {

            let input = e.target;

            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];

                this.readerFile(file).then(content => {

                    this.saveFile({
                        name: file.name,
                        size: file.size,
                        content
                    }).then(newDoc => {
                        this.renderFile(newDoc);
                    });

                });

            }

            input.value = '';

        });

        document.addEventListener('DOMContentLoaded', function () {
            var elems = document.querySelectorAll('.fixed-action-btn');
            var instances = M.FloatingActionButton.init(elems, {});
        });

        this.renderAll();

        ipcRenderer.send('clear-view');

    }

    deleteFile(file) {

        return new Promise((resolve, reject) => {

            this.db.remove({ _id: file._id }, {}, (err, n) => {

                if (err) {
                    reject(err);
                } else {

                    resolve(n);

                }

            });

        });

    }

    saveFile(file) {

        return new Promise((resolve, reject) => {

            this.db.insert(file, (err, newDoc) => {

                if (err) {
                    reject(err);
                } else {
                    resolve(newDoc);
                }

            });

        });

    }

    readerFile(file) {

        return new Promise((resolve, reject) => {

            let reader = new FileReader();

            reader.onloadend = e => {

                resolve(reader.result, reader);

            }

            reader.onerror = e => {

                reject(e, reader);

            }

            reader.readAsDataURL(file);

        });

    }

    renderFile(file) {

        let div = document.createElement('div');

        div.classList.add('col');
        div.classList.add('s4');
        div.innerHTML = `
            <div class="card">
                <div class="card-image">
                    <img src="${file.content}" alt="${file.name}">
                </div>
                <div class="card-action">
                    <button type="button" class="btn-delete btn red waves-effect waves-light"><i class="large material-icons">delete</i></button>
                    <button type="button" class="btn-show btn waves-effect waves-light">Show <i class="material-icons right">send</i></button>
                </div>
            </div>
        `;

        this.list.append(div);

        let btnDelete = div.querySelector('.btn-delete');
        let btnShow = div.querySelector('.btn-show');

        btnDelete.addEventListener('click', e => {

            if (confirm('Deseja realmente excluir esta imagem?')) {

                this.deleteFile(file).then(() => {

                    div.replaceWith('');

                });

            }

        });

        btnShow.addEventListener('click', e => {

            ipcRenderer.send('select-file', {
                file,
                zoom: this.inputZoom.value
            });

        });

    }

    clearRender() {

        this.list.innerHTML = '';

    }

    renderAll() {

        return new Promise((resolve, reject) => {

            this.db.find({}, (err, docs) => {

                if (err) {
                    reject(err);
                } else {

                    this.clearRender();

                    docs.forEach(doc => {

                        this.renderFile(doc);

                    });

                    resolve(docs);

                }

            });

        });

    }

}

module.exports = IndexController;