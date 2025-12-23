import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../MyPage/style.css"; // Reuse MyPage/EditMyPage styles
import { API_BASE_URL } from "../../api/config";

const AddFamily = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        birthdate: "",
        gender: "male",
        height: "",
        weight: "",
        special_note: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");

        // Calculate age roughly
        const birthDate = new Date(formData.birthdate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if (isNaN(age)) age = 0;

        const payload = {
            name: formData.name,
            age: age,
            birth_date: formData.birthdate,
            gender: formData.gender,
            height: formData.height ? parseFloat(formData.height) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            special_note: formData.special_note
        };

        try {
            const res = await fetch(`${API_BASE_URL}/user/family`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("가족 구성원이 추가되었습니다.");
                navigate("/mypage");
            } else {
                const err = await res.json();
                alert("오류 발생: " + JSON.stringify(err));
            }
        } catch (error) {
            console.error("Add family error:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    return (
        <div className="my-page-container" style={{ backgroundColor: 'white' }}>
            {/* Header reusing MyPage header style but with white bg override if needed or just use container */}
            <div className="mypage-header" style={{ backgroundColor: '#9F63FF' }}>
                <button onClick={() => navigate(-1)} className="back-btn">⬅</button>
                <div className="header-title">Add Family</div>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="content-scrollable" style={{ marginTop: 0, paddingTop: 20 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>이름</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>생년월일</label>
                        <input
                            type="date"
                            name="birthdate"
                            value={formData.birthdate}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>성별</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                        >
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>키 (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="Optional"
                                style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>몸무게 (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="Optional"
                                style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: 30,
                            backgroundColor: '#9F63FF',
                            color: 'white',
                            padding: 15,
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        등록하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddFamily;
