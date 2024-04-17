import { readFile, copyFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const artifactPaths = JSON.parse(process.env.artifactPaths);
const targetDir = "publish";

const publish = async () => {
  const targetDirPath = new URL(`../${targetDir}`, import.meta.url);
  await mkdir(targetDirPath, { recursive: true });

  // 拷贝文件
  const tasks = artifactPaths.map(async (artifactPath) => {
    const fileName = artifactPath.split("/").pop();
    const path = join(targetDirPath, fileName);
    await copyFile(artifactPath, path);
    console.log(`Coping ${artifactPath} ======> ${fileName}`);
  });

  await Promise.allSettled(tasks);

  const file = await readFile("latest.json", { encoding: "utf-8" });
  const data = JSON.parse(file);
  if (data.platforms["darwin-x86_64"]) {
    data.platforms["darwin-aarch64"] = data.platforms["darwin-x86_64"];
  }

  await writeFile(
    join(targetDirPath, "latest.json"),
    JSON.stringify(data, null, 2)
  );
};

publish();
