use super::models::InterfaceList;
use super::route_models::RouteList;
use anyhow::Result;

/// Parse ip addr JSON output into structured data
///
/// # Arguments
/// * `json_str` - A string containing ip addr JSON output
///
/// # Returns
/// * `Result<InterfaceList>` - Parsed interface list or error
pub fn parse_addr(json_str: &str) -> Result<InterfaceList> {
    Ok(serde_json::from_str(json_str)?)
}

/// Parse ip route JSON output into structured data
///
/// # Arguments
/// * `json_str` - A string containing ip route JSON output
///
/// # Returns
/// * `Result<RouteList>` - Parsed route list or error
pub fn parse_route(json_str: &str) -> Result<RouteList> {
    Ok(serde_json::from_str(json_str)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_parse_addr() {
        let json_content = fs::read_to_string("src/ip/testdata/addr.json")
            .expect("Failed to read addr.json");

        let result = parse_addr(&json_content);
        assert!(result.is_ok(), "Failed to parse addr.json: {:?}", result.err());

        let interfaces = result.unwrap();
        assert!(interfaces.len() > 0, "Expected non-empty interface list");

        // Check that we have loopback interface
        let lo = interfaces.iter().find(|i| i.ifname == "lo");
        assert!(lo.is_some(), "Expected to find loopback interface");

        let lo = lo.unwrap();
        assert_eq!(lo.ifindex, 1);
        assert!(lo.addr_info.len() > 0, "Expected address info on loopback");
    }

    #[test]
    fn test_parse_route() {
        let json_content = fs::read_to_string("src/ip/testdata/route.json")
            .expect("Failed to read route.json");

        let result = parse_route(&json_content);
        assert!(result.is_ok(), "Failed to parse route.json: {:?}", result.err());

        let routes = result.unwrap();
        assert!(routes.len() > 0, "Expected non-empty route list");

        // Check that we have a default route
        let default_route = routes.iter().find(|r| r.dst == "default");
        assert!(default_route.is_some(), "Expected to find default route");
    }
}
