import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../api/config";
import bearIcon from "../../assets/medipin_bear_icon.png";
import "./style.css";

const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin} min`;
    if (diffHr < 24) return `${diffHr}h`;
    if (diffDay <= 7) return `${diffDay}day`;

    return `${past.getMonth() + 1}. ${past.getDate()}`;
};

const formatUnreadCount = (count) => {
    if (count >= 10) return "10+";
    return count > 0 ? count.toString() : "";
};

export const ChatHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            try {
                const response = await fetch(`${API_BASE_URL}/chatbot/history`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Error fetching chat history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // For the list view, we usually show conversation summaries.
    // Since we only have one "MediPIN" bot for now, we'll show its latest state
    // and some placeholders to match the user's requested UI layout.
    const displayHistory = history.length > 0 ? [
        {
            id: 1,
            name: "MediPin",
            message: history[0].message,
            time: formatTime(history[0].created_at),
            unread: history.filter(m => !m.is_read && m.sender === 'bot').length
        },
        { id: 2, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 3, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 4, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 5, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 6, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
    ] : [
        { id: 1, name: "MediPin", message: "Start a conversation with MediPin!", time: "now", unread: 0 },
        { id: 2, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 3, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 4, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
        { id: 5, name: "MediPin", message: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,", time: "10 min", unread: 2 },
    ];

    if (loading && history.length === 0) {
        return <div className="loading-history">Loading history...</div>;
    }

    return (
        <div className="history-container">
            <div className="history-list">
                {displayHistory.map((item) => (
                    <div key={item.id} className="history-item">
                        <div className="avatar-section">
                            <img src={bearIcon} alt="Avatar" className="bear-avatar" />
                        </div>
                        <div className="info-section">
                            <div className="info-top">
                                <div className="item-name">{item.name}</div>
                                <div className="item-time">{item.time}</div>
                            </div>
                            <div className="info-bottom">
                                <div className="item-message">{item.message}</div>
                                {item.unread > 0 && (
                                    <div className="unread-bubble">{formatUnreadCount(item.unread)}</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
