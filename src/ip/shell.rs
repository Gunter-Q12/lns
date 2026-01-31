use anyhow::{Context, Result};
use std::process::Command;

/// Execute "ip --json addr" command
///
/// # Returns
/// * `Result<String>` - JSON output from ip addr command or error
pub fn list_addr() -> Result<String> {
    let output = Command::new("ip")
        .arg("--json")
        .arg("addr")
        .output()
        .context("Failed to execute ip addr command")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("ip addr command failed: {}", stderr);
    }

    String::from_utf8(output.stdout).context("Failed to parse ip addr output as UTF-8")
}

/// Execute "ip --json route show table all" command
///
/// # Returns
/// * `Result<String>` - JSON output from ip route command or error
pub fn list_routes() -> Result<String> {
    let output = Command::new("ip")
        .arg("--json")
        .arg("route")
        .arg("show")
        .arg("table")
        .arg("all")
        .output()
        .context("Failed to execute ip route command")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("ip route command failed: {}", stderr);
    }

    String::from_utf8(output.stdout).context("Failed to parse ip route output as UTF-8")
}
