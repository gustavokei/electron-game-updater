const { ipcRenderer } = require("electron");
const isDevelopment = process.env.NODE_ENV !== "production";

const getSevenZipBinPath = () => {
  let sevenZipBinPath;
  const currentDir = ipcRenderer.sendSync("get-file-path", "");
  try {
    if (isDevelopment) {
      sevenZipBinPath = "7za.exe";
    } else {
      sevenZipBinPath = `${currentDir}\\7za.exe`;
    }
    return sevenZipBinPath;
  } catch (error) {
    return null;
  }
};

module.exports = { getSevenZipBinPath };
