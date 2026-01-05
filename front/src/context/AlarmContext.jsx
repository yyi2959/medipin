import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../api/config";

const AlarmContext = createContext();

export const useAlarm = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }) => {
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleOverlay = () => setIsOverlayOpen(prev => !prev);
    const closeOverlay = () => setIsOverlayOpen(false);

    const fetchTodaySchedules = useCallback(async () => {
        const token = localStorage.getItem("authToken");
        const storedUserId = localStorage.getItem("userId");
        const USER_ID = storedUserId ? parseInt(storedUserId) : 1;

        if (!token) return;

        setLoading(true);
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const dayStr = now.toISOString().split('T')[0];

            const res = await fetch(`${API_BASE_URL}/medication/schedule?user_id=${USER_ID}&year=${year}&month=${month}`);
            if (res.ok) {
                const data = await res.json();
                // 오늘 날짜에 해당하는 일정만 필터링
                const todayData = data.filter(s => s.start_date <= dayStr && s.end_date >= dayStr);
                // 시간순 정렬 (timing 정보가 있다고 가정)
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
        // 5분마다 갱신
        const interval = setInterval(fetchTodaySchedules, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchTodaySchedules]);

    return (
        <AlarmContext.Provider value={{ isOverlayOpen, toggleOverlay, closeOverlay, schedules, loading, refreshSchedules: fetchTodaySchedules }}>
            {children}
        </AlarmContext.Provider>
    );
};
