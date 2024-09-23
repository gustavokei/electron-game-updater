const { ipcRenderer } = require('electron');

const showError = (error) => {
    ipcRenderer.send('show-error', error);
}

module.exports = { showError };
