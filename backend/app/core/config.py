from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "QR Smart API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # SQLite by default for development, ready for PostgreSQL in production (e.g. postgresql+psycopg2://user:pass@host/db)
    DATABASE_URL: str = "sqlite:///./qr_smart.db"
    
    # Supabase Cloud Storage Configuration
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "qr-files"

    @property
    def active_supabase_key(self) -> str:
        return (
            self.SUPABASE_SECRET_KEY
            or self.SUPABASE_SERVICE_ROLE_KEY
            or self.SUPABASE_KEY
            or ""
        ).strip()

    # CORS Origins
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        elif isinstance(v, list):
            return v
        return ["*"]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
