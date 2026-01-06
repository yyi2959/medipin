import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../api/config";

const AlarmContext = createContext();

export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🔔 실시간 알림 상태
    const [activeAlarm, setActiveAlarm] = useState(null);

    const toggleOverlay = () => setIsOverlayOpen(prev => !prev);
    const closeOverlay = () => setIsOverlayOpen(false);

    // 알림 권한 요청
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    // 서버에서 읽지 않은 알림 확인
    const checkPendingAlarms = useCallback(async () => {
        const storedUserId = localStorage.getItem("userId");
        if (!storedUserId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/alarms/pending?user_id=${storedUserId}`, {
                headers: { "Accept": "application/json" }
            });
            if (res.ok) {
                const alarms = await res.json();
                if (alarms.length > 0) {
                    const latestAlarm = alarms[0]; // 가장 먼저 온 알림
                    setActiveAlarm(latestAlarm);

                    // 웹 푸시 알림
                    if ("Notification" in window && Notification.permission === "granted") {
                        try {
                            const notif = new Notification("Medipin 알림", {
                                body: latestAlarm.message,
                                icon: "/icon-192.png", // 아이콘 경로 확인 필요 (public/icon-192.png 가정)
                                tag: `alarm-${latestAlarm.id}` // 중복 알림 방지
                            });
                            notif.onclick = () => {
                                window.focus();
                                notif.close();
                            };
                        } catch (e) { console.error("Notification Error:", e); }
                    }
                }
            }
        } catch (error) {
            console.error("Error checking pending alarms:", error);
        }
    }, []);

    const markAlarmAsRead = async (alarmId) => {
        try {
            await fetch(`${API_BASE_URL}/alarms/${alarmId}/read`, {
                method: "POST"
            });
            setActiveAlarm(null); // 팝업 닫기
            // 필요하다면 리스트 갱신
        } catch (error) {
            console.error("Error marking alarm as read:", error);
        }
    };

    const fetchTodaySchedules = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        const storedUserId = localStorage.getItem("userId");
        const USER_ID = storedUserId ? parseInt(storedUserId) : 1;

        if (!token) return;

        setLoading(true);
        try {
            const now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth() + 1;
            const dayStr = now.toISOString().split('T')[0];

            if (!year || isNaN(year) || !month || isNaN(month)) {
                console.warn("Invalid date in AlarmContext, resetting to now");
                const safeNow = new Date();
                year = safeNow.getFullYear();
                month = safeNow.getMonth() + 1;
            }

            const res = await fetch(`${API_BASE_URL}/medication/schedule?user_id=${USER_ID}&year=${year}&month=${month}`, {
                headers: {
                    "Accept": "application/json"
                }
            });
            if (res.ok) {
                const data = await res.json();
                // 오늘 날짜에 해당하는 일정만 필터링
                const todayData = data.filter(s => s.start_date <= dayStr && s.end_date >= dayStr);
                // 시간순 정렬
                todayData.sort((a, b) => (a.timing || "").localeCompare(b.timing || ""));
                setSchedules(todayData);
            }
        } catch (error) {
            console.error("Error fetching alarm schedules:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTodaySchedules();
        checkPendingAlarms();

        // 1분마다 알림 체크
        const alarmInterval = setInterval(checkPendingAlarms, 60 * 1000);
        // 5분마다 스케줄 갱신
        const scheduleInterval = setInterval(fetchTodaySchedules, 5 * 60 * 1000);

        return () => {
            clearInterval(alarmInterval);
            clearInterval(scheduleInterval);
        };
    }, [fetchTodaySchedules, checkPendingAlarms]);

    return (
        <AlarmContext.Provider value={{
            isOverlayOpen, toggleOverlay, closeOverlay,
            schedules, loading, refreshSchedules: fetchTodaySchedules,
            activeAlarm, markAlarmAsRead
        }}>
            {children}
            {/* Context 내부에서 렌더링하지 않고, 데이터를 Provide만 함. 
                App.jsx나 상위 컴포넌트에서 GlobalAlarmModal을 렌더링해야 함. */}
        </AlarmContext.Provider>
    );
};
