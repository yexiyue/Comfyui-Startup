use crate::error::MyError;
use derive_builder::Builder;

pub const PROXY: &str = "https://mirror.ghproxy.com/";
#[derive(Debug, Builder, Clone)]
#[builder(setter(into))]
pub struct Git {
    url: String,
    path: String,
    #[builder(default = "true")]
    is_parent: bool,
    #[builder(default = "true")]
    proxy: bool,
}

impl Git {
    pub fn git_clone(&self) -> Result<String, MyError> {
        let mut url = self.url.clone();
        if self.proxy {
            url = format!("{}/{}", PROXY, self.url);
        }

        if self.is_parent {
            Ok(format!("cd {};git clone {}", self.path, url))
        } else {
            Ok(format!("git clone {} {}", url, self.path))
        }
    }

    pub fn builder() -> GitBuilder {
        GitBuilder::default()
    }
}
