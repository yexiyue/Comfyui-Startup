import { context, getOctokit } from "@actions/github";
import { readFile, copyFile } from "node:fs/promises";

const octokit = getOctokit(process.env.GITHUB_TOKEN);
const artifactPaths = process.env.artifactPaths;
const publish = async () => {
  console.log(artifactPaths);
  // 上传新的文件
  // const file = await readFile("latest.json", { encoding: "utf-8" });
  // const data = JSON.parse(file);
  // if (data.platforms["darwin-x86_64"]) {
  //   data.platforms["darwin-aarch64"] = data.platforms["darwin-x86_64"];
  // }
};

publish();
