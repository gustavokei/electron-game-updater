const { ipcRenderer } = require("electron");
const fs = require("fs");
const { CONFIG, DEFAULT_CONFIG } = require("../../constants");
const filePath = ipcRenderer.sendSync("get-file-path", "");
const isDevelopment = process.env.NODE_ENV !== "production";

const getConfigFileLocal = () => {
  let configFileLocal;
  const configPath = isDevelopment
    ? CONFIG.FILE_NAME
    : `${filePath}/${CONFIG.FILE_NAME}`;

  try {
    configFileLocal = JSON.parse(fs.readFileSync(configPath));
    
    // Check if any required fields are missing by comparing with DEFAULT_CONFIG
    const requiredFields = Object.keys(DEFAULT_CONFIG);
    const hasMissingFields = requiredFields.some(field => 
      configFileLocal[field] === undefined || 
      configFileLocal[field] === null ||
      (Array.isArray(DEFAULT_CONFIG[field]) && !Array.isArray(configFileLocal[field]))
    );

    if (hasMissingFields) {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
      configFileLocal = DEFAULT_CONFIG;
    }
  } catch (error) {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    configFileLocal = DEFAULT_CONFIG; // Return the default config
  }

  return configFileLocal;
};

module.exports = { getConfigFileLocal };
