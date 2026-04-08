import pytest

def pytest_addoption(parser):
    parser.addoption(
        "--backend",
        action="store",
        default="go-api",
        help="Backend service to test: go-api or py-api"
    )

@pytest.fixture
def backend(request):
    return request.config.getoption("--backend")
