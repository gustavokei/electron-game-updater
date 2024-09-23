const { ipcRenderer } = require('electron');

const showWarn = (error) => {
    ipcRenderer.send('show-warn', error);
}

module.exports = { showWarn };
