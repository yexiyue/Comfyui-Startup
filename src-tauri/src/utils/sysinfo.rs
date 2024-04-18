use std::env;

use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, RefreshKind};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SysInfo {
    pub cpu: String,
    pub os: String,
    pub arch: String,
    pub os_version: String,
}

pub fn get_sysinfo() -> SysInfo {
    let os = env::consts::OS;
    let sys = sysinfo::System::new_with_specifics(
        RefreshKind::new().with_cpu(CpuRefreshKind::everything()),
    );
    let cpu = sys.cpus().first().unwrap();
    let os_version = sysinfo::System::long_os_version();
    let arch = sysinfo::System::cpu_arch().unwrap();
    
    SysInfo {
        os_version: os_version.unwrap().to_string(),
        os: os.to_string(),
        arch: arch.to_string(),
        cpu: cpu.brand().to_string(),
    }
}
