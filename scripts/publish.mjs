import { getOctokit } from "@actions/github";
import { readFile, copyFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const octokit = getOctokit(process.env.GITHUB_TOKEN);
const artifactPaths = JSON.parse(process.env.artifactPaths);
const targetDir = "publish";

const publish = async () => {
  const targetDirPath = new URL(`../${targetDir}`, import.meta.url);
  await mkdir(targetDirPath, { recursive: true });

  const tasks = artifactPaths.map(async (artifactPath) => {
    const fileName = artifactPath.split("/").pop();
    const path = join(targetDirPath, fileName);
    await copyFile(artifactPath, path);
    console.log(`Coping ${artifactPath} ======> ${fileName}`);
  });
  Promise.allSettled(tasks);

  const file = await readFile("latest.json", { encoding: "utf-8" });
  const data = JSON.parse(file);
  if (data.platforms["darwin-x86_64"]) {
    data.platforms["darwin-aarch64"] = data.platforms["darwin-x86_64"];
  }
  await writeFile("publish/latest.json", JSON.stringify(data, null, 2));
};

publish();
