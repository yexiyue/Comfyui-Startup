use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::convert::TryInto;

pub fn hmac_sha256_hex(message: &[u8], key: &[u8]) -> String {
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(message);
    let result = mac.finalize();
    let code_bytes = result.into_bytes();
    let code_slice = code_bytes.as_slice();
    hex::encode(code_slice)
}

pub fn hmac_sha256(message: &[u8], key: &[u8]) -> [u8; 32] {
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(key).expect("HMAC can take key of any size");
    mac.update(message);
    let result = mac.finalize();

    let code_bytes = result.into_bytes();
    let code_slice = code_bytes.as_slice();
    code_slice.try_into().expect("slice with incorrect length")
}
