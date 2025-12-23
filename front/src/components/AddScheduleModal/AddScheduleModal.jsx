import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { API_BASE_URL } from "../../api/config";
import "./style.css";

const AddScheduleModal = ({ isOpen, onClose, defaultPillName }) => {
    const [formData, setFormData] = useState({
        pill_name: "",
        dose: "",
        start_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: "",
        end_time: "",
        timing: "",
        memo: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && defaultPillName) {
            setFormData(prev => ({ ...prev, pill_name: defaultPillName }));
        }
    }, [isOpen, defaultPillName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.pill_name) {
            alert("약 이름은 필수입니다.");
            return;
        }

        setLoading(true);
        const storedUserId = localStorage.getItem("userId");
        const USER_ID = storedUserId ? parseInt(storedUserId) : 1;

        let timingStr = formData.timing;
        if (formData.start_time && formData.end_time) {
            timingStr = `${formData.start_time}-${formData.end_time}`;
        } else if (formData.start_time) {
            timingStr = formData.start_time;
        }

        const payload = {
            user_id: USER_ID,
            pill_name: formData.pill_name,
            dose: formData.dose,
            start_date: formData.start_date,
            end_date: formData.start_date, // 하루 기준
            timing: timingStr,
            meal_relation: null,
            memo: formData.memo,
            notify: true,
            is_taken: false,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/medication/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("복약 일정이 등록되었습니다!");
                onClose();
            } else {
                const err = await res.json();
                alert(`등록 실패: ${err.detail || "오류가 발생했습니다."}`);
            }
        } catch (error) {
            console.error(error);
            alert("서버 통신 오류");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="add-schedule-modal-overlay">
            <div className="add-schedule-modal">
                <div className="modal-header">
                    <h3>복약 일정 등록</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <div className="form-group">
                        <label>약 이름</label>
                        <input name="pill_name" value={formData.pill_name} onChange={handleChange} placeholder="약 이름" />
                    </div>
                    <div className="form-group">
                        <label>용량 (1정 등)</label>
                        <input name="dose" value={formData.dose} onChange={handleChange} placeholder="예: 1정" />
                    </div>
                    <div className="form-group">
                        <label>날짜</label>
                        <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
                    </div>
                    <div className="row-group">
                        <div className="form-group half">
                            <label>시작 시간</label>
                            <input type="time" name="start_time" value={formData.start_time} onChange={handleChange} />
                        </div>
                        <div className="form-group half">
                            <label>종료 시간</label>
                            <input type="time" name="end_time" value={formData.end_time} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>복용 타이밍 (식후 30분 등)</label>
                        <input name="timing" value={formData.timing} onChange={handleChange} placeholder="예: 식후 30분" />
                    </div>
                    <div className="form-group">
                        <label>메모</label>
                        <textarea name="memo" value={formData.memo} onChange={handleChange} rows={3} placeholder="메모 입력"></textarea>
                    </div>

                    <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                        {loading ? "등록 중..." : "등록하기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddScheduleModal;
