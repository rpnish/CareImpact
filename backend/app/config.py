import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from datetime import datetime, timezone

BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "Medicare Star Ratings & Gap-Closure Simulator"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    DB_NAME: str = os.getenv("DB_NAME", "medicare_star_ratings")
    DATA_CSV_PATH: str = os.getenv(
        "DATA_CSV_PATH", 
        str(WORKSPACE_DIR / "data" / "data.csv")
    )
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    # Measurement year window config (matches NCQA HEDIS MY2026 specifications)
    TODAY_STR: str = "2026-08-14"
    LOOKBACK_START_STR: str = "2025-08-14"
    FLU_LOOKBACK_STR: str = "2024-07-01"

settings = Settings()
