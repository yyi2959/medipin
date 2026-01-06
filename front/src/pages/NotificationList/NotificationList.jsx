import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import bearIcon from "../../assets/medipin_bear_icon.png";
import { API_BASE_URL } from "../../api/config";
import "./style.css";

// Reusing styles from AlarmOverlay style.css if possible, or create a new one.
// The user wants a page, so it should have a header and a list.

const NotificationList = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const storedUserId = localStorage.getItem("userId");
    const USER_ID = storedUserId ? parseInt(storedUserId) : 1;

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            // 알림 히스토리 API 호출
            const res = await fetch(`${API_BASE_URL}/alarms/history?user_id=${USER_ID}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Header for the page
    const BackIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const getTimeAgo = (item) => {
        if (item.alarm_time) {
            return formatDistanceToNow(new Date(item.alarm_time), { addSuffix: true });
        }
        return "";
    };

    const handleItemClick = (item) => {
        if (!item.alarm_time) return;
        const dateStr = item.alarm_time.split('T')[0];
        navigate(`/calendar?date=${dateStr}`);
    };

    return (
        <div className="notification-page">
            <div className="notification-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <BackIcon />
                </button>
                <div className="header-title">Notification List</div>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="notification-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="no-data">No notifications found.</div>
                ) : (
                    <div className="noti-list">
                        {notifications.map((item, index) => {
                            const isCompleted = item.is_taken || item.is_read;
                            return (
                                <div
                                    key={item.id || index}
                                    className={`noti-item ${isCompleted ? 'completed' : ''}`}
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="bear-icon">
                                        <img src={bearIcon} alt="bear" style={{ filter: isCompleted ? 'grayscale(100%)' : 'none' }} />
                                    </div>
                                    <div className="noti-info">
                                        <div className="noti-title">MediPin</div>
                                        <div className="noti-desc">
                                            {item.pill_name ? `${item.pill_name} 복용 시간입니다.` : item.message}
                                            <br />
                                            <span style={{ fontSize: '11px', color: isCompleted ? '#aaa' : '#9F63FF' }}>
                                                {isCompleted ? "확인 완료" : "미복용"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="noti-time">
                                        {getTimeAgo(item)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationList;
