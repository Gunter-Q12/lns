use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub ifindex: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub link_index: Option<u32>,
    pub ifname: String,
    pub flags: Vec<String>,
    pub mtu: u32,
    pub qdisc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub master: Option<String>,
    pub operstate: String,
    pub group: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub txqlen: Option<u32>,
    pub link_type: String,
    pub address: String,
    pub broadcast: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub link_netnsid: Option<i32>,
    pub addr_info: Vec<AddressInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddressInfo {
    pub family: String,
    pub local: String,
    pub prefixlen: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub broadcast: Option<String>,
    pub scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dynamic: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub noprefixroute: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temporary: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mngtmpaddr: Option<bool>,
    #[serde(rename = "stable-privacy", skip_serializing_if = "Option::is_none")]
    pub stable_privacy: Option<bool>,
    pub valid_life_time: u64,
    pub preferred_life_time: u64,
}

pub type NetworkInterfaces = Vec<NetworkInterface>;
