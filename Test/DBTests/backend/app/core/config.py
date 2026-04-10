from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/LidercomTest0.1"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/LidercomTest0.1"
    
    class Config:
        env_file = ".env"


settings = Settings()
