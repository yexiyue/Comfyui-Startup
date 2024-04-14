use anyhow::anyhow;
use serde_json::{json, Value};

use self::client::ReqClient;
mod client;
mod encryption;

pub async fn trans(src: &str, from: &str, to: &str) -> anyhow::Result<Value> {
    let client = ReqClient::builder().build()?;
    let request_body = json!({
        "SourceText": src,
        "Source": from,
        "Target": to,
        "ProjectId": 0,
    });
    let res = client
        .send::<Value, Value>("TextTranslate", request_body)
        .await?;
    let value = res.response.get("TargetText").ok_or(anyhow!("{res:#?}"))?;
    Ok(value.clone())
}
