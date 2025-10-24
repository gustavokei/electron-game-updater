const handleLanguageChange = (language, setSelectedLanguage, configLocalPath) => {
  setSelectedLanguage(language);
  
  // Save language selection directly to prevent crashes
  try {
    const fs = require('fs');
    const data = fs.readFileSync(configLocalPath, 'utf8');
    const config = JSON.parse(data);
    
    config.selectedLanguage = language;
    
    fs.writeFileSync(configLocalPath, JSON.stringify(config, null, 4), 'utf8');
  } catch (error) {
    console.warn("Failed to save language selection:", error);
  }
};

module.exports = { handleLanguageChange };
