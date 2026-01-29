use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use std::sync::Arc;

type HandlerFn = Arc<dyn Fn() -> String + Send + Sync>;

pub struct Server {
    handler: HandlerFn,
    port: u16,
}

impl Server {
    pub fn new<F>(handler: F) -> Self
    where
        F: Fn() -> String + Send + Sync + 'static,
    {
        Self {
            handler: Arc::new(handler),
            port: 3000,
        }
    }

    pub fn with_port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    pub async fn run(self) -> Result<(), std::io::Error> {
        let app = Router::new()
            .route("/json", get(json_handler))
            .with_state(self.handler);

        let addr = format!("0.0.0.0:{}", self.port);
        let listener = tokio::net::TcpListener::bind(&addr).await?;

        println!("Server listening on {}", addr);

        axum::serve(listener, app).await
    }
}

async fn json_handler(State(handler): State<HandlerFn>) -> Response {
    let json_string = handler();

    (
        StatusCode::OK,
        [("content-type", "application/json")],
        json_string,
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_server_creation() {
        let _server = Server::new(|| r#"{"status": "ok"}"#.to_string());
    }

    #[test]
    fn test_server_with_custom_port() {
        let server = Server::new(|| r#"{"status": "ok"}"#.to_string()).with_port(8080);
        assert_eq!(server.port, 8080);
    }

    #[test]
    fn test_handler_returns_json() {
        use crate::models::*;
        use std::net::Ipv4Addr;

        let handler = || {
            let chains = vec![Chain {
                table: Table {
                    name: "filter".to_string(),
                    family: Family::Inet,
                },
                hook: Hook::Filter,
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

            serde_json::to_string(&chains).unwrap()
        };

        let json = handler();
        assert!(json.contains("filter"));
        assert!(json.contains("1.1.1.1"));
    }
}
