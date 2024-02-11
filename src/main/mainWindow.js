const { BrowserWindow } = require('electron');
const isDevelopment = process.env.NODE_ENV !== 'production';
let mainWindow

const updater = () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
        },
        width: 609,
        height: 573,
        transparent: true,
        frame: false,
        fullscreenable: false,
        maximizable: false,
        resizable: false,
    });

    if (isDevelopment) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    }
    else {
        mainWindow.loadURL(`file://${__dirname}/index.html`);
    }

    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send("call-patcher");
    });

    return mainWindow;
};

module.exports = updater;
