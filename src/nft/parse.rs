use super::models::NftablesRoot;
use anyhow::Result;

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_parse_empty_nftables() {
        let json_content = fs::read_to_string("src/nft/testdata/empty.json")
            .expect("Failed to read empty.json");

        let result = parse(&json_content);
        assert!(result.is_ok(), "Failed to parse empty.json: {:?}", result.err());

        let nftables = result.unwrap();
        // Empty ruleset still contains metainfo item
        assert_eq!(nftables.nftables.len(), 1, "Expected only metainfo in empty nftables");
    }

    #[test]
    fn test_parse_filter_drop() {
        let json_content = fs::read_to_string("src/nft/testdata/filter_drop.json")
            .expect("Failed to read filter_drop.json");

        let result = parse(&json_content);
        assert!(result.is_ok(), "Failed to parse filter_drop.json: {:?}", result.err());

        let nftables = result.unwrap();
        assert!(nftables.nftables.len() > 0, "Expected non-empty nftables array");
    }
}
