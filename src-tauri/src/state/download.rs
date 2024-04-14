use futures::lock::Mutex;
use std::collections::HashMap;
use std::ops::{Deref, DerefMut};
use std::sync::Arc;

use crate::download::Download;

pub struct DownloadState {
    inner: Arc<Mutex<HashMap<i32, Download>>>,
}

impl Deref for DownloadState {
    type Target = Arc<Mutex<HashMap<i32, Download>>>;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl DerefMut for DownloadState {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.inner
    }
}

impl DownloadState {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
