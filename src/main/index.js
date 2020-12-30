"use strict";
import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { format as formatUrl } from "url";

// Get config.json file
const fs = require("fs");
let configFile;
try {
  configFile = JSON.parse(
    fs.readFileSync(
      app.getPath("exe").substring(0, app.getPath("exe").lastIndexOf("\\")) +
        "/egu-config.json"
    )
  );
} catch (e) {
  throw new Error(e);
}

//
// Chocolatey & ZeroTier
//
const zeroTierNetId = configFile.zeroTierNetId;
let { exec } = require("child_process");

const checkDependencies = () => {
  exec("choco", (error, stdout) => {
    if (stdout.includes("Chocolatey")) {
      checkZeroTier();
    } else {
      installChocolatey();
    }
  });
};

const checkZeroTier = () => {
  exec("zerotier-cli info", (error, stdout) => {
    if (stdout.includes("200")) {
      checkConnection();
    } else {
      installZeroTier();
    }
  });
};

const checkConnection = () => {
  exec("zerotier-cli listnetworks", (error, stdout) => {
    if (stdout.includes(zeroTierNetId)) {
      checkDriver();
    } else {
      joinZeroTier();
    }
  });
};

const checkDriver = () => {
  exec(
    `netsh interface show interface "ZeroTier One [${zeroTierNetId}]"`,
    (error, stdout) => {
      if (stdout.includes("Connected")) {
        runPatcher();
      } else {
        enableZeroTier();
      }
    }
  );
};

const runSelfUpdate = () => {
  if (configFile.isDev) {
    runPatcher();
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }
};

const showErrorAndExit = (e) => {
  dialog.showErrorBox(
    "Erro: ",
    e == null ? "desconhecido" : (e.stack || e).toString()
  );
  loaderWindow.close();
};

const showMessageAndExit = (e) => {
  const options = {
    title: "Aviso",
    type: "warning",
    buttons: ["OK"],
    message: e,
  };

  dialog.showMessageBox(loaderWindow, options).then((result) => {
    if (result.response === 0) {
      app.exit();
    }
  });
};

const joinZeroTier = () => {
  sendStatusToWindow("Conectando à rede");
  exec(`zerotier-cli join ${zeroTierNetId}`, (error, stdout, stderr) => {
    if (error == null) {
      enableZeroTier();
    } else {
      showErrorAndExit(stderr);
    }
  });
};

const enableZeroTier = () => {
  sendStatusToWindow("Conectando ao servidor");
  exec(
    `netsh interface set interface "ZeroTier One [${zeroTierNetId}]" enable`,
    (error, stdout, stderr) => {
      if (error == null) {
        runPatcher();
      } else {
        showErrorAndExit(stderr);
      }
    }
  );
};

const installChocolatey = () => {
  sendStatusToWindow("Instalando dependências 1/2");
  exec(
    "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))",
    { shell: "powershell.exe" },
    (error, stdout, stderr) => {
      if (error == null) {
        showMessageAndExit(
          "Dependência 1 foi instalada. Por favor, reinicie o launcher."
        );
      } else {
        showErrorAndExit(stderr);
      }
    }
  );
};

const installZeroTier = () => {
  sendStatusToWindow("Instalando dependências 2/2");
  exec(
    "choco install zerotier-one -force -y",
    { shell: "powershell.exe" },
    (error, stdout, stderr) => {
      if (error == null) {
        showMessageAndExit(
          "Dependência 2 foi instalada. Por favor, reinicie o launcher novamente."
        );
      } else {
        showErrorAndExit(stderr);
      }
    }
  );
};
//

let loaderWindow;
const createLoaderWindow = () => {
  loaderWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    width: 340,
    height: 100,
    transparent: true,
    frame: false,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
  });

  if (configFile.isDev) {
    loaderWindow.webContents.openDevTools();
    loaderWindow.webContents.on("devtools-opened", () => {
      setImmediate(() => {
        loaderWindow.focus();
      });
    });
  }
  loaderWindow.setResizable(false);
  loaderWindow.loadURL(`file://${__dirname}/index.html#/loader`);
  loaderWindow.on("closed", () => (loaderWindow = null));
  loaderWindow.webContents.on("did-finish-load", () => {
    loaderWindow.show();
  });
};

// Global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;
const createMainWindow = () => {
  const window = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true, // Electron 10 compatibility for remote()
    },
    width: 609,
    height: 573,
    transparent: true,
    frame: false,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
  });

  let url;
  if (configFile.isDev) {
    window.webContents.openDevTools();
    window.webContents.on("devtools-opened", () => {
      setImmediate(() => {
        window.focus();
      });
    });
  }
  url = formatUrl({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file",
    slashes: true,
  });

  window.on("error", (error) => {
    console.error({
      error,
    });
  });
  window.on("closed", () => {
    mainWindow = null;
  });

  window.loadURL(url);

  return window;
};

const runPatcher = () => {
  mainWindow = createMainWindow();
  loaderWindow.close();

  //
  // patcher.js
  //
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("call-patcher");
  });
  //

  ipcMain.on("get-file-path", (event, arg) => {
    event.returnValue = app
      .getPath("exe")
      .substring(0, app.getPath("exe").lastIndexOf("\\"));
  });

  const { download } = require("electron-dl");
  ipcMain.on("download", (event, data) => {
    data.options.onProgress = (status) =>
      mainWindow.send("download progress", status);
    download(mainWindow, data.url, data.options)
      .then(() => mainWindow.send("download complete"))
      .catch(() => mainWindow.send("download error"));
  });
};

ipcMain.on("close-app", () => {
  app.exit();
});

const { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

autoUpdater.autoDownload = false;

autoUpdater.on("error", (error) => {
  dialog.showErrorBox(
    "Error: ",
    error == null ? "unknown" : (error.stack || error).toString()
  );
  loaderWindow.close();
});

const sendStatusToWindow = (text) => {
  loaderWindow.webContents.executeJavaScript(
    "document.getElementById('LoaderContent').innerHTML = '" + text + "'"
  );
};

autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("Procurando atualização");
});

autoUpdater.on("update-available", () => {
  sendStatusToWindow("Atualização disponível");
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-not-available", () => {
  sendStatusToWindow("Atualização indisponível");
  if (configFile.installZeroTier) {
    checkDependencies();
  } else {
    runPatcher();
  }
});

autoUpdater.on("download-progress", (progressObj) => {
  let log_message = "Baixados: " + Math.floor(progressObj.percent) + "%";
  sendStatusToWindow(log_message);
});

autoUpdater.on("update-downloaded", () => {
  sendStatusToWindow("Atualização baixada");
  autoUpdater.quitAndInstall();
});

// create main BrowserWindow when electron is ready
app.on("ready", () => {
  createLoaderWindow();
  runSelfUpdate();
});

if (module.hot) {
  module.hot.accept();
}
