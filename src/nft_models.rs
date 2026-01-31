use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Deserialize, Serialize)]
pub struct NftablesRoot {
    pub nftables: Vec<NftablesItem>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(untagged)]
pub enum NftablesItem {
    Chain(ChainDef),
    Rule(RuleDef),
    Unknown(Value),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ChainDef {
    pub family: String,
    pub table: String,
    pub name: String,
    #[serde(rename = "type")]
    pub chain_type: Option<String>,
    pub hook: Option<String>,
    pub prio: Option<i32>,
    pub policy: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct RuleDef {
    pub family: String,
    pub table: String,
    pub chain: String,
    pub expr: Vec<Expression>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Expression {
    Match(MatchExpr),
    Accept(Option<Value>),
    Drop(Option<Value>),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct MatchExpr {
    pub op: String,
    pub left: Payload,
    pub right: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Payload {
    pub protocol: String,
    pub field: String,
}
