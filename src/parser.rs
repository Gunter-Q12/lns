use crate::models::*;
use anyhow;
use serde_json::Value;
use std::collections::HashMap;
use std::net::Ipv4Addr;

pub fn parse(input: &str) -> anyhow::Result<Vec<Chain>> {
    let json: Value = serde_json::from_str(input)?;

    let nftables = json["nftables"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("Missing nftables array"))?;

    // Collect chains and rules by table+chain name
    let mut chains_map: HashMap<(&str, &str), Chain> = HashMap::new();
    // let mut tables: HashMap<String, Table> = HashMap::new();

    for item in nftables {
        if let Some(chain_obj) = item.get("chain") {
            if let Ok(chain) = build_chain(chain_obj) {
                chains_map.insert(
                    (&chain.table.name, &chain.name),
                    chain,
                );
            }

        }

        if let Some(rule_obj) = item.get("rule") {
            let table_name = rule_obj["table"].as_str().unwrap().to_string();
            let chain_name: String = rule_obj["chain"].as_str().unwrap().to_string();
            let key = (table_name, chain_name);

            if let Some(expr) = rule_obj["expr"].as_array() {
                let mut match_clue: Option<Match> = None;
                let mut verdict: Option<Verdict> = None;

                for e in expr {
                    if let Some(match_obj) = e.get("match") {
                        let op_str = match_obj["op"].as_str().unwrap();
                        let operator = match op_str {
                            "==" => Operator::Eq,
                            _ => continue,
                        };

                        if let Some(left) = match_obj.get("left") {
                            if let Some(payload) = left.get("payload") {
                                let protocol = payload["protocol"].as_str().unwrap();
                                let field = payload["field"].as_str().unwrap();

                                let selector = if protocol == "ip" && field == "saddr" {
                                    Selector::Ip
                                } else {
                                    continue;
                                };

                                let right_str = match_obj["right"].as_str().unwrap();
                                let values: Ipv4Addr = right_str.parse()?;

                                match_clue = Some(Match {
                                    selector,
                                    operator,
                                    values,
                                });
                            }
                        }
                    }

                    if e.get("drop").is_some() {
                        verdict = Some(Verdict::Reject);
                    }
                }

                if let (Some(m), Some(v)) = (match_clue, verdict) {
                    if let Some(chain_builder) = chains_map.get_mut(&key) {
                        chain_builder.rules.push(Rule {
                            match_clue: m,
                            verdict: v,
                        });
                    }
                }
            }
        }
    }

    // Build final chains
    let mut result = Vec::new();
    // for ((table_name, _), builder) in chains_map {
    //     if let Some(table) = tables.get(&table_name).cloned() {
    //         result.push(Chain {
    //             table,
    //             hook: builder.hook,
    //             priority: builder.priority,
    //             rules: builder.rules,
    //         });
    //     }
    // }

    Ok(result)
}

fn build_chain(obj: &Value) -> anyhow::Result<Chain> {
    let table_name = obj["table"].as_str().unwrap().to_string();
    let family_str = obj["family"].as_str().unwrap();
    let family = match family_str {
        "inet" => Family::Inet,
        _ => anyhow::bail!("Unsupported family name {}", family_str),
    };
    let chain_name = obj["name"].as_str().unwrap().to_string();
    let hook_str = obj["hook"].as_str().unwrap();
    let hook = match hook_str {
        "input" => Hook::Input,
        _ => anyhow::bail!("Unsupported hook name {}", hook_str),
    };
    let priority = obj["prio"].as_i64().unwrap() as i32;

    Ok(Chain {
        name: chain_name,
        table: Table {
            name: table_name,
            family: family,
        },
        hook,
        priority,
        rules: Vec::new(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::net::Ipv4Addr;

    #[test]
    fn test_parse_empty() {
        let input =
            fs::read_to_string("src/testdata/empty.json").expect("Failed to read empty.json");

        let result = parse(&input).expect("Failed to parse empty.json");

        assert_eq!(result.len(), 0, "Expected no chains for empty nftables");
    }

    #[test]
    fn test_parse_filter_drop() {
        let input = fs::read_to_string("src/testdata/filter_drop.json")
            .expect("Failed to read filter_drop.json");

        let result = parse(&input).expect("Failed to parse filter_drop.json");

        let expected = vec![Chain {
            name: String::from("input"),
            table: Table {
                name: "filter".to_string(),
                family: Family::Inet,
            },
            hook: Hook::Input,
            priority: 0,
            rules: vec![Rule {
                match_clue: Match {
                    selector: Selector::Ip,
                    operator: Operator::Eq,
                    values: Ipv4Addr::new(1, 1, 1, 1),
                },
                verdict: Verdict::Reject,
            }],
        }];

        assert_eq!(result, expected);
    }
}
