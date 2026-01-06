import pymysql
from app.config import settings

def update_database():
    print("Connecting to database...")
    try:
        conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            port=int(settings.MYSQL_PORT), # Convert to int
            database=settings.MYSQL_DB
        )
        cursor = conn.cursor()

        # 1. medication_schedule 테이블에 timing1~5 컬럼 추가
        print("Checking/Adding timing columns to medication_schedule...")
        for i in range(1, 6):
            col_name = f"timing{i}"
            try:
                cursor.execute(f"ALTER TABLE medication_schedule ADD COLUMN {col_name} VARCHAR(50);")
                print(f"Added column {col_name}")
            except pymysql.err.OperationalError as e:
                if e.args[0] == 1060: # Duplicate column name
                    print(f"Column {col_name} already exists.")
                else:
                    raise e

        # 2. alarms 테이블 생성
        print("Creating alarms table if not exists...")
        create_alarms_sql = """
        CREATE TABLE IF NOT EXISTS alarms (
            id INT AUTO_INCREMENT PRIMARY_KEY,
            user_id INT NOT NULL,
            schedule_id INT NOT NULL,
            alarm_time DATETIME NOT NULL,
            message VARCHAR(255),
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES medication_schedule(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_alarm_time (alarm_time)
        );
        """
        # Note: PRIMARY_KEY syntax error fix: PRIMARY KEY
        create_alarms_sql_fixed = """
        CREATE TABLE IF NOT EXISTS alarms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            schedule_id INT NOT NULL,
            alarm_time DATETIME NOT NULL,
            message VARCHAR(255),
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES medication_schedule(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_alarm_time (alarm_time)
        );
        """
        cursor.execute(create_alarms_sql_fixed)
        print("Alarms table check/creation done.")

        conn.commit()
        conn.close()
        print("Database update completed successfully.")

    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_database()
