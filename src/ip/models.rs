use serde::{Deserialize, Serialize};
use std::net::IpAddr;

pub type InterfaceList = Vec<Interface>;

#[derive(Debug, Deserialize, Serialize)]
pub struct Interface {
    pub ifindex: u32,
    #[serde(default)]
    pub link_index: Option<u32>,
    pub ifname: String,
    pub flags: Vec<String>,
    pub mtu: u32,
    pub qdisc: String,
    pub operstate: String,
    pub group: String,
    #[serde(default)]
    pub txqlen: Option<u32>,
    pub link_type: String,
    pub address: String,
    pub broadcast: String,
    #[serde(default)]
    pub link_netnsid: Option<i32>,
    #[serde(default)]
    pub addr_info: Vec<AddressInfo>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct AddressInfo {
    pub family: String,
    pub local: IpAddr,
    pub prefixlen: u8,
    #[serde(default)]
    pub broadcast: Option<IpAddr>,
    pub scope: String,
    #[serde(default)]
    pub label: Option<String>,
    pub valid_life_time: u64,
    pub preferred_life_time: u64,
}
