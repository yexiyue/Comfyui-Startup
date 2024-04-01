use std::path::Path;

use crate::error::MyError;
use anyhow::Context;
use derive_builder::Builder;
use git2::{build::RepoBuilder, FetchOptions, Progress, RemoteCallbacks, Repository};

pub const GITHUB_PROXY: &str = "https://mirror.ghproxy.com/";

#[derive(Debug, Builder, Clone)]
#[builder(setter(into))]
pub struct Git {
    url: String,
    path: String,
    #[builder(default = "true")]
    proxy: bool,
}

impl Git {
    pub fn git_clone<F>(&self, cb: F) -> Result<(), MyError>
    where
        F: Fn(Progress) -> bool,
    {
        let mut rc = RemoteCallbacks::new();
        rc.transfer_progress(cb);

        let mut fo = FetchOptions::new();
        fo.remote_callbacks(rc);
        let url = if self.proxy {
            format!("{GITHUB_PROXY}/{}", self.url)
        } else {
            self.url.clone()
        };
        RepoBuilder::new()
            .fetch_options(fo)
            .clone(&url, Path::new(&self.path))?;
        Ok(())
    }

    pub fn git_pull<F>(&self, cb: F) -> Result<usize, MyError>
    where
        F: Fn(Progress) -> bool,
    {
        let repo = Repository::open(&self.path)?;
        let remote_name = "origin"; // 远程仓库的名称，默认通常是"origin"

        // 获取远程仓库信息
        let mut remote = repo.find_remote(remote_name)?;
        remote.connect(git2::Direction::Fetch)?;

        // 获取远程仓库的默认分支名称
        let default_branch = remote.default_branch()?;
        let default_branch_name = default_branch.as_str().context("获取默认分支名称失败")?;
        // 设置回调函数，用于处理获取过程中的进度信息
        let mut fetch_opts = FetchOptions::new();
        let mut rc = RemoteCallbacks::new();
        rc.transfer_progress(cb);
        fetch_opts.remote_callbacks(rc);
        // 执行获取操作
        remote.fetch(&[default_branch_name], Some(&mut fetch_opts), None)?;
        let fetch_head = repo.find_reference("FETCH_HEAD")?;
        let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;
        let analysis = repo.merge_analysis(&[&fetch_commit])?;
        if analysis.0.is_up_to_date() {
            return Ok(1);
        } else if analysis.0.is_fast_forward() {
            // 执行合并操作
            let mut refrence = repo.find_reference(default_branch_name)?;
            refrence.set_target(fetch_commit.id(), "Fast forward")?;
            repo.set_head(default_branch_name)?;
            return Ok(repo
                .checkout_head(Some(git2::build::CheckoutBuilder::default().force()))
                .map(|_| 2usize)?);
        } else {
            return Ok(0);
        }
    }

    pub fn builder() -> GitBuilder {
        GitBuilder::default()
    }
}
