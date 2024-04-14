use crate::CLIENT;
use anyhow::{anyhow, Result};
use once_cell::sync::Lazy;
use serde_json::Value;

static APP_ID: Lazy<String> = Lazy::new(|| std::env::var("APP_ID").unwrap());
static APP_KEY: Lazy<String> = Lazy::new(|| std::env::var("APP_KEY").unwrap());
static URL: &str = "http://api.fanyi.baidu.com/api/trans/vip/translate";

pub async fn trans(src: &str, from: &str, to: &str) -> Result<Value> {
    let res: Value = CLIENT
        .get(URL)
        .query(&[
            ("q", src),
            ("appid", &APP_ID),
            ("from", from),
            ("to", to),
            ("salt", "10086"),
            ("sign", &sign(src)),
        ])
        .send()
        .await?
        .json()
        .await?;

    let trans_result = res["trans_result"]
        .as_array()
        .ok_or(anyhow!("{res}"))?
        .first()
        .unwrap()["dst"]
        .clone();

    Ok(trans_result)
}

fn sign(q: &str) -> String {
    let str = format!("{}{}10086{}", &*APP_ID, q, &*APP_KEY);
    let digest = md5::compute(str);
    format!("{:x}", digest)
}
