use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
pub struct NftablesRoot {
    pub nftables: Vec<NftablesItem>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NftablesItem {
    Metainfo(Metainfo),
    Table(TableDef),
    Chain(ChainDef),
    Rule(RuleDef),
    Set(SetDef),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Metainfo {
    pub version: String,
    pub release_name: String,
    pub json_schema_version: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct TableDef {
    pub family: String,
    pub name: String,
    pub handle: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChainDef {
    pub family: String,
    pub table: String,
    pub name: String,
    pub handle: u32,
    #[serde(rename = "type")]
    pub chain_type: Option<String>,
    pub hook: Option<String>,
    pub prio: Option<i32>,
    pub policy: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SetDef {
    pub family: String,
    pub name: String,
    pub table: String,
    #[serde(rename = "type")]
    pub set_type: String,
    pub handle: u32,
    #[serde(default)]
    pub flags: Vec<String>,
    #[serde(default)]
    pub elem: Vec<Value>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RuleDef {
    pub family: String,
    pub table: String,
    pub chain: String,
    pub handle: u32,
    pub expr: Vec<Expression>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Expression {
    Match(MatchExpr),
    Accept(Option<Value>),
    Drop(Option<Value>),
    Reject(Option<Value>),
    Log(LogExpr),
    Counter(CounterExpr),
    Limit(LimitExpr),
    Redirect(RedirectExpr),
    Masquerade(Option<Value>),
    #[serde(other)]
    Unknown,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MatchExpr {
    pub op: String,
    pub left: MatchValue,
    pub right: Value,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum MatchValue {
    Payload { payload: PayloadRef },
    Meta { meta: MetaRef },
    Ct { ct: CtRef },
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PayloadRef {
    pub protocol: String,
    pub field: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MetaRef {
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CtRef {
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LogExpr {
    pub prefix: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CounterExpr {
    pub packets: u64,
    pub bytes: u64,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LimitExpr {
    pub rate: u32,
    pub burst: u32,
    pub per: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RedirectExpr {
    pub port: u16,
}
