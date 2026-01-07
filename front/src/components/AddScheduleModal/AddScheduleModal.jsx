import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { API_BASE_URL } from "../../api/config";
import { Warning } from "../Warning/Warning";
import { Button } from "../Button/Button";
import "./style.css";

const AddScheduleModal = ({ isOpen, onClose, defaultPillName }) => {
    const [formData, setFormData] = useState({
        pill_name: "",
        dose: "",
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        timing: "",
        memo: "",
    });

    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [warningType, setWarningType] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                pill_name: defaultPillName || ""
            }));
            fetchUsers();
        }
    }, [isOpen, defaultPillName]);

    const fetchUsers = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            // Fetch main profile and family members
            const [profileRes, familyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/user/family`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            let allUsers = [];
            if (profileRes.ok) {
                const mainUser = await profileRes.json();
                allUsers.push({ id: mainUser.id, name: mainUser.name + " (Me)" });
                setSelectedUserId(mainUser.id);
            }
            if (familyRes.ok) {
                const family = await familyRes.json();
                allUsers = [...allUsers, ...family.map(f => ({ id: f.id, name: f.name }))];
            }
            setUsers(allUsers);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWarningClose = () => {
        setWarningType(null);
        if (warningType === "medication-complete") {
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!formData.pill_name) {
            alert("약 이름은 필수입니다.");
            return;
        }

        if (!selectedUserId) {
            alert("사용자 정보가 로드되지 않았습니다. 잠시 후 다시 시도하거나 다시 로그인해주세요.");
            return;
        }

        setLoading(true);
        const payload = {
            user_id: selectedUserId,
            pill_name: formData.pill_name,
            dose: formData.dose,
            start_date: formData.start_date,
            end_date: formData.end_date,
            timing: formData.timing,
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
                setWarningType("medication-complete");
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
        <>
            {warningType && <Warning one={warningType} onClose={handleWarningClose} />}

            <div className="add-schedule-modal-overlay">
                <div className="add-schedule-modal">
                    <div className="modal-header">
                        <h3>Add Medication Schedule</h3>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="modal-content">
                        <div className="form-group">
                            <label>pill name</label>
                            <input name="pill_name" value={formData.pill_name} onChange={handleChange} placeholder="약 이름" />
                        </div>
                        <div className="form-group">
                            <label>Dose (1정 등)</label>
                            <input name="dose" value={formData.dose} onChange={handleChange} placeholder="예: 1정" />
                        </div>

                        <div className="form-group">
                            <label>Start date</label>
                            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>End date</label>
                            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label>timing (식후 30분 등)</label>
                            <input name="timing" value={formData.timing} onChange={handleChange} placeholder="예: 식후 30분" />
                        </div>
                        <div className="form-group">
                            <label>memo</label>
                            <textarea name="memo" value={formData.memo} onChange={handleChange} rows={3} placeholder="메모 입력"></textarea>
                        </div>

                        <div className="form-group">
                            <label>Select User</label>
                            <div className="user-select">
                                {users.map((u, index) => {
                                    const dotColorClass = ["purple", "green", "blue"][index % 3];
                                    return (
                                        <div
                                            key={u.id}
                                            className={`user-chip ${selectedUserId === u.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedUserId(u.id)}
                                        >
                                            <span className={`dot ${dotColorClass}`}></span> {u.name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? "Registering..." : "Register Pill"}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddScheduleModal;
