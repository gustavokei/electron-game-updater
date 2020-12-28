require("dotenv").config();
var shell = require("shelljs");
setTimeout(
  shell.exec(
    "git tag -l | xargs git tag -d && git fetch --tags https://github.com/" +
      process.env.GH_OWNER +
      "/" +
      process.env.GH_REPO +
      ".git"
  ),
  1500
);
