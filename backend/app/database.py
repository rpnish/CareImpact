import logging
import asyncio
from typing import Any, Optional, Dict, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger("medicare.db")

class InMemoryAsyncCollection:
    """In-memory async fallback collection if MongoDB Atlas is not configured."""
    def __init__(self, name: str):
        self.name = name
        self._docs: Dict[str, dict] = {}

    async def find_one(self, filter_dict: dict) -> Optional[dict]:
        for doc in self._docs.values():
            if self._matches(doc, filter_dict):
                return dict(doc)
        return None

    def find(self, filter_dict: Optional[dict] = None):
        filter_dict = filter_dict or {}
        matches = [dict(doc) for doc in self._docs.values() if self._matches(doc, filter_dict)]
        return InMemoryCursor(matches)

    async def count_documents(self, filter_dict: Optional[dict] = None) -> int:
        filter_dict = filter_dict or {}
        return sum(1 for doc in self._docs.values() if self._matches(doc, filter_dict))

    async def update_one(self, filter_dict: dict, update_dict: dict, upsert: bool = False):
        existing_key = None
        for k, doc in self._docs.items():
            if self._matches(doc, filter_dict):
                existing_key = k
                break

        if existing_key is not None:
            doc = self._docs[existing_key]
            if "$set" in update_dict:
                for sk, sv in update_dict["$set"].items():
                    self._set_nested(doc, sk, sv)
            if "$setOnInsert" in update_dict:
                pass
            return UpdateResult(matched_count=1, modified_count=1, upserted_id=None)
        elif upsert:
            new_doc = {}
            if "$setOnInsert" in update_dict:
                new_doc.update(update_dict["$setOnInsert"])
            if "$set" in update_dict:
                for sk, sv in update_dict["$set"].items():
                    self._set_nested(new_doc, sk, sv)
            
            doc_id = filter_dict.get("_id") or new_doc.get("_id") or str(len(self._docs) + 1)
            new_doc["_id"] = doc_id
            self._docs[str(doc_id)] = new_doc
            return UpdateResult(matched_count=0, modified_count=0, upserted_id=doc_id)
        return UpdateResult(matched_count=0, modified_count=0, upserted_id=None)

    async def insert_one(self, doc: dict):
        doc_copy = dict(doc)
        doc_id = str(doc_copy.get("_id", len(self._docs) + 1))
        doc_copy["_id"] = doc_id
        self._docs[doc_id] = doc_copy
        return InsertResult(inserted_id=doc_id)

    async def delete_one(self, filter_dict: dict):
        target_k = None
        for k, doc in self._docs.items():
            if self._matches(doc, filter_dict):
                target_k = k
                break
        if target_k is not None:
            del self._docs[target_k]
            return DeleteResult(deleted_count=1)
        return DeleteResult(deleted_count=0)

    async def delete_many(self, filter_dict: dict):
        keys_to_del = [k for k, doc in self._docs.items() if self._matches(doc, filter_dict)]
        for k in keys_to_del:
            del self._docs[k]
        return DeleteResult(deleted_count=len(keys_to_del))

    def _set_nested(self, target: dict, path: str, val: Any):
        parts = path.split(".")
        curr = target
        for p in parts[:-1]:
            if p not in curr or not isinstance(curr[p], dict):
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = val

    def _get_nested(self, doc: dict, path: str) -> Any:
        parts = path.split(".")
        curr = doc
        for p in parts:
            if not isinstance(curr, dict) or p not in curr:
                return None
            curr = curr[p]
        return curr

    def _matches(self, doc: dict, filter_dict: dict) -> bool:
        if not filter_dict:
            return True
        for k, expected in filter_dict.items():
            val = self._get_nested(doc, k)
            if isinstance(expected, dict):
                if "$regex" in expected:
                    pattern = expected["$regex"].lower()
                    if val is None or pattern not in str(val).lower():
                        return False
                elif "$in" in expected:
                    if val not in expected["$in"]:
                        return False
                elif "$ne" in expected:
                    if val == expected["$ne"]:
                        return False
            elif val != expected:
                return False
        return True


class InMemoryCursor:
    def __init__(self, items: List[dict]):
        self._items = items
        self._sort_key = None
        self._sort_dir = 1
        self._skip_val = 0
        self._limit_val = None

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def skip(self, n: int):
        self._skip_val = n
        return self

    def limit(self, n: int):
        self._limit_val = n
        return self

    def _get_result(self) -> List[dict]:
        res = list(self._items)
        if self._sort_key:
            def sort_fn(x):
                val = x.get(self._sort_key)
                return ("" if val is None else str(val))
            res.sort(key=sort_fn, reverse=(self._sort_dir < 0))
        if self._skip_val:
            res = res[self._skip_val:]
        if self._limit_val is not None:
            res = res[:self._limit_val]
        return res

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        res = self._get_result()
        if length is not None:
            res = res[:length]
        return res

    def __aiter__(self):
        self._iter_data = iter(self._get_result())
        return self

    async def __anext__(self):
        try:
            return next(self._iter_data)
        except StopIteration:
            raise StopAsyncIteration


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int, upserted_id: Any):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class InsertResult:
    def __init__(self, inserted_id: Any):
        self.inserted_id = inserted_id


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class InMemoryDatabase:
    def __init__(self):
        self._collections: Dict[str, InMemoryAsyncCollection] = {}

    def __getitem__(self, name: str) -> InMemoryAsyncCollection:
        if name not in self._collections:
            self._collections[name] = InMemoryAsyncCollection(name)
        return self._collections[name]

    def get_collection(self, name: str) -> InMemoryAsyncCollection:
        return self[name]


import certifi

# Global state
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[Any] = None
_is_in_memory: bool = False

async def init_db():
    global _client, _db, _is_in_memory
    uri = settings.MONGODB_URI.strip() if settings.MONGODB_URI else ""
    
    if uri:
        try:
            logger.info(f"Connecting to MongoDB Atlas...")
            _client = AsyncIOMotorClient(
                uri,
                serverSelectionTimeoutMS=5000,
                tlsCAFile=certifi.where()
            )
            # test connection
            await _client.admin.command('ping')
            _db = _client[settings.DB_NAME]
            _is_in_memory = False
            logger.info(f"Successfully connected to MongoDB Atlas database: '{settings.DB_NAME}'")
            return
        except Exception as e:
            logger.warning(f"MongoDB Atlas connection failed ({e}). Falling back to in-memory database.")
    
    logger.info("Using high-performance in-memory async database (Atlas fallback).")
    _db = InMemoryDatabase()
    _is_in_memory = True

async def close_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")

def get_db() -> Any:
    global _db
    if _db is None:
        _db = InMemoryDatabase()
    return _db

def is_in_memory() -> bool:
    return _is_in_memory
