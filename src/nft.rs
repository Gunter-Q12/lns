use anyhow::{Context, Result};
use std::process::Command;

pub fn list_ruleset() -> Result<String> {
    let output = Command::new("nft")
        .arg("--json")
        .arg("list")
        .arg("ruleset")
        .output()
        .context("Failed to execute nft command")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("nft command failed: {}", stderr);
    }

    String::from_utf8(output.stdout).context("Failed to parse nft output as UTF-8")
}
