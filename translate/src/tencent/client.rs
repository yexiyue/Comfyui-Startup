use super::encryption;
use once_cell::sync::Lazy;
use reqwest::{header::HeaderMap, Client};
use serde::{de::DeserializeOwned, Deserialize};

static SECRET_ID: Lazy<String> = Lazy::new(|| std::env::var("TENCENT_SECRET_ID").unwrap());
static SECRET_KEY: Lazy<String> = Lazy::new(|| std::env::var("TENCENT_SECRET_KEY").unwrap());

#[derive(derive_builder::Builder)]
#[builder(setter(into))]
pub struct ReqClient {
    #[builder(default = r#""tmt.tencentcloudapi.com".to_string()"#)]
    host: String,
    #[builder(default = r#""tmt".to_string()"#)]
    service: String,
    #[builder(default = r#""ap-guangzhou".to_string()"#)]
    region: String,
    #[builder(default = r#""2018-03-21".to_string()"#)]
    version: String,
    #[builder(default)]
    client: Client,
}

/// 通用基础响应
#[derive(Deserialize, Debug)]
#[serde(rename_all = "PascalCase")]
pub struct TcResponse<T> {
    pub response: T,
}

impl ReqClient {
    pub fn builder() -> ReqClientBuilder {
        ReqClientBuilder::default()
    }

    pub async fn send<T, R>(&self, action: &str, payload: T) -> anyhow::Result<TcResponse<R>>
    where
        T: serde::ser::Serialize,
        R: DeserializeOwned,
    {
        let now = chrono::Utc::now();

        let payload = serde_json::to_string(&payload)?;
        let timestamp = now.timestamp();
        let date = now.format("%Y-%m-%d").to_string();

        // 计算临时认证
        let authorization = self.make_post_authorization(timestamp, date, &payload)?;

        // 配置请求头
        let mut headers = HeaderMap::new();
        headers.insert("Authorization", authorization.parse()?);
        headers.insert("Content-Type", "application/json; charset=utf-8".parse()?);
        headers.insert("Host", self.host.parse()?);
        headers.insert("X-TC-Action", action.parse()?);
        headers.insert("X-TC-Timestamp", timestamp.to_string().parse()?);
        headers.insert("X-TC-Version", self.version.parse()?);
        headers.insert("X-TC-Region", self.region.parse()?);

        let url = format!("https://{}", self.host);
        let res = self
            .client
            .post(&url)
            .headers(headers)
            .body(payload)
            .send()
            .await?;
        let json_resp = res.json::<TcResponse<R>>().await?;
        Ok(json_resp)
    }

    fn make_post_authorization(
        &self,
        timestamp: i64,
        date: String,
        payload: &str,
    ) -> anyhow::Result<String> {
        /* first */
        let httprequest_method = "POST";
        let canonical_uri = "/";
        let canonical_query_string = "";
        let canonical_headers = format!(
            "content-type:application/json; charset=utf-8\nhost:{}\n",
            self.host
        );
        let signed_headers = "content-type;host";
        // let hashed_request_payload = encryption::sha256_hex(payload);
        let hashed_request_payload = sha256::digest(payload);

        let canonical_request = format!(
            "{}\n{}\n{}\n{}\n{}\n{}",
            httprequest_method,
            canonical_uri,
            canonical_query_string,
            canonical_headers,
            signed_headers,
            hashed_request_payload
        );
        // println!("{}",canonical_request);

        /* second */

        let algorithm = "TC3-HMAC-SHA256";

        let credential_scope = format!("{}/{}/tc3_request", date, self.service);
        let hashed_canonical_request = sha256::digest(canonical_request);

        let string_to_sign = format!(
            "{}\n{}\n{}\n{}",
            algorithm, timestamp, credential_scope, hashed_canonical_request
        );
        // println!("{}", string_to_sign);
        /* third */

        let secret_date = encryption::hmac_sha256(
            date.as_bytes(),
            format!("TC3{}", &*SECRET_KEY).as_str().as_bytes(),
        );
        let secret_service = encryption::hmac_sha256(self.service.as_bytes(), &secret_date);
        let secret_signing = encryption::hmac_sha256("tc3_request".as_bytes(), &secret_service);

        let signature = encryption::hmac_sha256_hex(string_to_sign.as_bytes(), &secret_signing);

        /* forth */
        let authorization = format!(
            "TC3-HMAC-SHA256 Credential={}/{},SignedHeaders={},Signature={}",
            &*SECRET_ID, credential_scope, signed_headers, signature
        );
        Ok(authorization)
    }
}
