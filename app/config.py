from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os

# 현재 파일 위치 기준으로 최상위 루트의 .env 경로 계산
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, ".env")

load_dotenv(env_path)

class Settings(BaseSettings):
    APP_NAME: str
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_HOST: str
    MYSQL_PORT: str
    MYSQL_DB: str
    REDIS_URL: str
    DATABASE_URL: str
    
    # 🚨 여기에 GEMINI_API_KEY를 추가해야 시스템이 .env의 키를 읽어옵니다.
    GEMINI_API_KEY: str

    model_config = SettingsConfigDict(extra="ignore")

settings = Settings()