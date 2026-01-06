import React, { useState } from "react";
import { useAlarm } from "../../context/AlarmContext";
import { formatDistanceToNow } from "date-fns";
import bearIcon from "../../assets/medipin_bear_icon.png";
import "./style.css";

const AlarmOverlay = () => {
    const { isOverlayOpen, closeOverlay, schedules } = useAlarm();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isOverlayOpen) return null;

    // 표시할 리스트 계산 (기본 10개, 확장 시 전체)
    const displaySchedules = isExpanded ? schedules : schedules.slice(0, 10);

    const getTimeAgo = (item) => {
        // created_at이 있으면 등록된 시간 기준 경과 시간 계산
        if (item.created_at) {
            return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
        }
        // 없으면 start_date라도 활용하거나, 기존 timing 유지
        // fallback: 기존 timing이 있으면 보여주고, 아니면 기본값 대신 빈 문자열
        return item.timing || "";
    };

    return (
        <div className="alarm-overlay-container" onClick={closeOverlay}>
            <div className="alarm-overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className="alarm-list">
                    {schedules.length === 0 ? (
                        <div className="no-alarm">현재 예정된 알람이 없습니다.</div>
                    ) : (
                        <>
                            {displaySchedules.map((item, index) => (
                                <div key={item.id || index} className="alarm-item">
                                    <div className="bear-icon">
                                        <img src={bearIcon} alt="bear" />
                                    </div>
                                    <div className="alarm-info">
                                        <div className="alarm-title">MediPin</div>
                                        <div className="alarm-desc">{item.pill_name} 복용 시간입니다.</div>
                                    </div>
                                    <div className="alarm-time">
                                        {getTimeAgo(item)}
                                    </div>
                                </div>
                            ))}

                            {/* View All 버튼: 10개 이상이고 아직 확장 안 했을 때 */}
                            {schedules.length > 10 && !isExpanded && (
                                <button
                                    className="view-all-btn"
                                    onClick={() => setIsExpanded(true)}
                                >
                                    View All
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlarmOverlay;
