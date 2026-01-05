
import pymysql
import sys

candidates = [
    ("user1", "123"),
    ("root", ""),
    ("root", "1234"),
    ("root", "root"),
    ("root", "123456"),
    ("root", "password"),
    ("medipin", "medipin"),
]

print("Testing DB connections to 127.0.0.1:3306...")

for user, pwd in candidates:
    try:
        conn = pymysql.connect(
            host="127.0.0.1",
            user=user,
            password=pwd,
            database="medipin",
            connect_timeout=2
        )
        print(f"SUCCESS: Connected with user='{user}', password='{pwd}'")
        conn.close()
        sys.exit(0) # Found one!
    except pymysql.err.OperationalError as e:
        code, msg = e.args
        # 1045 = Access denied, 1049 = Unknown database (auth worked, db missing)
        if code == 1049:
             print(f"SUCCESS (Auth OK, DB Missing): Connected with user='{user}', password='{pwd}', but DB 'medipin' not found.")
             sys.exit(0)
        print(f"FAILED: user='{user}', password='{pwd}' -> {msg}")
    except Exception as e:
        print(f"FAILED: user='{user}', password='{pwd}' -> {e}")

print("All candidates failed.")
sys.exit(1)
