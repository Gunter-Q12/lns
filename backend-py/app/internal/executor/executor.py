import subprocess
import asyncio
import structlog
from typing import List, Optional

logger = structlog.get_logger()

class Executor:
    def __init__(self):
        self.logger = logger.bind(component="executor")

    async def run(self, name: str, *args: str) -> bytes:
        self.logger.info("executing command", command=name, args=args)

        process = await asyncio.create_subprocess_exec(
            name,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            err_msg = stderr.decode().strip()
            self.logger.error("command failed", command=name, args=args, error=err_msg, returncode=process.returncode)
            raise subprocess.CalledProcessError(process.returncode, [name, *args], output=stdout, stderr=stderr)

        return stdout
