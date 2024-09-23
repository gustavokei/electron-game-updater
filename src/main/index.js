const { app, ipcMain, dialog } = require("electron");
const createMainWindow = require("./mainWindow");
const isDevelopment = process.env.NODE_ENV !== "production";
const path = require("path");
let mainWindow;

app.on("ready", () => {
  mainWindow = createMainWindow();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.setAlwaysOnTop(false);

  ipcMain.on("close-app", () => {
    app.exit();
  });

  ipcMain.on("get-file-path", (event) => {
    if (isDevelopment) {
      event.returnValue = path.resolve(app.getAppPath(), "..");
    } else {
      event.returnValue = process.env.PORTABLE_EXECUTABLE_DIR;
    }
  });

  ipcMain.on("show-error", (event, error) => {
    dialog
      .showMessageBox({
        type: "error",
        title: "Application Error",
        message: error.toString(),
        buttons: ["OK"],
      })
      .then((result) => {
        if (result.response === 0) {
          app.quit();
        }
      });
  });

  ipcMain.on("show-warn", (event, error) => {
    dialog.showMessageBox({
      type: "warning",
      title: "Application Warning",
      message: error.toString(),
      buttons: ["OK"],
    });
  });

  const { download } = require("electron-dl");
  ipcMain.on("download", (event, data) => {
    data.options.onProgress = (status) => {
      mainWindow.send("download progress", status);
    };
    download(mainWindow, data.url, data.options)
      .then(() => {
        switch (data.options.step) {
          case "launcher":
            mainWindow.send("download launcher complete");
            break;
          case "client":
            mainWindow.send("download client complete");
            break;
          case "patch":
            mainWindow.send("download patch complete");
            break;
          default:
            mainWindow.send("download default complete");
        }
      })
      .catch(() => {
        mainWindow.send("download error");
      });
  });
});
