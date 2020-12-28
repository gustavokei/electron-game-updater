require("dotenv").config();

const shell = require("shelljs");

while (shell.exec("git tag -l").stdout !== "") {
  shell.echo("Previous release(s) found, removing all old releases...");
  shell.exec(
    "git push https://github.com/" +
      process.env.GH_OWNER +
      "/" +
      process.env.GH_REPO +
      " --delete " +
      shell.exec("git tag -l").stdout
  );
}
