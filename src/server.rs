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
    pub fn new<F>(handler: F, port: u16) -> Self
    where
        F: Fn() -> String + Send + Sync + 'static,
    {
        Self {
            handler: Arc::new(handler),
            port: port,
        }
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
    fn test_server_with_custom_port() {
        let server = Server::new(|| r#"{"status": "ok"}"#.to_string(), 8080);
        assert_eq!(server.port, 8080);
    }
}
