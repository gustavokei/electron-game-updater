const { app, ipcMain, dialog } = require("electron");
const createMainWindow = require("./mainWindow");
const isDevelopment = process.env.NODE_ENV !== "production";
const path = require("path");
let mainWindow;

// Track active downloads to prevent multiple simultaneous downloads
const activeDownloads = [];

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
    // Check if download is already active
    if (activeDownloads.includes(data.options.step)) {
      return;
    }
    
    // Add to active downloads
    activeDownloads.push(data.options.step);
    
    data.options.onProgress = (status) => {
      mainWindow.send("download progress", status);
    };
    
    // Add overwrite option to prevent duplicate files
    data.options.overwrite = true;
    
    download(mainWindow, data.url, data.options)
      .then(() => {
        // Remove from active downloads
        const index = activeDownloads.indexOf(data.options.step);
        if (index > -1) {
          activeDownloads.splice(index, 1);
        }
        
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
      .catch((error) => {
        // Remove from active downloads on error
        const index = activeDownloads.indexOf(data.options.step);
        if (index > -1) {
          activeDownloads.splice(index, 1);
        }
        console.error("Download error:", error);
        mainWindow.send("download error");
      });
  });
});
