mod install_brew;

use crate::{
    error::MyError,
    state::ConfigState,
    utils::{Exec, Git},
};
pub use install_brew::install_brew;

use tauri::State;

#[tauri::command]
pub async fn install_comfyui(state: State<'_, ConfigState>) -> Result<(), MyError> {
    let mut cmd = Exec::new();
    let (brew, path) = install_brew(state.is_chinese())?;
    cmd.add(brew);
    cmd.add(format!("source {path}"));
    cmd.add("brew install cmake protobuf rust python git wget");
    cmd.add(
        Git::builder()
            .path(&state.comfyui_path)
            .is_parent(false)
            .proxy(state.is_chinese())
            .url("https://github.com/comfyanonymous/ComfyUI.git")
            .build()?
            .git_clone()?,
    );
    std::fs::create_dir_all(&state.comfyui_path)?;
    cmd.add(format!("cd {}", state.comfyui_path));

    cmd.add("python3 -m venv venv");
    cmd.add("source venv/bin/activate");
    cmd.add("pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple/");
    cmd.add("pip config set install.trusted-host pypi.tuna.tsinghua.edu.cn");
    cmd.add("pip install torch torchvision torchaudio");
    cmd.add("pip install -r requirements.txt");
    cmd.add("python main.py --force-fp16");
    cmd.exec()?;
    Ok(())
}
