use serde::{Deserialize, Serialize};
use std::net::IpAddr;

pub type RouteList = Vec<Route>;

#[derive(Debug, Deserialize, Serialize)]
pub struct Route {
    pub dst: String,
    #[serde(default)]
    pub gateway: Option<IpAddr>,
    pub dev: String,
    #[serde(default)]
    pub protocol: Option<String>,
    #[serde(default)]
    pub scope: Option<String>,
    #[serde(default)]
    pub prefsrc: Option<IpAddr>,
    pub flags: Vec<String>,
}
