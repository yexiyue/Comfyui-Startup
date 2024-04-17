async function getLastGitHubRelease(owner, repo) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json", // 指定API版本
        // Authorization: `Bearer ${accessToken}`, // 如果需要授权，则填入有效的GitHub个人访问令牌
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching release info: ${response.status}`);
    }
    const releaseData = await response.json();
    return releaseData;
  } catch (error) {
    console.error("Error fetching the latest release:", error);
    return null;
  }
}

let urls = [
  "https://github.com/yexiyue/Comfyui-Startup/releases/download/v0.2.0-beta/comfyui-startup_0.2.0_x64.dmg",
  "https://mirror.ghproxy.com/https://github.com/yexiyue/Comfyui-Startup/releases/download/v0.2.0-beta/comfyui-startup_0.2.0_x64.dmg",
  "https://github.com/yexiyue/Comfyui-Startup/releases/download/v0.2.0-beta/comfyui-startup_0.2.0_x64-setup.exe",
  "https://mirror.ghproxy.com/https://github.com/yexiyue/Comfyui-Startup/releases/download/v0.2.0-beta/comfyui-startup_0.2.0_x64-setup.exe",
];

const getReleaseInfo = async () => {
  const res = await getLastGitHubRelease("yexiyue", "ComfyUI-Startup");
  const originExe = res.assets.filter((item) => item.name.endsWith(".exe"))[0]
    .browser_download_url;
  const originDmg = res.assets.filter((item) => item.name.endsWith(".dmg"))[0]
    .browser_download_url;
  urls = [
    originDmg,
    `https://mirror.ghproxy.com/${originDmg}`,
    originExe,
    `https://mirror.ghproxy.com/${originExe}`,
  ];
};

getReleaseInfo();

const onClick = (id) => {
  console.log(urls);
  const url = urls[id];
  const a = document.createElement("a");
  filename = url.split("/").pop();
  a.href = url;
  a.download = filename;
  a.click();
};
