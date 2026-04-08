import os
import signal
import uvicorn
from fastapi import FastAPI
from app.internal.handlers.handlers import router
import structlog
from dotenv import load_dotenv

load_dotenv()

def setup_logging(mode: str):
    processors = [
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if mode == "debug":
        processors.extend([
            structlog.dev.set_exc_info,
            structlog.dev.ConsoleRenderer(),
        ])
    else:
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

app = FastAPI()
app.include_router(router)

if __name__ == "__main__":
    mode = os.getenv("MODE", "release")
    address = os.getenv("ADDRESS", "0.0.0.0:8080")

    setup_logging(mode)
    logger = structlog.get_logger()

    host, port = address.split(":")
    port = int(port)

    logger.info("server started", address=address)

    uvicorn.run(app, host=host, port=port, log_level="info" if mode == "release" else "debug")
