mod install_brew;

use crate::{
    error::MyError,
    state::MyConfig,
    utils::{Exec, Git},
};
pub use install_brew::install_brew;

use tauri::State;

#[tauri::command]
pub async fn install_comfyui(state: State<'_, MyConfig>) -> Result<(), MyError> {
    let mut cmd = Exec::new();
    let state = state.lock().await;
    let (brew, _path) = install_brew(state.is_chinese())?;
    cmd.add(brew);

    let brew_path = if std::env::consts::ARCH.to_lowercase().contains("x86") {
        "/usr/local/Homebrew/bin/brew"
    } else {
        "/opt/homebrew/bin/brew"
    };

    cmd.add(format!(
        "{brew_path} install cmake protobuf python git wget"
    ));
    cmd.add(
        Git::builder()
            .path(&state.comfyui_path)
            .proxy(state.is_chinese())
            .url("https://github.com/comfyanonymous/ComfyUI.git")
            .build()?
            .git_clone()?,
    );
    cmd.add(format!("cd {}/ComfyUI", state.comfyui_path));

    cmd.add("python3 -m venv venv");
    cmd.add("source venv/bin/activate");
    cmd.add("pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/");
    cmd.add("pip config set install.trusted-host pypi.tuna.tsinghua.edu.cn");
    cmd.add("pip install torch torchvision torchaudio");
    cmd.add("pip install -r requirements.txt");
    cmd.add(format!("open {}", get_app_path()));
    cmd.exec()?;
    Ok(())
}

fn get_app_path() -> String {
    let exe = std::env::current_exe().unwrap();
    let path = exe.display().to_string();
    let path = path.split(".app").collect::<Vec<_>>();
    let app_bundle_path = format!("{}.app", path.first().unwrap());
    app_bundle_path
}
