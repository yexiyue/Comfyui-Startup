import { context, getOctokit } from "@actions/github";
import { readFile } from "node:fs/promises";

const octokit = getOctokit(process.env.GITHUB_TOKEN);

const updateRelease = async () => {
  try {
    const { data: release } = await octokit.rest.repos.getReleaseByTag({
      owner: context.repo.owner,
      repo: context.repo.repo,
      tag: "updater",
    });

    const file = await readFile("latest.json", { encoding: "utf-8" });
    await octokit.rest.repos.uploadReleaseAsset({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: release.id,
      name: "latest.json",
      data: file,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

updateRelease();
