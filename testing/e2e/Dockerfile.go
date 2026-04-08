# Go Build stage
FROM golang:1.26.2-alpine3.23 AS builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/cmd/ ./cmd/
COPY backend/internal/ ./internal/
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api ./cmd/api/main.go

# Final stage
FROM ubuntu:24.04
RUN apt update && \
    apt install -y nftables iproute2 iputils-ping && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/api /usr/local/bin/api
COPY testing/e2e/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/api"]
