const { BrowserWindow } = require("electron");
const isDevelopment = process.env.NODE_ENV !== "production";
let mainWindow;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    width: 800,
    height: 600,
    frame: true,
    fullscreenable: false,
    maximizable: false,
    resizable: false,
    title: "Launcher",
    backgroundColor: "#222",
  });

  if (isDevelopment) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.loadURL(
      `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    );
  } else {
    mainWindow.loadURL(`file://${__dirname}/index.html`);
  }

  mainWindow.setMenuBarVisibility(false);

  return mainWindow;
};

module.exports = createMainWindow;
