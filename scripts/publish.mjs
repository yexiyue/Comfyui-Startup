import { readFile, copyFile, writeFile, mkdir } from "node:fs/promises";

const artifactPaths = JSON.parse(process.env.artifactPaths);
const targetDir = "publish";

const publish = async () => {
  await mkdir(targetDir, { recursive: true });

  const tasks = artifactPaths.map(async (artifactPath) => {
    const fileName = artifactPath.split("/").pop();
    const path = `${targetDir}/${fileName}`;
    await copyFile(artifactPath, path);
    console.log(`Coping ${artifactPath} ======> ${fileName}`);
  });

  await Promise.allSettled(tasks);

  const file = await readFile("latest.json", { encoding: "utf-8" });
  const data = JSON.parse(file);
  if (data.platforms["darwin-x86_64"]) {
    data.platforms["darwin-aarch64"] = data.platforms["darwin-x86_64"];
  }
  await writeFile(`${targetDir}/latest.json`, JSON.stringify(data, null, 2));
};

publish();
