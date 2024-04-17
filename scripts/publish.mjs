import { readFile, copyFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const artifactPaths = JSON.parse(process.env.artifactPaths);
console.log(artifactPaths);
const targetDir = "publish";
console.log(join(__dirname, "../", targetDir));
// const publish = async () => {
//   await mkdir(targetDir, { recursive: true });

//   for await (const artifactPath of artifactPaths) {
//     const fileName = artifactPath.split("/").pop();
//     const path = `${targetDir}/${fileName}`;
//     await copyFile(artifactPath, path);
//     console.log(`Coping ${artifactPath} ======> ${path}`);
//   }

//   const file = await readFile("latest.json", { encoding: "utf-8" });
//   const data = JSON.parse(file);
//   if (data.platforms["darwin-x86_64"]) {
//     data.platforms["darwin-aarch64"] = data.platforms["darwin-x86_64"];
//   }
//   await writeFile(`${targetDir}/latest.json`, JSON.stringify(data, null, 2));
// };

// publish();
