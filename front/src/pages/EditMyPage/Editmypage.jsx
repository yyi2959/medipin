import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import { useAlarm } from "../../context/AlarmContext";
import "./style.css";

const EditMyPage = () => {
    const navigate = useNavigate();
    const { toggleOverlay } = useAlarm();

    // Icons
    const BackIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18L9 12L15 6" />
        </svg>
    );

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        birthdate: "",
        gender: "male",
        height: "",
        weight: "",
        special_note: ""
    });
    const [loading, setLoading] = useState(true);

    // 1. 프로필 조회
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                alert("로그인이 필요합니다.");
                navigate("/login");
                return;
            }
            try {
                const res = await fetch(`${API_BASE_URL}/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.name || "",
                        email: data.email || "",
                        phone_number: data.phone_num || "", // API key check
                        birthdate: data.birth_date || "", // API key check
                        gender: data.gender || "male",
                        height: data.height || "",
                        weight: data.weight || "",
                        special_note: data.special_note || ""
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    // 2. 변경 사항 전송
    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");

        // Format dates or numbers if necessary
        const payload = {
            ...formData,
            // Convert to numbers if strings are present
            height: formData.height ? parseFloat(formData.height) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
        };

        try {
            const res = await fetch(`${API_BASE_URL}/user/profile/detail`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("수정되었습니다.");
                navigate("/mypage");
            } else {
                const errData = await res.json();
                alert(`수정 실패: ${errData.detail}`);
            }
        } catch (err) {
            alert("서버 오류가 발생했습니다.");
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    if (loading) return <div className="edit-mypage-container"></div>;

    return (
        <div className="edit-mypage-container">
            {/* Header */}
            <div className="mypage-header">
                <div style={{ width: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button onClick={() => navigate(-1)} className="mypage-back-btn">
                        <BackIcon />
                    </button>
                </div>
                <div className="header-title">My page</div>
                <div className="icon-wrapper" onClick={toggleOverlay}>
                    <div className="icon-alarm" />
                </div>
            </div>

            <div className="content-scrollable">
                <form onSubmit={handleSubmit}>

                    {/* Read Only Email */}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            disabled
                        />
                    </div>

                    {/* Name */}
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label>Phone Number</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            placeholder="010-0000-0000"
                        />
                    </div>

                    {/* Birthdate & Gender */}
                    <div className="row-group">
                        <div className="form-group half">
                            <label>Birthdate</label>
                            <input
                                type="date"
                                name="birthdate"
                                value={formData.birthdate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group" style={{ width: '120px' }}>
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    {/* Height & Weight */}
                    <div className="row-group">
                        <div className="form-group half">
                            <label>Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="cm"
                            />
                        </div>

                        <div className="form-group half">
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="kg"
                            />
                        </div>
                    </div>

                    {/* Special Note */}
                    <div className="form-group">
                        <label>Special Note (Allergies, etc)</label>
                        <textarea
                            name="special_note"
                            value={formData.special_note}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter any special notes..."
                        />
                    </div>

                    <button type="submit" className="save-btn">
                        Save
                    </button>

                </form>
            </div>
        </div>
    );
};

export default EditMyPage;
