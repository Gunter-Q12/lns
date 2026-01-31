mod models;
mod server;
mod nft;
mod nft_models;
mod nft_parse;

use server::Server;

#[tokio::main]
async fn main() {
    let server = Server::new(|| {
        // Execute nft command to get ruleset
        let nft_output = match nft::list_ruleset() {
            Ok(output) => output,
            Err(e) => {
                eprintln!("Failed to execute nft command: {}", e);
                return r#"{"error": "Failed to execute nft command"}"#.to_string();
            }
        };

        // Parse the nft output into our models
        let chains = match nft_parse::parse(&nft_output) {
            Ok(chains) => chains,
            Err(e) => {
                eprintln!("Failed to parse nft output: {}", e);
                return r#"{"error": "Failed to parse nft output"}"#.to_string();
            }
        };

        // Serialize to JSON
        match serde_json::to_string(&chains) {
            Ok(json) => json,
            Err(e) => {
                eprintln!("Failed to serialize chains: {}", e);
                r#"{"error": "Failed to serialize chains"}"#.to_string()
            }
        }
    }, 31337);

    if let Err(e) = server.run().await {
        eprintln!("Server error: {}", e);
    }
}
