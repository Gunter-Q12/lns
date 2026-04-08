# Final stage
FROM ubuntu:24.04
RUN apt update && \
    apt install -y nftables iproute2 iputils-ping python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend-py/requirements.txt .
RUN pip3 install --break-system-packages -r requirements.txt

COPY backend-py/app ./app
COPY testing/e2e/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["python3", "-m", "app.main"]
