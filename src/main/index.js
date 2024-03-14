const { app, ipcMain } = require('electron');
const createMainWindow = require('./mainWindow');
const isDevelopment = process.env.NODE_ENV !== 'production';
const path = require('path');

let mainWindow;

app.on('ready', () => {
  mainWindow = createMainWindow();

  ipcMain.on("close-app", () => {
    app.quit();
  });

  ipcMain.on("get-file-path", (event, arg) => {
    if (isDevelopment) {
      event.returnValue = path.dirname(app.getAppPath())
    } else {
      event.returnValue = process.env.PORTABLE_EXECUTABLE_DIR
    }

  });

  const { download } = require("electron-dl");
  ipcMain.on("download", (event, data) => {
    data.options.onProgress = (status) => {
      mainWindow.send("download progress", status);
    }
    download(mainWindow, data.url, data.options).then(() => {
      if (data.options.filename === "launcher-new.exe") {
        mainWindow.send("download complete launcher");
      } else {
        mainWindow.send("download complete")
      }
    }).catch(() => mainWindow.send("download error"));
  });
});