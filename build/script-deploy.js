require("dotenv").config();
const { Octokit } = require("@octokit/core");

// const shell = require("shelljs");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });

// const response = await octokit.request('DELETE /repos/{owner}/{repo}/releases/{id}', {
//   owner: process.env.GH_OWNER,
//   repo: process.env.GH_REPO
// })

let delOldId = async (id) => {
  const response = await octokit.request(
    "DELETE /repos/{owner}/{repo}/releases/{id}",
    {
      owner: process.env.GH_OWNER,
      repo: process.env.GH_REPO,
      id: id,
    }
  );
};

let delOldTag = async (tag) => {
  const response = await octokit.request(
    "DELETE /repos/{owner}/{repo}/git/refs/tags/{tag}",
    {
      owner: process.env.GH_OWNER,
      repo: process.env.GH_REPO,
      tag: tag,
    }
  );
};

let myAsyncMethod = async () => {
  const response = await octokit.request("GET /repos/{owner}/{repo}/releases", {
    owner: process.env.GH_OWNER,
    repo: process.env.GH_REPO,
  });
  response.data.forEach((item, i) => {
    if (i === 0) {
      return;
    }
    // console.log(item);
    delOldId(item.id);
    // delOldTag(item.nem);
  });
};

myAsyncMethod();

// while (shell.exec("git tag -l").stdout.length > 1) {
//   shell.echo("Previous release(s) found, removing all old releases...");
//   shell.exec(
//     "git push https://github.com/" +
//       process.env.GH_OWNER +
//       "/" +
//       process.env.GH_REPO +
//       " --delete " +
//       shell.exec("git tag -l").stdout
//   );
// }
