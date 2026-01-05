// 🚨 모바일 테스트를 위한 최적의 설정
// 1. 프론트엔드를 ngrok(HTTPS)으로 접속했을 때, 
// 2. 백엔드(HTTP) 호출 시 발생하는 'Mixed Content' 차단 문제를 해결하기 위해
// 3. vite.config.js의 proxy 설정을 이용합니다.
// 이제 모든 요청은 프론트엔드 주소/api/... 로 전달되어 Vite가 백엔드로 넘겨줍니다.
export const API_BASE_URL = "/api"; 