from fastapi import APIRouter, Request, HTTPException, Query, Path, Response
from app.internal.executor.executor import Executor
import structlog
import json

router = APIRouter()
logger = structlog.get_logger()
executor = Executor()

@router.get("/api/{path:path}")
async def get_path(
    path: str,
    namespace: str = Query(None)
):
    ns_cmd = []
    if namespace:
        ns_cmd = ["nsenter", f"--net={namespace}"]

    cmd = []
    if path == "namespaces" or path == "/namespaces":
        cmd = ["lsns", "--json", "-t", "net"]
    elif path == "nft" or path == "/nft":
        cmd = ["nft", "--json", "list", "ruleset"]
    elif path == "route" or path == "/route":
        cmd = ["ip", "--json", "route", "show", "table", "all"]
    elif path == "rule4" or path == "/rule4":
        cmd = ["ip", "--json", "rule"]
    elif path == "rule6" or path == "/rule6":
        cmd = ["ip", "-6", "--json", "rule"]
    elif path == "addr" or path == "/addr":
        cmd = ["ip", "--json", "addr"]
    else:
        raise HTTPException(status_code=404, detail=f"Received unknown path: /api/{path}")

    final_cmd = ns_cmd + cmd

    try:
        output = await executor.run(final_cmd[0], *final_cmd[1:])

        try:
            return Response(content=output, media_type="application/json")
        except Exception as e:
            logger.error("failed to process command output", error=str(e))
            raise HTTPException(status_code=500, detail="Internal server error processing command output")

    except Exception as e:
        logger.error("getting data", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
