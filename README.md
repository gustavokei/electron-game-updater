# Electron Game Updater

![app image](https://i.imgur.com/8PDZc3N.gif)

This Windows app tries to replicate and improve the behaviour of the original launcher of the game [Grand Chase (for PC)](https://grandchase.fandom.com/wiki/Grand_Chase)

Features:

- Portable .exe
- Auto updates game files
- Auto updates itself
- Compares size and hash (if specified) from files
- Launches any .exe with parameters if necessary

Text is in Brazilian Portuguese.

As of early 2024, I have refactored the project in order to make it portable and easier to configure.

To use it, you can download the portable .exe and create your own `egu-config.json` (they need to be in the same directory)

```json
{
  "launcherVer": 1, // this must be a number and will be used to auto update your portable .exe if there is a higher version on "configFileRemote" field
  "clientDir": "game-client", // name of the folder that will be created next to the portable .exe and where the game files will be downloaded into
  "startCmd": "start game.exe", // command to run when clicking on the start button (supports parameters)
  "launcherUrl": "https://url-to-your/launcher.exe", // updater will download and autoupdate if remote launcherVer is higher than local
  "configFileRemote": "https://url-to-your/egu-config.json", // remote url for egu-config.json (the updater will compare the launcherVer field)
  "updateList": "https://url-to-your/egu-update-list.json", // remote url for eguh-update-list.json (see below how to generate yours)
  "iframeUrl": "https://github.com/" // page to show in the launcher
}
```

You will need this [helper tool](https://github.com/gustavokei/electron-game-updater-helper) in order to generate your `eguh-update-list.json`

For now, if you want to change the icon, splash, and all other image assets, you will have to compile the project. It is pretty easy to do it though, just switch to node v16, clone this repo, and finally run `npm install` and `npm run build`. There is also a development mode now, just put `egu-config.json` and `eguh-update-list.json` at the root directory and run `npm run dev`.