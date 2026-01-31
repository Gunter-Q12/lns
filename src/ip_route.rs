use serde::{Deserialize, Serialize};

/// Represents a single IP route entry from `ip route` JSON output
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub struct IpRoute {
    /// Route type (e.g., "local", "broadcast", "multicast")
    #[serde(rename = "type")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub route_type: Option<String>,

    /// Destination address or network
    pub dst: String,

    /// Gateway address
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gateway: Option<String>,

    /// Network device/interface
    pub dev: String,

    /// Routing table identifier
    #[serde(skip_serializing_if = "Option::is_none")]
    pub table: Option<String>,

    /// Routing protocol
    #[serde(skip_serializing_if = "Option::is_none")]
    pub protocol: Option<String>,

    /// Scope of the route
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<String>,

    /// Preferred source address
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prefsrc: Option<String>,

    /// Route metric/priority
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metric: Option<u32>,

    /// Route flags
    #[serde(default)]
    pub flags: Vec<String>,

    /// Route preference (for IPv6)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pref: Option<String>,
}

/// Collection of IP routes
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IpRoutes {
    pub routes: Vec<IpRoute>,
}

impl IpRoutes {
    /// Create a new empty collection of routes
    pub fn new() -> Self {
        Self {
            routes: Vec::new(),
        }
    }

    /// Create from a vector of routes
    pub fn from_routes(routes: Vec<IpRoute>) -> Self {
        Self { routes }
    }

    /// Parse from JSON string
    pub fn from_json(json: &str) -> Result<Vec<IpRoute>, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Get IPv4 routes only
    pub fn ipv4_routes(&self) -> impl Iterator<Item = &IpRoute> {
        self.routes.iter().filter(|r| !r.dst.contains(':'))
    }

    /// Get IPv6 routes only
    pub fn ipv6_routes(&self) -> impl Iterator<Item = &IpRoute> {
        self.routes.iter().filter(|r| r.dst.contains(':'))
    }

    /// Get default routes
    pub fn default_routes(&self) -> impl Iterator<Item = &IpRoute> {
        self.routes.iter().filter(|r| r.dst == "default")
    }

    /// Filter routes by device
    pub fn routes_for_device(&self, device: &str) -> impl Iterator<Item = &IpRoute> {
        self.routes
            .iter()
            .filter(move |r| r.dev == device)
    }
}

impl Default for IpRoutes {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deserialize_simple_route() {
        let json = r#"[{
            "dst": "default",
            "gateway": "192.168.1.1",
            "dev": "eth0",
            "flags": []
        }]"#;

        let routes: Vec<IpRoute> = serde_json::from_str(json).unwrap();
        assert_eq!(routes.len(), 1);
        assert_eq!(routes[0].dst, "default");
        assert_eq!(routes[0].gateway, Some("192.168.1.1".to_string()));
        assert_eq!(routes[0].dev, "eth0");
    }

    #[test]
    fn test_deserialize_complex_route() {
        let json = r#"[{
            "type": "local",
            "dst": "127.0.0.1",
            "dev": "lo",
            "table": "local",
            "protocol": "kernel",
            "scope": "host",
            "prefsrc": "127.0.0.1",
            "flags": []
        }]"#;

        let routes: Vec<IpRoute> = serde_json::from_str(json).unwrap();
        assert_eq!(routes.len(), 1);
        assert_eq!(routes[0].route_type, Some("local".to_string()));
        assert_eq!(routes[0].dst, "127.0.0.1");
        assert_eq!(routes[0].table, Some("local".to_string()));
    }

    #[test]
    fn test_ipv4_ipv6_filtering() {
        let routes = IpRoutes::from_routes(vec![
            IpRoute {
                route_type: None,
                dst: "192.168.1.0/24".to_string(),
                gateway: None,
                dev: "eth0".to_string(),
                table: None,
                protocol: None,
                scope: None,
                prefsrc: None,
                metric: None,
                flags: vec![],
                pref: None,
            },
            IpRoute {
                route_type: None,
                dst: "fe80::/64".to_string(),
                gateway: None,
                dev: "eth0".to_string(),
                table: None,
                protocol: None,
                scope: None,
                prefsrc: None,
                metric: None,
                flags: vec![],
                pref: None,
            },
        ]);

        assert_eq!(routes.ipv4_routes().count(), 1);
        assert_eq!(routes.ipv6_routes().count(), 1);
    }
}
