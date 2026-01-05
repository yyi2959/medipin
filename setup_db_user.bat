@echo off
chcp 65001
echo ========================================================
echo [MEDIPIN] 로컬 DB 사용자(user1) 생성 스크립트
echo ========================================================
echo.
echo 로컬 MySQL(127.0.0.1)에 'medipin' DB와 'user1' 계정을 생성합니다.
echo 실행 시 MySQL 'root' 계정의 비밀번호를 입력해야 할 수 있습니다.
echo (비밀번호가 없다면 그냥 Enter를 누르세요)
echo.

mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS medipin; CREATE USER IF NOT EXISTS 'user1'@'localhost' IDENTIFIED BY '123'; GRANT ALL PRIVILEGES ON medipin.* TO 'user1'@'localhost'; FLUSH PRIVILEGES;"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 생성 실패! MySQL이 설치되어 있지 않거나, root 비밀번호가 틀렸습니다.
    echo 혹은 MySQL 서버가 켜져 있는지 확인해주세요.
) else (
    echo.
    echo [SUCCESS] 'user1' 사용자 생성 및 권한 부여 완료!
)
echo.
pause
