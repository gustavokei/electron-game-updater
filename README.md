# Electron Game Updater

You'll need this [helper tool](https://github.com/gustavokei/electron-game-updater-helper) in order to generate your `eguh-update-list.json`

![app image](https://i.imgur.com/8PDZc3N.gif)

This Windows app tries to replicate the behaviour of the original launcher of the game [Grand Chase (for PC)](https://grandchase.fandom.com/wiki/Grand_Chase)

- Auto updates game files
- Auto updates itself
- Compares size and hash (if specified) from files
- Launches any .exe with parameters if necessary

The releases in this repository are linked to my own Grand Chase Private Server.

Text is in Brazilian Portuguese.

If you wish to make this project work for you, clone/fork this repository and follow the steps bellow.

## Step 1 - Edit `package.json`

This will make the package your own and implement auto update.

The `publish` repo contains the launcher releases (no source code).

Therefore, if you decide your updater should be closed source, create two repositories: one (private) for the launcher source code, and another one (public). In the `publish` section below, you should use the public repo credentials.

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

- `clientDir` = the directory name where the client will be downloaded (it will be inside the installation directory chosen by the user)
- `updateList` = url to json file generated with [electron-game-updater-helper](https://github.com/gustavokei/electron-game-updater-helper)
- `installZeroTier` = my private server runs with VPN, so if you don't want to use this, set it to `false` (this installs Chocolatey + ZeroTier VPN)
- `zeroTierNetId` = visit [www.zerotier.com](https://www.zerotier.com/) to know more
- `startCmd` = start command
- `isDev` = setting this to `true` will open Chrome DevTools when the updater launches

### `egu-config.json` example

```json
{
  "clientDir": "gc-client",
  "updateList": "https://somewhere.com/eguh-update-list.json",
  "installZeroTier": true,
  "zeroTierNetId": "8850338390545e28",
  "startCmd": "start main.exe __kogstudios_original_service__",
  "isDev": false
}
```

## Step 3 - Build & Publish

If your updater is closed source, [read this](https://www.electron.build/auto-update#private-github-update-repo).

Create a `.env` file in the root directory and fill the vars with the same values from `package.json:publish`

```dosini
GH_OWNER=your-git-username
GH_REPO=your-git-repo
```

Run `SETX GH_TOKEN your-git-token` (token should have `repo` permission to the public repository)

Push your changes and run `npm run dist`

This will create a release in your `dist` repository and run `build/delete-old-releases.js`

You're done!
