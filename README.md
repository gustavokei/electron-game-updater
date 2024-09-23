# Electron Game Updater

![app image](https://i.imgur.com/8uKTodS.gif)

**Electron Game Updater** is an application built with Electron and React, designed to simplify the process of installing and updating games on Windows. This application features support for multiple games, automatic updates, and seamless patching through compressed files.

## Features

- Supports multiple games in one launcher
- Portable `.exe` for easy distribution
- Automatically updates game files and itself
- 7zip integration
- Custom game launch commands with parameters
- Displays dynamic remaining time, progress, and download speed during updates
- Reopens at the last selected game, so you don’t have to navigate to your most played game every time the launcher opens

## How It Works

The application downloads and extracts the latest game files or patches from hosted URLs, comparing versions defined in a JSON configuration file. It auto-updates the games as well as the launcher itself. 

**Note:** The diagram below is a simplified version of the application’s workflow.

![app diagram](https://i.imgur.com/D9jaGkl.png)

## Getting Started

### Prerequisites

1. **Node.js**: Make sure you have Node.js installed. The highest supported version is `16.20.2`. You can download it [here](https://nodejs.org/en/download/).

### Usage

1. **Create and Host Your JSON Configuration File**

   The application requires a hosted JSON file that defines the games, their versions, and URLs for updates.

   Example of a JSON file:

   ```json
   {
     "launcherVer": 1,
     "launcherUrl": "https://your-server.com/launcher.7z",
     "games": [
       {
         "name": "game1",
         "startCmd": "start game1.exe param1 param2",
         "clientVer": 1,
         "patchVer": 0,
         "clientUrl": "https://your-server.com/game1-client.7z",
         "patchUrl": "https://your-server.com/game1-patch.7z"
       },
       {
         "name": "game2",
         "startCmd": "start game2.exe paramA paramB",
         "clientVer": 1,
         "patchVer": 0,
         "clientUrl": "https://your-server.com/game2-client.7z",
         "patchUrl": "https://your-server.com/game2-patch.7z"
       }
     ]
   }
- **launcherVer**: Version of the launcher.

- **games**: Array of games with their respective launch commands, version numbers, and URLs for the client and patches.

  - **client**: When you upload a new client, increment the `clientVer` by 1 and update the `clientUrl` if necessary. Note that when a new client is uploaded, the launcher will automatically reset `patchVer` back to 0, indicating that there are no patches associated with the new client version.

  - **patch**:
    - Use a single `patchUrl` (e.g., `game1-patch.7z`).
    - When uploading patches, follow the naming convention `game1-patchX.7z`, where `X` is the patch version number.
    - For example, if `patchVer` is 3, you should have uploaded `game1-patch1.7z`, `game1-patch2.7z`, and `game1-patch3.7z` to support incremental updates.
    - Ensure that the digit before `.7z` in the uploaded patch files matches the `patchVer` in the JSON. This means if `patchVer` is 3, the latest patch file must be named `game1-patch3.7z`.


### Clone This Repository
```bash
git clone https://github.com/gustavokei/electron-game-updater.git
```

### Configure the Launcher
Edit the `defaultConfig` object in `src/renderer/utils/getConfigFileLocal.js` to point to your hosted JSON file:

```js
const defaultConfig = {
  updaterUrl: "https://your-server.com/your-json-file.json", // Your JSON URL goes here
  launcherVer: 1,
  lastSelectedGame: "",
  games: [],
};
```
### Customize the UI
Images and icons are located in `src/renderer/assets`. Customize these assets to fit your games.

Adjust the `background-image` properties of `.game-icon` and `.game-patcher` in `src/renderer/styles.scss` to use the same `game.name` property from your JSON configuration.

### Install Dependencies
Navigate to the project's root directory and run:

```bash
npm install
```

### Build the Application
To create the executable:

```bash
npm run build
```
This will generate a `launcher.exe` in the `./dist` directory. Make sure to include `7za.exe` available in the same directory as your launcher. You can use the included version or download the latest from the [official 7zip website](https://www.7-zip.org/download.html).

### Development Mode

For development and testing, you can run the project in development mode with hot reload:

```bash
npm run dev
```

In development mode, the application ignores the `launcherVer` checking, which allows for easier testing without needing to increment the version for each change.

## Additional Notes

Users are encouraged to open issues for any bugs or feature requests and to submit pull requests for improvements. Your contributions help make this project better for everyone!

This project is licensed under the MIT License, which allows you to use, modify, and distribute the software freely, as long as the original license and copyright notice are included in any copies or substantial portions of the software.

