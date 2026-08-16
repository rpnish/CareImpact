import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, close_db, is_in_memory
from app.ingestion import run_ingestion
from app.routes import members, analytics, admin, assistant

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medicare.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Ingest CSV Data
    logger.info("Initializing database connection...")
    await init_db()
    
    logger.info("Running automatic CSV ingestion on startup...")
    try:
        sync_res = await run_ingestion()
        logger.info(f"Startup ingestion finished: {sync_res.get('status')} ({sync_res.get('rows_read', 0)} rows)")
    except Exception as e:
        logger.error(f"Startup ingestion error: {e}")
        
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    await close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Medicare Star Ratings & Gap-Closure Simulator API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Ensure upload directory exists
upload_dir = Path("uploads")
upload_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount API Routers
app.include_router(members.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(assistant.router)

@app.get("/")
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "database_mode": "in_memory" if is_in_memory() else "mongodb_atlas"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database_mode": "in_memory" if is_in_memory() else "mongodb_atlas"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
