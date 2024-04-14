use std::{
    fs::File,
    ops::{Deref, DerefMut},
    sync::Arc,
    time::Duration,
};

use anyhow::{anyhow, Result};
use futures::future::join_all;
use reqwest::{
    header::{HeaderMap, USER_AGENT},
    Client,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::{sync::Semaphore, time::sleep};
use tracing::{error, info};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranslateTask {
    pub from: String,
    pub to: String,
    pub path: String,
    pub target_field: String,
    pub field: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Watcher {
    watchers: Vec<Status>,
}

impl Watcher {
    pub fn new() -> Self {
        let path = std::env::current_dir().unwrap().join("watcher.json");
        if path.exists() {
            let file = std::fs::File::open(path).unwrap();
            return serde_json::from_reader(file).unwrap();
        } else {
            Self {
                watchers: Vec::new(),
            }
        }
    }
}

impl Deref for Watcher {
    type Target = Vec<Status>;
    fn deref(&self) -> &Self::Target {
        &self.watchers
    }
}

impl DerefMut for Watcher {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.watchers
    }
}

impl Drop for Watcher {
    fn drop(&mut self) {
        let path = std::env::current_dir().unwrap().join("watcher.json");
        let mut file = File::create(path).unwrap();
        serde_json::to_writer_pretty(&mut file, self).unwrap();
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    pub filename: String,
    pub owner: String,
    pub repo: String,
    pub branch: String,
    pub last_update: String,
    pub translate_task: Option<TranslateTask>,
    pub also_translate: Option<bool>,
}

impl Status {
    pub async fn check_update(&mut self) -> Result<bool> {
        let mut headers = HeaderMap::new();
        headers.insert(USER_AGENT, "Edge".parse()?);
        let client = Client::builder().default_headers(headers).build()?;

        let url = format!(
            "https://api.github.com/repos/{}/{}/commits",
            self.owner, self.repo
        );
        let resp: Value = client.get(url).send().await?.json().await?;
        let semaphore = Arc::new(Semaphore::new(2));
        // warn!("response: {:#?}", resp);
        let commits = resp.as_array().ok_or(anyhow!("no commit"))?;
        let last_time = chrono::DateTime::parse_from_rfc3339(&self.last_update)?;
        let new_commits = commits
            .into_iter()
            .filter(|item| {
                let new_commit_date = item["commit"]["author"]["date"].as_str().unwrap();
                let new_commit_time =
                    chrono::DateTime::parse_from_rfc3339(new_commit_date).unwrap();
                new_commit_time > last_time
            })
            .collect::<Vec<_>>();
        let tasks = new_commits.iter().map(|commit| {
            let client = client.clone();
            let filename = self.filename.clone();
            let semaphore = semaphore.clone();
            async move {
                let access = semaphore.acquire().await?;
                let url = commit["url"].as_str().ok_or(anyhow!("no url"))?;
                let commit_content: Value = client.get(url).send().await?.json().await?;
                let mut is_update = false;

                match commit_content["files"]
                    .as_array()
                    .ok_or(anyhow!("not found files"))
                {
                    Ok(files) => {
                        is_update = files.iter().any(|item| {
                            info!("files: {:?}", item["filename"]);
                            item["filename"].as_str().unwrap() == filename
                        });
                        sleep(Duration::from_secs(2)).await;
                    }
                    Err(_) => {
                        error!("{:#?}", commit_content);
                    }
                }
                drop(access);
                Ok::<bool, anyhow::Error>(is_update)
            }
        });

        let res = join_all(tasks).await;
        let res = res.into_iter().any(|i| {
            if i.is_ok() {
                let is_update = i.unwrap();
                info!("{} is update:{}", self.filename, is_update);
                is_update
            } else {
                error!("{}", i.err().unwrap());
                false
            }
        });

        self.last_update = chrono::Utc::now().to_rfc3339();

        Ok(res)
    }

}
