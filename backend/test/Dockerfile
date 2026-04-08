# Build stage
FROM golang:1.26.2-alpine3.23 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd/ ./cmd/
COPY internal/ ./internal/

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api ./cmd/api/main.go

# Final stage
FROM ubuntu:24.04

RUN apt update && \
    apt install -y nftables iproute2 iputils-ping && \
    rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /app/api /usr/local/bin/api

# Copy the entrypoint script
COPY test/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/local/bin/api"]
