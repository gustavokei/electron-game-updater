const { getMessages, getLocale } = require("../../utils/i18n");

// Helper function to get translated text
const getTranslatedText = (key, values = {}) => {
  const locale = getLocale();
  const messages = getMessages(locale);
  let text = messages[key] || key;
  
  // Replace placeholders like {number} with actual values
  Object.keys(values).forEach(key => {
    text = text.replace(`{${key}}`, values[key]);
  });
  
  return text;
};

module.exports = { getTranslatedText };
