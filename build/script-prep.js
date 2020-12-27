require('dotenv').config();
var shell = require('shelljs');
shell.exec(
  'git tag -l | xargs git tag -d && git fetch --tags https://github.com/' +
    process.env.GH_OWNER +
    '/' +
    process.env.GH_REPO +
    '.git'
);
