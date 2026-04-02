use super::models::{ChainDef, Expression, RuleDef};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Element {
    pub data: ElementData,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ElementData {
    Chain {
        id: String,
        name: String,
    },
    Rule {
        id: String,
        name: String,
        parent: String,
        matcher: String,
        action: String,
    },
}

pub fn convert(
    restructured: HashMap<String, HashMap<String, (ChainDef, Vec<RuleDef>)>>,
) -> Vec<Element> {
    let mut elements = Vec::new();

    for (_hook, chains) in restructured {
        for (chain_name, (chain_def, rules)) in chains {
            let chain_id = format!("{}_chain", chain_def.handle);

            elements.push(Element {
                data: ElementData::Chain {
                    id: chain_id.clone(),
                    name: chain_name,
                },
            });

            for rule in rules {
                let rule_id = format!("{}_rule", rule.handle);
                let (matcher, action) = format_rule_expressions(&rule.expr);

                elements.push(Element {
                    data: ElementData::Rule {
                        id: rule_id,
                        name: "rule".to_string(),
                        parent: chain_id.clone(),
                        matcher,
                        action,
                    },
                });
            }
        }
    }

    elements
}

fn format_rule_expressions(expressions: &[Expression]) -> (String, String) {
    let mut matchers = Vec::new();
    let mut action = "Unknown".to_string();

    for expr in expressions {
        match expr {
            Expression::Match { r#match: m } => {
                let right_val = match &m.right {
                    serde_json::Value::Number(n) => n.to_string(),
                    serde_json::Value::String(s) => s.clone(),
                    _ => format!("{:?}", m.right),
                };
                matchers.push(format!("{}.{} {} {}", m.left.payload.protocol, m.left.payload.field, m.op, right_val));
            }
            Expression::Drop { .. } => action = "Drop".to_string(),
            Expression::Accept { .. } => action = "Accept".to_string(),
            _ => {}
        }
    }

    let matcher_str = if matchers.is_empty() {
        "".to_string()
    } else {
        matchers.join(" && ")
    };

    (matcher_str, action)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::nft::models::{ChainDef, MatchExpr, LeftExpr, Payload};
    use serde_json::json;

    #[test]
    fn test_convert_example() {
        let mut chains = HashMap::new();
        let chain_def = ChainDef {
            handle: 1,
            family: "arp".to_string(),
            table: "filter".to_string(),
            name: "input".to_string(),
            chain_type: Some("filter".to_string()),
            hook: Some("input".to_string()),
            prio: Some(0),
            policy: Some("accept".to_string()),
        };

        let rule_def = RuleDef {
            handle: 2,
            family: "arp".to_string(),
            table: "filter".to_string(),
            chain: "input".to_string(),
            expr: vec![
                Expression::Match {
                    r#match: MatchExpr {
                        op: "==".to_string(),
                        left: LeftExpr {
                            payload: Payload {
                                protocol: "arp".to_string(),
                                field: "plen".to_string(),
                            },
                        },
                        right: json!(1),
                    },
                },
                Expression::Drop { drop: None },
            ],
        };

        let mut inner_map = HashMap::new();
        inner_map.insert("input".to_string(), (chain_def, vec![rule_def]));
        chains.insert("input".to_string(), inner_map);

        let result = convert(chains);

        assert_eq!(result.len(), 2);

        // Assert chain
        if let ElementData::Chain { id, name } = &result[0].data {
            assert_eq!(id, "1_chain");
            assert_eq!(name, "input");
        } else {
            panic!("First element should be a chain");
        }

        // Assert rule
        if let ElementData::Rule { id, name, parent, matcher, action } = &result[1].data {
            assert_eq!(id, "2_rule");
            assert_eq!(name, "rule");
            assert_eq!(parent, "1_chain");
            assert_eq!(matcher, "arp.plen == 1");
            assert_eq!(action, "Drop");
        } else {
            panic!("Second element should be a rule");
        }
    }
}
