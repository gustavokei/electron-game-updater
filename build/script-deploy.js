require("dotenv").config();

const githubRemoveAllReleases = require("github-remove-all-releases");

// you need to set a token
// run on ps: [Environment]::SetEnvironmentVariable("GH_TOKEN", "<YOUR_TOKEN>", "Machine")
const AUTH = {
  type: "oauth",
  token: process.env.GH_TOKEN,
};

// this is where the magic happens, we filter on tag.draft, if it's true, it will get deleted
a_filter = (tag) => {
  return Boolean(tag.draft);
};

a_callback = (result) => {
  console.log(result);
};

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
  setTimeout(
    githubRemoveAllReleases,
    1500,
    AUTH,
    process.env.GH_OWNER,
    process.env.GH_REPO,
    a_callback,
    a_filter
  );
}
