import logging
import asyncio
import json
import base64
from typing import Any, Optional, Dict, List
import asyncpg
import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("medicare.db")

# Global connection references
_pg_pool: Optional[asyncpg.Pool] = None
_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_db: Optional[AsyncIOMotorDatabase] = None
_is_in_memory: bool = False

# Fallback in-memory storage if Postgres is initializing
_in_memory_docs: Dict[str, dict] = {}
_in_memory_proofs: Dict[str, dict] = {}

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    city TEXT,
    state TEXT,
    insurance_company TEXT,
    plan_type TEXT,
    has_diabetes BOOLEAN DEFAULT FALSE,
    has_hypertension BOOLEAN DEFAULT FALSE,
    eye_exam_status TEXT,
    eye_exam_value TEXT,
    bp_status TEXT,
    bp_value TEXT,
    adh_status TEXT,
    adh_value DOUBLE PRECISION,
    flu_status TEXT,
    flu_value TEXT,
    overall_status TEXT,
    priority_score INT DEFAULT 0,
    reachability_score INT DEFAULT 0,
    reachability_label TEXT,
    target_measure TEXT,
    raw_doc JSONB,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS proof_documents (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    measure_key TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INT NOT NULL,
    file_data_b64 TEXT,
    notes TEXT,
    uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_overall_status ON members(overall_status);
CREATE INDEX IF NOT EXISTS idx_members_priority ON members(priority_score);
CREATE INDEX IF NOT EXISTS idx_proof_member_id ON proof_documents(member_id);
"""

async def init_db():
    """Initialize Neon PostgreSQL connection pool and MongoDB Atlas document client."""
    global _pg_pool, _mongo_client, _mongo_db, _is_in_memory

    # 1. Initialize PostgreSQL (Neon)
    if settings.DATABASE_URL:
        try:
            logger.info("Connecting to Neon PostgreSQL...")
            _pg_pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=2,
                max_size=10,
                timeout=15.0
            )
            async with _pg_pool.acquire() as conn:
                await conn.execute(SCHEMA_SQL)
                pg_ver = await conn.fetchval("SELECT version();")
                logger.info(f"Connected to Neon PostgreSQL successfully! ({pg_ver.split(',')[0]})")
        except Exception as e:
            logger.error(f"PostgreSQL connection error: {e}. Using fallback buffer.")
            _is_in_memory = True
    else:
        logger.warning("No DATABASE_URL configured. Using in-memory fallback.")
        _is_in_memory = True

    # 2. Initialize MongoDB Atlas (for document attachments & proof storage)
    if settings.MONGODB_URI:
        try:
            logger.info("Connecting to MongoDB Atlas for proof documents...")
            _mongo_client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=5000
            )
            _mongo_db = _mongo_client[settings.DB_NAME]
            logger.info(f"MongoDB Atlas initialized for database '{settings.DB_NAME}'.")
        except Exception as e:
            logger.warning(f"MongoDB Atlas initialization notice: {e}")

async def close_db():
    """Close PostgreSQL pool and MongoDB client."""
    global _pg_pool, _mongo_client
    if _pg_pool:
        await _pg_pool.close()
        logger.info("PostgreSQL connection pool closed.")
    if _mongo_client:
        _mongo_client.close()
        logger.info("MongoDB Atlas client closed.")

def get_pg_pool() -> Optional[asyncpg.Pool]:
    return _pg_pool

def get_mongo_db() -> Optional[AsyncIOMotorDatabase]:
    return _mongo_db

def is_in_memory() -> bool:
    return _pg_pool is None and _is_in_memory

# ---------------------------------------------------------
# High-Level PostgreSQL & MongoDB Atlas Operations
# ---------------------------------------------------------

async def db_save_member(doc: dict):
    """Save or update member in Neon PostgreSQL."""
    pool = get_pg_pool()
    member_id = str(doc.get("_id") or doc.get("id"))
    
    loc = doc.get("location") or {}
    ins = doc.get("insurance") or {}
    cond = doc.get("conditions") or {}
    meas = doc.get("measures") or {}

    eye = meas.get("diabetic_eye_exam") or {}
    bp = meas.get("blood_pressure_control") or {}
    adh = meas.get("diabetes_med_adherence") or {}
    flu = meas.get("flu_vaccination") or {}

    # In-memory buffer
    _in_memory_docs[member_id] = doc

    if not pool:
        return doc

    query = """
    INSERT INTO members (
        id, name, age, gender, city, state, insurance_company, plan_type,
        has_diabetes, has_hypertension, eye_exam_status, eye_exam_value,
        bp_status, bp_value, adh_status, adh_value, flu_status, flu_value,
        overall_status, priority_score, reachability_score, reachability_label,
        target_measure, raw_doc, updated_at
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        insurance_company = EXCLUDED.insurance_company,
        plan_type = EXCLUDED.plan_type,
        has_diabetes = EXCLUDED.has_diabetes,
        has_hypertension = EXCLUDED.has_hypertension,
        eye_exam_status = EXCLUDED.eye_exam_status,
        eye_exam_value = EXCLUDED.eye_exam_value,
        bp_status = EXCLUDED.bp_status,
        bp_value = EXCLUDED.bp_value,
        adh_status = EXCLUDED.adh_status,
        adh_value = EXCLUDED.adh_value,
        flu_status = EXCLUDED.flu_status,
        flu_value = EXCLUDED.flu_value,
        overall_status = EXCLUDED.overall_status,
        priority_score = EXCLUDED.priority_score,
        reachability_score = EXCLUDED.reachability_score,
        reachability_label = EXCLUDED.reachability_label,
        target_measure = EXCLUDED.target_measure,
        raw_doc = EXCLUDED.raw_doc,
        updated_at = EXCLUDED.updated_at;
    """

    async with pool.acquire() as conn:
        await conn.execute(
            query,
            member_id,
            doc.get("name", ""),
            doc.get("age"),
            doc.get("gender"),
            loc.get("city", ""),
            loc.get("state", "Massachusetts"),
            ins.get("company", "Medicare"),
            ins.get("planType", "Medicare Advantage"),
            cond.get("diabetes", False),
            cond.get("hypertension", False),
            eye.get("status", "not_eligible"),
            str(eye.get("value")) if eye.get("value") is not None else None,
            bp.get("status", "not_eligible"),
            str(bp.get("value")) if bp.get("value") is not None else None,
            adh.get("status", "not_eligible"),
            float(adh.get("value")) if adh.get("value") is not None else None,
            flu.get("status", "not_eligible"),
            str(flu.get("value")) if flu.get("value") is not None else None,
            doc.get("overallStatus", "completed"),
            int(doc.get("priorityScore", 0)),
            int(doc.get("reachabilityScore", 0)),
            doc.get("reachabilityLabel"),
            doc.get("targetMeasure"),
            json.dumps(doc),
            doc.get("updatedAt")
        )
    return doc

async def db_get_all_members() -> List[dict]:
    """Retrieve all members from Neon PostgreSQL or fallback."""
    pool = get_pg_pool()
    if not pool:
        return list(_in_memory_docs.values())

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT raw_doc FROM members ORDER BY priority_score DESC, name ASC;")
        return [json.loads(r["raw_doc"]) for r in rows if r["raw_doc"]]

async def db_get_member(member_id: str) -> Optional[dict]:
    """Retrieve a single member from Neon PostgreSQL."""
    pool = get_pg_pool()
    if not pool:
        return _in_memory_docs.get(member_id)

    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT raw_doc FROM members WHERE id = $1;", member_id)
        if row and row["raw_doc"]:
            return json.loads(row["raw_doc"])
    return _in_memory_docs.get(member_id)

async def db_delete_member(member_id: str) -> bool:
    """Delete a member from Neon PostgreSQL and MongoDB."""
    pool = get_pg_pool()
    _in_memory_docs.pop(member_id, None)

    if pool:
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM members WHERE id = $1;", member_id)
            await conn.execute("DELETE FROM proof_documents WHERE member_id = $1;", member_id)

    # Clean MongoDB proof docs
    mongo_db = get_mongo_db()
    if mongo_db is not None:
        try:
            await mongo_db["proof_documents"].delete_many({"member_id": member_id})
        except Exception:
            pass

    return True

async def db_save_proof_document(doc_metadata: dict, file_bytes: Optional[bytes] = None):
    """
    Save hospital proof document metadata & binary content into MongoDB Atlas and Neon PostgreSQL.
    """
    member_id = doc_metadata["member_id"]
    doc_id = doc_metadata["id"]
    b64_data = base64.b64encode(file_bytes).decode("utf-8") if file_bytes else None

    # 1. Store in MongoDB Atlas (full document store)
    mongo_db = get_mongo_db()
    if mongo_db is not None:
        try:
            mongo_record = dict(doc_metadata)
            if b64_data:
                mongo_record["file_data_b64"] = b64_data
            await mongo_db["proof_documents"].update_one(
                {"id": doc_id},
                {"$set": mongo_record},
                upsert=True
            )
            logger.info(f"Saved proof document '{doc_id}' in MongoDB Atlas collection 'proof_documents'.")
        except Exception as e:
            logger.warning(f"MongoDB Atlas proof save warning: {e}")

    # 2. Store in PostgreSQL
    pool = get_pg_pool()
    if pool:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO proof_documents (
                    id, member_id, measure_key, filename, original_filename,
                    file_url, content_type, size_bytes, file_data_b64, notes, uploaded_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (id) DO UPDATE SET
                    notes = EXCLUDED.notes,
                    uploaded_at = EXCLUDED.uploaded_at;
                """,
                doc_id,
                member_id,
                doc_metadata.get("measure_key", ""),
                doc_metadata.get("filename", ""),
                doc_metadata.get("original_filename", ""),
                doc_metadata.get("file_url", ""),
                doc_metadata.get("content_type", ""),
                int(doc_metadata.get("size_bytes", 0)),
                b64_data,
                doc_metadata.get("notes"),
                doc_metadata.get("uploaded_at")
            )

    # Update member raw_doc proof_documents array
    member = await db_get_member(member_id)
    if member:
        proofs = member.get("proof_documents", [])
        proofs = [p for p in proofs if p.get("id") != doc_id]
        proofs.append(doc_metadata)
        member["proof_documents"] = proofs
        await db_save_member(member)

    return doc_metadata

async def db_get_proof_documents(member_id: str) -> List[dict]:
    """Retrieve all proof documents for a member from MongoDB Atlas or PostgreSQL."""
    mongo_db = get_mongo_db()
    if mongo_db is not None:
        try:
            cursor = mongo_db["proof_documents"].find({"member_id": member_id})
            docs = await cursor.to_list(length=100)
            if docs:
                for d in docs:
                    d.pop("_id", None)
                    d.pop("file_data_b64", None)  # Don't send huge base64 in list
                return docs
        except Exception:
            pass

    pool = get_pg_pool()
    if pool:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, member_id, measure_key, filename, original_filename, file_url, content_type, size_bytes, notes, uploaded_at FROM proof_documents WHERE member_id = $1;",
                member_id
            )
            return [dict(r) for r in rows]

    return []

async def db_delete_proof_document(member_id: str, doc_id: str) -> bool:
    """Delete proof document from MongoDB Atlas and PostgreSQL."""
    mongo_db = get_mongo_db()
    if mongo_db is not None:
        try:
            await mongo_db["proof_documents"].delete_one({"id": doc_id})
        except Exception:
            pass

    pool = get_pg_pool()
    if pool:
        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM proof_documents WHERE id = $1;", doc_id)

    member = await db_get_member(member_id)
    if member:
        proofs = member.get("proof_documents", [])
        member["proof_documents"] = [p for p in proofs if p.get("id") != doc_id]
        await db_save_member(member)

    return True

# Compatibility alias
def get_db():
    """Compatibility interface for legacy callers."""
    class CompatCollection:
        async def find_one(self, filter_dict):
            member_id = str(filter_dict.get("_id") or filter_dict.get("id"))
            return await db_get_member(member_id)

        def find(self, filter_dict=None):
            filter_dict = filter_dict or {}
            class AsyncCursor:
                def __init__(self, fdict):
                    self.fdict = fdict

                async def to_list(self, length=None):
                    all_docs = await db_get_all_members()
                    if not self.fdict:
                        return all_docs
                    
                    matched = []
                    for doc in all_docs:
                        is_match = True
                        for k, v in self.fdict.items():
                            parts = k.split(".")
                            curr = doc
                            for p in parts:
                                if isinstance(curr, dict) and p in curr:
                                    curr = curr[p]
                                else:
                                    curr = None
                                    break
                            if curr != v:
                                is_match = False
                                break
                        if is_match:
                            matched.append(doc)
                    return matched
            return AsyncCursor(filter_dict)

        async def insert_one(self, doc):
            member_id = str(doc.get("_id") or doc.get("id"))
            await db_save_member(doc)
            return type("InsertResult", (), {"inserted_id": member_id})()

        async def update_one(self, filter_dict, update_dict, upsert=False):
            member_id = str(filter_dict.get("_id") or filter_dict.get("id"))
            existing = await db_get_member(member_id) or {"_id": member_id}
            if "$set" in update_dict:
                existing.update(update_dict["$set"])
            if "$push" in update_dict:
                for k, v in update_dict["$push"].items():
                    existing.setdefault(k, []).append(v)
            if "$pull" in update_dict:
                for k, v in update_dict["$pull"].items():
                    if isinstance(v, dict):
                        pull_k, pull_v = list(v.items())[0]
                        existing[k] = [x for x in existing.get(k, []) if x.get(pull_k) != pull_v]
            await db_save_member(existing)
            return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1, "upserted_id": None})()

        async def delete_one(self, filter_dict):
            member_id = str(filter_dict.get("_id") or filter_dict.get("id"))
            res = await db_delete_member(member_id)
            return type("DeleteResult", (), {"deleted_count": 1 if res else 0})()

        async def delete_many(self, filter_dict):
            return type("DeleteResult", (), {"deleted_count": 0})()

    class CompatDatabase:
        def __getitem__(self, item):
            return CompatCollection()

    return CompatDatabase()
