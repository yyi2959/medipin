from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    MYSQL_USER: str
    MYSQL_PASSWORD: str
    MYSQL_HOST: str
    MYSQL_PORT: str
    MYSQL_DB: str
    REDIS_URL: str
    DATABASE_URL: str

    # @property
    # def DATABASE_URL(self):
    #     return f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
