from fastapi import APIRouter
from app.ingestion import run_ingestion, get_sync_status
from app.models import SyncStatusResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/resync", response_model=SyncStatusResponse)
async def resync_data():
    """
    Manually trigger data ingestion from /data/data.csv into MongoDB.
    """
    res = await run_ingestion()
    return SyncStatusResponse(
        status=res.get("status", "unknown"),
        last_sync_timestamp=res.get("last_sync_timestamp"),
        rows_read=res.get("rows_read", 0),
        inserted=res.get("inserted", 0),
        updated=res.get("updated", 0),
        skipped=res.get("skipped", 0),
        errors=res.get("errors", [])
    )

@router.get("/sync-status", response_model=SyncStatusResponse)
async def sync_status():
    """
    Get the last CSV sync timestamp, metrics, and any validation errors.
    """
    res = get_sync_status()
    return SyncStatusResponse(
        status=res.get("status", "idle"),
        last_sync_timestamp=res.get("last_sync_timestamp"),
        rows_read=res.get("rows_read", 0),
        inserted=res.get("inserted", 0),
        updated=res.get("updated", 0),
        skipped=res.get("skipped", 0),
        errors=res.get("errors", [])
    )
