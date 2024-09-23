const Seven = require("node-7z");
const { getSevenZipBinPath } = require("./getSevenZipBinPath");

const extract7zFile = async (archivePath, outputDir, progressCallback) => {
  return new Promise((resolve, reject) => {
    const pathTo7zip = getSevenZipBinPath();
    const extractionStream = Seven.extractFull(archivePath, outputDir, {
      $bin: pathTo7zip,
      $progress: true,
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
