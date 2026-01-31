use serde::{Deserialize, Serialize};
use std::net::IpAddr;

pub type RouteList = Vec<Route>;

#[derive(Debug, Deserialize, Serialize)]
pub struct Route {
    #[serde(default)]
    #[serde(rename = "type")]
    pub route_type: Option<String>,
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
    #[serde(default)]
    pub table: Option<String>,
    #[serde(default)]
    pub metric: Option<u32>,
    #[serde(default)]
    pub pref: Option<String>,
    pub flags: Vec<String>,
}
