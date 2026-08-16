import csv
import os
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.config import settings
from app.database import get_db, db_save_member
from app.gap_engine import evaluate_member_measures

# TODO: priorityScore is a placeholder (always 0). Real prioritization
# logic (e.g. distance to next star cutpoint, measure weight, condition
# severity) will be added later. Do not assume any scoring behavior yet.

logger = logging.getLogger("medicare.ingestion")

# In-memory tracking of the latest sync status
_last_sync_status = {
    "status": "idle",
    "last_sync_timestamp": None,
    "rows_read": 0,
    "inserted": 0,
    "updated": 0,
    "skipped": 0,
    "errors": []
}

ALLOWED_STATUSES = {"compliant", "gap", "not_eligible"}

def resolve_csv_path(path_str: Optional[str] = None) -> Path:
    """Resolve data.csv path searching common locations."""
    if path_str and os.path.exists(path_str):
        return Path(path_str)
    
    candidates = [
        Path(settings.DATA_CSV_PATH),
        Path("/Users/nethra-nts0598/Documents/CTS_Hack_AI/data/data.csv"),
        Path(__file__).resolve().parent.parent.parent / "data" / "data.csv",
        Path(__file__).resolve().parent.parent / "data" / "data.csv",
        Path("data/data.csv"),
        Path("../data/data.csv"),
        Path("/Users/nethra-nts0598/Documents/CTS_Hack_AI/data/members_wide.csv")
    ]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError(f"data.csv not found in candidate paths: {[str(c) for c in candidates]}")

def parse_bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    if not val:
        return False
    return str(val).strip().lower() in ("true", "1", "yes", "t")

def parse_int(val: Any) -> Optional[int]:
    if val is None or str(val).strip() in ("", "nan", "None", "null"):
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None

def parse_float(val: Any) -> Optional[float]:
    if val is None or str(val).strip() in ("", "nan", "None", "null"):
        return None
    try:
        return round(float(str(val).strip()), 1)
    except (ValueError, TypeError):
        return None

def clean_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    if s in ("", "nan", "None", "null"):
        return None
    return s

def get_sync_status() -> Dict[str, Any]:
    return dict(_last_sync_status)

async def run_ingestion(csv_path_override: Optional[str] = None) -> Dict[str, Any]:
    """
    Ingests data.csv into MongoDB Atlas 'members' collection.
    Idempotent upsert by member_id (_id).
    """
    global _last_sync_status
    start_time = datetime.now(timezone.utc).isoformat()
    
    sync_result = {
        "status": "running",
        "last_sync_timestamp": start_time,
        "rows_read": 0,
        "inserted": 0,
        "updated": 0,
        "skipped": 0,
        "errors": []
    }
    
    try:
        csv_path = resolve_csv_path(csv_path_override)
        logger.info(f"Starting CSV data ingestion from: {csv_path}")
    except FileNotFoundError as e:
        error_msg = str(e)
        logger.error(error_msg)
        sync_result["status"] = "error"
        sync_result["errors"].append(error_msg)
        _last_sync_status = sync_result
        return sync_result

    db = get_db()
    members_coll = db["members"]
    
    rows_to_process = []
    try:
        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row_idx, raw_row in enumerate(reader, start=2): # 1-indexed with header
                sync_result["rows_read"] += 1
                
                member_id = (raw_row.get("member_id") or "").strip()
                member_name = (raw_row.get("member_name") or "").strip()
                
                # Validation rule 1: required fields
                if not member_id or not member_name:
                    err = f"Row {row_idx}: Missing required member_id or member_name"
                    logger.warning(err)
                    sync_result["skipped"] += 1
                    sync_result["errors"].append(err)
                    continue

                # Status columns validation
                has_diabetes = parse_bool(raw_row.get("has_diabetes"))
                has_hypertension = parse_bool(raw_row.get("has_hypertension"))
                
                eye_status = (raw_row.get("diabetic_eye_exam_status") or "").strip().lower()
                bp_status = (raw_row.get("blood_pressure_control_status") or "").strip().lower()
                adh_status = (raw_row.get("diabetes_med_adherence_status") or "").strip().lower()
                flu_status = (raw_row.get("flu_vaccination_status") or "").strip().lower()

                # If status fields are provided in CSV, validate they are in allowed list
                statuses = [
                    ("diabetic_eye_exam_status", eye_status),
                    ("blood_pressure_control_status", bp_status),
                    ("diabetes_med_adherence_status", adh_status),
                    ("flu_vaccination_status", flu_status)
                ]
                
                status_error = False
                for col_name, s_val in statuses:
                    if s_val and s_val not in ALLOWED_STATUSES:
                        err = f"Row {row_idx} ({member_id}): Invalid status '{s_val}' for {col_name}"
                        logger.warning(err)
                        sync_result["skipped"] += 1
                        sync_result["errors"].append(err)
                        status_error = True
                        break
                
                if status_error:
                    continue

                # Raw values
                last_exam_date = clean_str(raw_row.get("last_exam_date"))
                last_bp_reading = clean_str(raw_row.get("last_bp_reading"))
                adherence_pct = parse_float(raw_row.get("adherence_pct"))
                last_flu_shot_date = clean_str(raw_row.get("last_flu_shot_date"))

                # If statuses were already validly specified in CSV, use them, otherwise evaluate
                if all(s in ALLOWED_STATUSES for s in [eye_status, bp_status, adh_status, flu_status]):
                    measures_doc = {
                        "diabetic_eye_exam": {
                            "status": eye_status,
                            "value": last_exam_date
                        },
                        "blood_pressure_control": {
                            "status": bp_status,
                            "value": last_bp_reading
                        },
                        "diabetes_med_adherence": {
                            "status": adh_status,
                            "value": adherence_pct
                        },
                        "flu_vaccination": {
                            "status": flu_status,
                            "value": last_flu_shot_date
                        }
                    }
                    # Section 3: Completed if every measure is either compliant or not_eligible; Pending if at least one gap
                    has_gap = any(m["status"] == "gap" for m in measures_doc.values())
                    overall_status = "pending" if has_gap else "completed"
                else:
                    # Run shared evaluation logic
                    eval_res = evaluate_member_measures({
                        "has_diabetes": has_diabetes,
                        "has_hypertension": has_hypertension,
                        "last_exam_date": last_exam_date,
                        "last_bp_reading": last_bp_reading,
                        "adherence_pct": adherence_pct,
                        "last_flu_shot_date": last_flu_shot_date
                    })
                    measures_doc = eval_res["measures"]
                    overall_status = eval_res["overallStatus"]

                doc = {
                    "_id": member_id,
                    "name": member_name,
                    "age": parse_int(raw_row.get("age")),
                    "gender": clean_str(raw_row.get("gender")),
                    "location": {
                        "city": (raw_row.get("city") or "Boston").strip(),
                        "state": (raw_row.get("state") or "Massachusetts").strip()
                    },
                    "insurance": {
                        "company": (raw_row.get("insurance_company") or "Medicare").strip(),
                        "planType": "Medicare Advantage"
                    },
                    "conditions": {
                        "diabetes": has_diabetes,
                        "hypertension": has_hypertension
                    },
                    "measures": measures_doc,
                    "overallStatus": overall_status,
                    "priorityScore": 0,  # placeholder
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                }
                rows_to_process.append(doc)

    except Exception as e:
        err = f"Failed to read CSV file: {str(e)}"
        logger.error(err)
        sync_result["status"] = "error"
        sync_result["errors"].append(err)
        _last_sync_status = sync_result
        return sync_result

    # Upsert into Neon PostgreSQL & MongoDB Atlas
    for doc in rows_to_process:
        try:
            await db_save_member(doc)
            sync_result["inserted"] += 1
        except Exception as e:
            err = f"Failed to upsert member {doc.get('_id')}: {str(e)}"
            logger.error(err)
            sync_result["skipped"] += 1
            sync_result["errors"].append(err)

    sync_result["status"] = "success"
    _last_sync_status = sync_result
    
    logger.info(
        f"Ingestion complete: Read {sync_result['rows_read']} rows, "
        f"Inserted: {sync_result['inserted']}, "
        f"Updated: {sync_result['updated']}, "
        f"Skipped: {sync_result['skipped']}"
    )
    return sync_result
