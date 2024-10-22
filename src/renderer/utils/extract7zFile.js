const path = require("path");
const Seven = require("node-7z");
const isDevelopment = process.env.NODE_ENV !== "production";

const getSevenZipBinPath = () => {
  if (!isDevelopment) {
    return path.join(
      process.resourcesPath,
      "7zip-bin",
      "win",
      "x64",
      "7za.exe"
    );
  } else {
    return require("7zip-bin").path7za;
  }
};

const extract7zFile = async (archivePath, outputDir, progressCallback) => {
  return new Promise((resolve, reject) => {
    const pathTo7zip = getSevenZipBinPath(); // Use the correct path
    const extractionStream = Seven.extractFull(archivePath, outputDir, {
      $bin: pathTo7zip, // Pass the resolved path to the 7zip binary
      $progress: true, // Enables progress reporting
    });

    extractionStream.on("progress", (progress) => {
      progressCallback(progress);
    });

    extractionStream.on("end", () => {
      resolve();
    });

    extractionStream.on("error", (err) => {
      console.error(err);
      reject(err);
    });
  });
};

module.exports = { extract7zFile };
