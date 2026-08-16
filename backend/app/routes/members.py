import uuid
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status, File, UploadFile, Form
from app.database import get_db, db_save_proof_document, db_delete_proof_document
from app.models import (
    MemberDocument,
    MemberFlat,
    MemberCreateInput,
    MemberUpdateInput
)
from app.gap_engine import evaluate_member_measures
from app.priority_engine import calculate_dynamic_priority

router = APIRouter(prefix="/members", tags=["Members"])

def doc_to_flat(doc: dict) -> dict:
    """Flatten MongoDB member doc to match all columns from data.csv."""
    location = doc.get("location") or {}
    insurance = doc.get("insurance") or {}
    conditions = doc.get("conditions") or {}
    measures = doc.get("measures") or {}
    
    eye = measures.get("diabetic_eye_exam") or {}
    bp = measures.get("blood_pressure_control") or {}
    adh = measures.get("diabetes_med_adherence") or {}
    flu = measures.get("flu_vaccination") or {}

    return {
        "member_id": str(doc.get("_id")),
        "member_name": doc.get("name", ""),
        "age": doc.get("age"),
        "gender": doc.get("gender"),
        "city": location.get("city", ""),
        "state": location.get("state", "Massachusetts"),
        "insurance_company": insurance.get("company", "Medicare"),
        "has_diabetes": conditions.get("diabetes", False),
        "has_hypertension": conditions.get("hypertension", False),
        "diabetic_eye_exam_status": eye.get("status", "not_eligible"),
        "last_exam_date": eye.get("value"),
        "blood_pressure_control_status": bp.get("status", "not_eligible"),
        "last_bp_reading": bp.get("value"),
        "diabetes_med_adherence_status": adh.get("status", "not_eligible"),
        "adherence_pct": adh.get("value"),
        "flu_vaccination_status": flu.get("status", "not_eligible"),
        "last_flu_shot_date": flu.get("value"),
        "overallStatus": doc.get("overallStatus", "completed"),
        "priorityScore": doc.get("priorityScore", 0),
        "proof_documents": doc.get("proof_documents", []),
        "updatedAt": doc.get("updatedAt"),
        # Also include nested structures for detail view
        "raw_doc": doc
    }

@router.get("", response_model=List[Dict[str, Any]])
async def list_members(
    status: Optional[str] = Query(None, description="Filter by overallStatus: 'pending' or 'completed'"),
    measure: Optional[str] = Query(None, description="Filter members who have an open gap in this measure"),
    search: Optional[str] = Query(None, description="Search by name, city, or member ID")
):
    """
    List members with optional filtering by status (pending/completed),
    specific measure gap, or text search, with dynamic priority ranking.
    """
    db = get_db()
    members_coll = db["members"]
    
    query: Dict[str, Any] = {}
    
    if status and isinstance(status, str):
        query["overallStatus"] = status.strip().lower()
        
    if measure and isinstance(measure, str):
        measure_key = measure.strip().lower()
        # Look for gap in the specified measure
        query[f"measures.{measure_key}.status"] = "gap"
        
    cursor = members_coll.find(query)
    raw_members = await cursor.to_list(length=1000)
    
    flat_members = [doc_to_flat(m) for m in raw_members]
    
    # Calculate dynamic priority scores using Dynamic CMS Priority Engine
    if flat_members:
        p_res = calculate_dynamic_priority(flat_members)
        flat_members = p_res.get("member_ranking", flat_members)
    
    # Filter by search string if provided
    if search and isinstance(search, str):
        s = search.strip().lower()
        flat_members = [
            m for m in flat_members
            if s in m["member_name"].lower()
            or s in m["city"].lower()
            or s in m["member_id"].lower()
            or s in m["state"].lower()
        ]
        
    return flat_members

@router.get("/{member_id}", response_model=Dict[str, Any])
async def get_member(member_id: str):
    """Get single member by ID."""
    db = get_db()
    members_coll = db["members"]
    
    doc = await members_coll.find_one({"_id": member_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{member_id}' not found"
        )
    return doc_to_flat(doc)

@router.post("", status_code=status.HTTP_201_CREATED, response_model=Dict[str, Any])
async def create_member(payload: MemberCreateInput):
    """
    Create a new member from raw clinical form inputs.
    Backend evaluates all 4 HEDIS measures live via evaluate_member_measures().
    """
    db = get_db()
    members_coll = db["members"]
    
    member_id = payload.member_id.strip() if payload.member_id else str(uuid.uuid4())
    
    # Check if ID already exists
    existing = await members_coll.find_one({"_id": member_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Member with ID '{member_id}' already exists"
        )
        
    # Evaluate measures live
    eval_result = evaluate_member_measures({
        "has_diabetes": payload.has_diabetes,
        "has_hypertension": payload.has_hypertension,
        "last_exam_date": payload.last_exam_date,
        "last_bp_reading": payload.last_bp_reading,
        "adherence_pct": payload.adherence_pct,
        "last_flu_shot_date": payload.last_flu_shot_date
    })
    
    doc = {
        "_id": member_id,
        "name": payload.name.strip(),
        "age": payload.age,
        "gender": payload.gender,
        "location": {
            "city": payload.city.strip(),
            "state": (payload.state or "Massachusetts").strip()
        },
        "insurance": {
            "company": (payload.insurance_company or "Medicare").strip(),
            "planType": "Medicare Advantage"
        },
        "conditions": eval_result["conditions"],
        "measures": eval_result["measures"],
        "overallStatus": eval_result["overallStatus"],
        "priorityScore": 0,  # placeholder
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    await members_coll.insert_one(doc)
    return doc_to_flat(doc)

@router.put("/{member_id}", response_model=Dict[str, Any])
async def update_member(member_id: str, payload: MemberUpdateInput):
    """
    Update an existing member and re-run live HEDIS status evaluation.
    """
    db = get_db()
    members_coll = db["members"]
    
    existing = await members_coll.find_one({"_id": member_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{member_id}' not found"
        )
        
    flat_existing = doc_to_flat(existing)
    
    # Merge existing values with update payload
    has_diabetes = payload.has_diabetes if payload.has_diabetes is not None else flat_existing["has_diabetes"]
    has_hypertension = payload.has_hypertension if payload.has_hypertension is not None else flat_existing["has_hypertension"]
    last_exam_date = payload.last_exam_date if payload.last_exam_date is not None else flat_existing["last_exam_date"]
    last_bp_reading = payload.last_bp_reading if payload.last_bp_reading is not None else flat_existing["last_bp_reading"]
    adherence_pct = payload.adherence_pct if payload.adherence_pct is not None else flat_existing["adherence_pct"]
    last_flu_shot_date = payload.last_flu_shot_date if payload.last_flu_shot_date is not None else flat_existing["last_flu_shot_date"]
    
    name = payload.name.strip() if payload.name is not None else existing.get("name", "")
    age = payload.age if payload.age is not None else existing.get("age")
    gender = payload.gender if payload.gender is not None else existing.get("gender")
    city = payload.city.strip() if payload.city is not None else existing.get("location", {}).get("city", "Boston")
    state = payload.state.strip() if payload.state is not None else existing.get("location", {}).get("state", "Massachusetts")
    company = payload.insurance_company.strip() if payload.insurance_company is not None else existing.get("insurance", {}).get("company", "Medicare")
    
    # Re-evaluate live
    eval_result = evaluate_member_measures({
        "has_diabetes": has_diabetes,
        "has_hypertension": has_hypertension,
        "last_exam_date": last_exam_date,
        "last_bp_reading": last_bp_reading,
        "adherence_pct": adherence_pct,
        "last_flu_shot_date": last_flu_shot_date
    })
    
    existing_proofs = existing.get("proof_documents", [])
    
    updated_doc = {
        "_id": member_id,
        "name": name,
        "age": age,
        "gender": gender,
        "location": {
            "city": city,
            "state": state
        },
        "insurance": {
            "company": company,
            "planType": "Medicare Advantage"
        },
        "conditions": eval_result["conditions"],
        "measures": eval_result["measures"],
        "overallStatus": eval_result["overallStatus"],
        "priorityScore": existing.get("priorityScore", 0),
        "proof_documents": existing_proofs,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    
    await members_coll.update_one({"_id": member_id}, {"$set": updated_doc})
    return doc_to_flat(updated_doc)

@router.post("/{member_id}/proof-documents", status_code=status.HTTP_201_CREATED)
async def upload_proof_document(
    member_id: str,
    file: UploadFile = File(...),
    measure_key: str = Form(...),
    notes: Optional[str] = Form(None)
):
    """
    Upload a hospital/clinic proof document (PDF, PNG, JPG, etc.) for a specific care gap closure.
    Stores the document in local storage and records metadata in MongoDB Atlas.
    """
    db = get_db()
    members_coll = db["members"]
    
    existing = await members_coll.find_one({"_id": member_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{member_id}' not found"
        )

    # Prepare upload directory
    upload_dir = Path("uploads") / member_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    doc_id = str(uuid.uuid4())
    safe_filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", file.filename or "proof_doc")
    saved_filename = f"{doc_id[:8]}_{safe_filename}"
    file_path = upload_dir / saved_filename

    # Save file contents locally
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    doc_metadata = {
        "id": doc_id,
        "member_id": member_id,
        "measure_key": measure_key.strip(),
        "filename": saved_filename,
        "original_filename": file.filename or saved_filename,
        "file_url": f"/uploads/{member_id}/{saved_filename}",
        "content_type": file.content_type or "application/octet-stream",
        "size_bytes": len(content),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "notes": notes.strip() if notes else None
    }
    
    # Store proof document & binary content in MongoDB Atlas & PostgreSQL
    await db_save_proof_document(doc_metadata, file_bytes=content)
    
    updated_member = await members_coll.find_one({"_id": member_id})
    return {
        "message": "Proof document uploaded successfully to MongoDB Atlas & PostgreSQL",
        "document": doc_metadata,
        "member": doc_to_flat(updated_member)
    }

@router.delete("/{member_id}/proof-documents/{doc_id}")
async def delete_proof_document(member_id: str, doc_id: str):
    """
    Delete a proof document from a member across MongoDB Atlas and PostgreSQL.
    """
    db = get_db()
    members_coll = db["members"]
    
    existing = await members_coll.find_one({"_id": member_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{member_id}' not found"
        )
        
    # Remove file from disk if exists
    try:
        fpath = Path("uploads") / member_id
        for f in fpath.glob(f"{doc_id[:8]}_*"):
            if f.exists():
                f.unlink()
    except Exception:
        pass
        
    await db_delete_proof_document(member_id, doc_id)
    return {"message": "Proof document deleted successfully from MongoDB Atlas & PostgreSQL", "doc_id": doc_id}

@router.delete("/{member_id}", status_code=status.HTTP_200_OK)
async def delete_member(member_id: str):
    """Delete a member by ID."""
    db = get_db()
    members_coll = db["members"]
    
    result = await members_coll.delete_one({"_id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Member with ID '{member_id}' not found"
        )
    return {"message": f"Member '{member_id}' deleted successfully", "deleted_id": member_id}
