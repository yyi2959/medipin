import React from "react";
import { useAlarm } from "../../context/AlarmContext";
import bearIcon from "../../assets/medipin_bear_icon.png"; // 이미지가 이동될 경로 가정
import "./style.css";

const AlarmOverlay = () => {
    const { isOverlayOpen, closeOverlay, schedules } = useAlarm();

    if (!isOverlayOpen) return null;

    return (
        <div className="alarm-overlay-container" onClick={closeOverlay}>
            <div className="alarm-overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className="alarm-list">
                    {schedules.length === 0 ? (
                        <div className="no-alarm">현재 예정된 알람이 없습니다.</div>
                    ) : (
                        schedules.map((item, index) => (
                            <div key={item.id || index} className="alarm-item">
                                <div className="bear-icon">
                                    <img src={bearIcon} alt="bear" />
                                </div>
                                <div className="alarm-info">
                                    <div className="alarm-title">MediPin</div>
                                    <div className="alarm-desc">{item.pill_name} 복용 시간입니다.</div>
                                </div>
                                <div className="alarm-time">{item.timing || "10 min"}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlarmOverlay;
