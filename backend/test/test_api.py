import pytest
import requests
import json
import os
import subprocess
import time
from jsonpath_ng.ext import parse

# Configuration
COMPOSE_FILE = "backend/test/docker-compose.yml"
BASE_URL = "http://localhost:31337/api"

@pytest.fixture(scope="session", autouse=True)
def manage_docker_compose():
    # Start Docker Compose
    subprocess.run(f"docker compose -f {COMPOSE_FILE} up --build -d", check=True, shell=True)

    # Wait for API to be ready
    start_time = time.time()
    timeout = 30
    while time.time() - start_time < timeout:
        try:
            response = requests.get(f"{BASE_URL}/addr")
            if response.status_code == 200:
                break
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    else:
        pytest.fail("Timeout waiting for API to start")

    yield

    # Tear down
    subprocess.run(f"docker compose -f {COMPOSE_FILE} down", check=True, shell=True)

@pytest.mark.parametrize("path, json_path, expected_value", [
    # Verify the presence of specific network elements we created in the Dockerfile/entrypoint
    ("/addr", "$[?(@.ifname=='lo')].addr_info[?(@.local=='2001:db8::1')].local", "2001:db8::1"),
    ("/route", "$[?(@.table=='ipv4_demo' & @.dst=='172.17.0.0/16')].dst", "172.17.0.0/16"),
    ("/route", "$[?(@.table=='ipv6_demo' & @.dst=='default')].dst", "default"),
    ("/rule4", "$[?(@.table=='ipv4_demo' & @.src=='172.17.0.2')].table", "ipv4_demo"),
    ("/rule6", "$[?(@.table=='ipv6_demo' & @.src=='2001:db8::1')].table", "ipv6_demo"),
    ("/nft", "$.nftables[?(@.table.name=='arp_example' & @.table.family=='arp')].table.name", "arp_example"),
    ("/nft", "$.nftables[?(@.chain.name=='main_chain' & @.chain.table=='arp_example')].chain.name", "main_chain"),
    ("/namespaces", "$.namespaces[?(@.type=='net')].type", "net"),
])
def test_api_fields(path, json_path, expected_value):
    # Get actual data from API
    response = requests.get(f"{BASE_URL}{path}")
    assert response.status_code == 200, f"Endpoint {path} failed with status {response.status_code}"

    actual_data = response.json()

    # Parse and find the value using jsonpath-ng.ext (needed for filter expressions)
    jsonpath_expression = parse(json_path)
    matches = jsonpath_expression.find(actual_data)

    assert len(matches) > 0, f"No matches found for JSONPath '{json_path}' in response from {path}. Data: {actual_data}"

    # Check if any of the matches match the expected value
    match_found = any(str(match.value) == str(expected_value) for match in matches)
    assert match_found, f"Expected value '{expected_value}' not found at JSONPath '{json_path}' for {path}. Found: {[m.value for m in matches]}"
