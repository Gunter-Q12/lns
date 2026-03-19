use super::models::{ChainDef, Expression, NftablesItem, NftablesRoot, RuleDef};
use anyhow::Result;
use std::collections::HashMap;

/// Parse nftables JSON output into structured data
///
/// # Arguments
/// * `json_str` - A string containing nftables JSON output
///
/// # Returns
/// * `Result<NftablesRoot>` - Parsed nftables structure or error
pub fn parse(json_str: &str) -> Result<NftablesRoot> {
    Ok(serde_json::from_str(json_str)?)
}

/// Restructure the parsed nftables data into a mapping from hook names to mappings from chain names to pairs of chain definitions and their rules
///
/// # Arguments
/// * `root` - The parsed NftablesRoot structure
///
/// # Returns
/// * `HashMap<String, HashMap<String, (ChainDef, Vec<RuleDef>)>>` - Restructured data
pub fn restructure(root: NftablesRoot) -> HashMap<String, HashMap<String, (ChainDef, Vec<RuleDef>)>> {
    let mut chains: HashMap<(String, String, String), ChainDef> = HashMap::new();
    let mut rules: HashMap<(String, String, String), Vec<RuleDef>> = HashMap::new();

    for item in root.nftables {
        match item {
            NftablesItem::Chain { chain } => {
                chains.insert(
                    (
                        chain.family.clone(),
                        chain.table.clone(),
                        chain.name.clone(),
                    ),
                    chain,
                );
            }
            NftablesItem::Rule { rule } => {
                rules
                    .entry((rule.family.clone(), rule.table.clone(), rule.chain.clone()))
                    .or_insert(Vec::new())
                    .push(rule);
            }
            _ => {}
        }
    }

    let mut result: HashMap<String, HashMap<String, (ChainDef, Vec<RuleDef>)>> = HashMap::new();

    for ((fam, tab, name), chain) in chains {
        if let Some(hook) = chain.hook.clone() {
            let rule_vec = rules.remove(&(fam.clone(), tab.clone(), name.clone())).unwrap_or(Vec::new());
            result
                .entry(hook)
                .or_insert(HashMap::new())
                .insert(name, (chain, rule_vec));
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_restructured(filename: &str) -> HashMap<String, HashMap<String, (ChainDef, Vec<RuleDef>)>> {
        let json_content = fs::read_to_string(filename)
            .expect("Failed to read filter_drop.json");
        let result = parse(&json_content);
        assert!(result.is_ok(), "Failed to parse filter_drop.json: {:?}", result.err());
        let nftables = result.unwrap();
        assert!(nftables.nftables.len() > 0, "Expected non-empty nftables array");
        let restructured = restructure(nftables);
        assert!(restructured.contains_key("input"), "Expected 'input' hook in restructured data");
        restructured
    }

    #[test]
    fn test_parse_empty_nftables() {
        let json_content =
            fs::read_to_string("src/nft/testdata/empty.json").expect("Failed to read empty.json");

        let result = parse(&json_content);
        assert!(
            result.is_ok(),
            "Failed to parse empty.json: {:?}",
            result.err()
        );

        let nftables = result.unwrap();
        // Empty ruleset still contains metainfo item
        assert_eq!(
            nftables.nftables.len(),
            1,
            "Expected only metainfo in empty nftables"
        );

        let restructured = restructure(nftables);
        assert!(
            restructured.is_empty(),
            "Expected empty restructured data for empty nftables"
        );
    }

    #[test]
    fn test_parse_filter_drop() {
        let restructured = setup_restructured("src/nft/testdata/filter_drop.json");

        let input_chains = &restructured["input"];
        assert!(!input_chains.is_empty(), "Expected at least one chain for 'input' hook");

        let (_, rules) = &input_chains["input"];
        assert_eq!(rules.len(), 1, "Expected exactly one rule in chain");

        let rule = &rules[0];
        assert_eq!(rule.expr.len(), 2, "Expected exactly two expressions in rule");

        if let Expression::Match { r#match: m } = &rule.expr[0] {
            assert_eq!(m.left.payload.protocol, "ip");
            assert_eq!(m.left.payload.field, "saddr");
        } else {
            panic!("First expression should be Match");
        }

        if let Expression::Drop { r#drop:  _} = &rule.expr[1] {
        } else {
            panic!("Second expression should be Drop");
        }
    }

    #[test]
    fn test_parse_arp_drop() {
        let restructured = setup_restructured("src/nft/testdata/arp_drop.json");

        let input_chains = &restructured["input"];
        assert!(!input_chains.is_empty(), "Expected at least one chain for 'input' hook");

        let (_, rules) = &input_chains["input"];
        assert_eq!(rules.len(), 1, "Expected exactly one rule in chain");

        let rule = &rules[0];
        assert_eq!(rule.expr.len(), 2, "Expected exactly two expressions in rule");

        if let Expression::Match { r#match: m } = &rule.expr[0] {
            assert_eq!(m.left.payload.protocol, "arp");
            assert_eq!(m.left.payload.field, "plen");
        } else {
            panic!("First expression should be Match");
        }

        if let Expression::Drop { r#drop: _ } = &rule.expr[1] {
        } else {
            panic!("Second expression should be Drop");
        }
    }

    #[test]
    fn test_parse_long_chain() {
        let restructured = setup_restructured("src/nft/testdata/long_chain.json");

        let input_chains = &restructured["input"];
        assert!(input_chains.contains_key("arp_rules"), "Expected 'arp_rules' chain in 'input' hook");

        let (chain, rules) = &input_chains["arp_rules"];
        assert_eq!(rules.len(), 3, "Expected exactly three rules in 'arp_rules' chain");

        // Verify handles are parsed and present
        assert!(chain.handle > 0, "Chain handle should be positive");
        for rule in rules {
            assert!(rule.handle > 0, "Rule handle should be positive");
        }
    }

    #[test]
    fn test_parse_hookless() {
        let json_content = fs::read_to_string("src/nft/testdata/hookless.json")
            .expect("Failed to read hookless.json");

        let result = parse(&json_content);
        assert!(result.is_ok(), "Failed to parse hookless.json: {:?}", result.err());

        let nftables = result.unwrap();
        let restructured = restructure(nftables);
        assert!(restructured.is_empty(), "Expected empty restructured data for hookless nftables");
    }
}

#[cfg(test)]
mod debug_tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_print_parsed() {
        let json_content = fs::read_to_string("src/nft/testdata/arp_drop.json")
            .expect("Failed to read filter_drop.json");

        let result = parse(&json_content).unwrap();

        println!("{:#?}", restructure(result));
    }
}
