use std::net::Ipv4Addr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Hook {
    Filter,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Family {
    Inet,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Chain {
    pub table: Table,
    pub hook: Hook,
    pub priority: i32,
    pub rules: Vec<Rule>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Table {
    pub name: String,
    pub family: Family,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Rule {
    pub match_clue: Match,
    pub verdict: Verdict,
}


#[derive(Debug, Clone, PartialEq)]
pub struct Match {
    pub selector: Selector,
    pub operator: Operator,
    pub values: Ipv4Addr,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Verdict {
    Reject
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operator {
    Eq,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Selector {
    Ip,
}
