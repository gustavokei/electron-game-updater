const fs = require("fs");

/**
 * Update a field in the launcher-config.json file or update an existing game.
 *
 * @param {string} field - The field to update or 'games' to push a new game.
 * @param {any} value - The new value for the field or the game object to update.
 * @param {string} path - The launcher-config.json path.
 * @returns {Promise<void>}
 */
async function updateConfigJson(field, value, path) {
  try {
    // Always read the latest config file before making changes
    const data = await fs.promises.readFile(path, "utf8");
    const updateJson = JSON.parse(data);

    if (field === "games") {
      if (!Array.isArray(updateJson.games)) {
        updateJson.games = [];
      }

      const existingGameIndex = updateJson.games.findIndex(
        (game) => game.name === value.name
      );

      if (existingGameIndex !== -1) {
        // Update the existing game's versions
        updateJson.games[existingGameIndex].clientVer =
          value.clientVer != null ? value.clientVer : updateJson.games[existingGameIndex].clientVer;
        updateJson.games[existingGameIndex].patchVer =
          value.patchVer != null ? value.patchVer : updateJson.games[existingGameIndex].patchVer;
      } else {
        // Add the new game to the array
        updateJson.games.push(value);
      }      
      // eslint-disable-next-line no-prototype-builtins
    } else if (updateJson.hasOwnProperty(field)) {
      // Update the field if it exists
      updateJson[field] = value;
    }

    // Write the updated config back to the file
    await fs.promises.writeFile(
      path,
      JSON.stringify(updateJson, null, 4),
      "utf8"
    );
  } catch (error) {
    console.error("Error updating launcher-config.json:", error);
  }
}

module.exports = { updateConfigJson };
