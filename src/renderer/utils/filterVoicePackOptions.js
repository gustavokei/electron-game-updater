/**
 * Filters voice pack options to exclude those that match the current language
 * Based on the requirement that we can't have PT_PT, EN_EN, TW_TW combinations
 * 
 * @param {Array} voicePacks - Array of voice pack objects with value and label
 * @param {string} currentLanguage - Current selected language (PT, EN, TW)
 * @returns {Array} Filtered array of voice pack options
 */
const filterVoicePackOptions = (voicePacks, currentLanguage) => {
  if (!voicePacks || !Array.isArray(voicePacks) || !currentLanguage) {
    return voicePacks || [];
  }

  // Filter out voice packs that match the current language
  return voicePacks.filter(voicePack => {
    return voicePack.value !== currentLanguage;
  });
};

/**
 * Checks if a voice pack is valid for the current language
 * 
 * @param {string} voicePack - Voice pack value to check
 * @param {string} currentLanguage - Current selected language
 * @returns {boolean} True if the voice pack is valid for the current language
 */
const isValidVoicePackForLanguage = (voicePack, currentLanguage) => {
  if (!voicePack || !currentLanguage) {
    return true; // Allow empty voice pack
  }
  
  return voicePack !== currentLanguage;
};

module.exports = { 
  filterVoicePackOptions, 
  isValidVoicePackForLanguage 
};
