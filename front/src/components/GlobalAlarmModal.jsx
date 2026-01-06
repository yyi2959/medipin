import React from 'react';
import { useAlarm } from '../context/AlarmContext';
import { useNavigate } from 'react-router-dom';

const GlobalAlarmModal = () => {
    const { activeAlarm, markAlarmAsRead } = useAlarm();
    const navigate = useNavigate();

    if (!activeAlarm) return null;

    const handleConfirm = async () => {
        // 알림 시간에서 날짜 추출 (YYYY-MM-DDTXXXX -> YYYY-MM-DD)
        const alarmDate = activeAlarm.alarm_time.split('T')[0];

        // 읽음 처리 후 이동
        await markAlarmAsRead(activeAlarm.id);

        // 쿼리 파라미터로 날짜 전달
        navigate(`/calendar?date=${alarmDate}`);
    };

    return (
        <div style={styles.overlay}>
            <div style={{ ...styles.modal, cursor: 'pointer' }} onClick={handleConfirm}>
                <h2 style={styles.title}>🔔 복약 알림</h2>
                <p style={styles.message}>{activeAlarm.message}</p>
                <div style={styles.timeInfo}>
                    {new Date(activeAlarm.alarm_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    (화면을 터치하면 이동합니다)
                </p>
            </div>
            <style>{`
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(3px)'
    },
    modal: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '20px',
        width: '85%',
        maxWidth: '340px',
        textAlign: 'center',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    },
    title: {
        margin: '0 0 10px 0',
        color: '#333',
        fontSize: '20px',
        fontWeight: 'bold'
    },
    message: {
        fontSize: '16px',
        color: '#555',
        marginBottom: '10px',
        lineHeight: '1.4'
    },
    timeInfo: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#9F63FF',
        marginBottom: '20px'
    },
    button: {
        backgroundColor: '#9F63FF',
        color: 'white',
        border: 'none',
        padding: '14px 20px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        boxShadow: '0 4px 10px rgba(159, 99, 255, 0.3)'
    }
};

export default GlobalAlarmModal;
