const { Octokit } = require("@octokit/core");
const octokit = new Octokit({ auth: process.env.GH_TOKEN });

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

let delOldReleases = async () => {
  const response = await octokit.request("GET /repos/{owner}/{repo}/releases", {
    owner: process.env.GH_OWNER,
    repo: process.env.GH_REPO,
  });
  response.data.forEach((item, i) => {
    if (i === 0) {
      return;
    }
    delOldId(item.id);
    delOldTag(item.tag_name);
  });
};

delOldReleases();
