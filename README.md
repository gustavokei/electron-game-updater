# Electron Game Updater
![app image](https://i.imgur.com/8PDZc3N.gif)

This Windows app tries to replicate the behaviour of the original launcher of the game [Grand Chase (for PC)](https://grandchase.fandom.com/wiki/Grand_Chase)

* Auto updates game files
* Auto updates itself
* Compares size and hash (if specified) from files
* Launches any .exe with parameters if necessary

The releases in this repository are linked to my own Grand Chase Private Server.

Additionaly, text is in Brazilian Portuguese.

If you wish to make this project work for your game, clone/fork this repository and follow the steps bellow.

## Step 1 - Edit `package.json`

This will make the package your own and implement auto update

The `publish` repo will contain the launcher releases (no source code).

Therefore, if you decide your updater should be closed source, create two repositories: one (private) for the launcher source code, and another one (public) that will "host" the installer

```json
...
"name": "your-repo-name",
"productName": "Your Game Name",
"author": "Your Name",
"description": "A description",
"version": "1.0",
"fileAssociations": {
  "description": "The same description"
},
...
    "publish": [
      {
        "provider": "github",
        "repo": "your-launcher-repo-name",
        "owner": "your-git-name",
        "private": "true or false",
        "releaseType": "release"
      },
    ]
...
```

## Step 2 - Edit `build/egu-config.json`

* `clientDir` = the directory name where the client will be downloaded (it will be inside the installation directory chosen by the user)
* `updateList` = url to json file generated with [electron-game-updater-helper](https://github.com/gustavokei/electron-game-updater-helper)
* `installZeroTier` = my private server runs with VPN, but if you don't want to use this, set to false
* `zeroTierNetId` = visit [www.zerotier.com](https://www.zerotier.com/) to know more
* `startCmd` = start command
* `isDev` = setting this to true will open Chrome DevTools
```json
{
  "clientDir": "gc-client",
  "updateList": "http://gustavokei.000webhostapp.com/eguh-update-list.json",
  "installZeroTier": true,
  "zeroTierNetId": "8850338390545e28",
  "startCmd": "start main.exe __kogstudios_original_service__",
  "isDev": false
}
```

## Step 3 - Build & Publish

If your updater is closed source, you will need to [create a github token and set an environment variable (on user machine)](https://www.electron.build/auto-update#private-github-update-repo)

### create a `.env` file in the root directory

```dosini
GH_OWNER=your-git-username
GH_REPO=your-private-repo
GH_TOKEN=your-git-token
```

Push your changes and run `npm run publish`

This will create a release on your `publish` repository and run `build/delete-old-releases.js` since there is no need for older releases

You're done!

## Testing

To develop this project, you need to set `isDev` to true on `build/egu-config.json` which will open Chrome DevTools when the updater launches.

Then, run `npm run build` and you'll find a test build in the `dist/nsis-web` directory.
