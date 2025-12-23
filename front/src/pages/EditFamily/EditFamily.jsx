
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../MyPage/style.css"; // Reuse MyPage styles
import { API_BASE_URL } from "../../api/config";

const EditFamily = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialData = location.state || {}; // Passed from MyPage

    const [formData, setFormData] = useState({
        name: "",
        birthdate: "",
        gender: "male",
        height: "",
        weight: "",
        special_note: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                birthdate: initialData.birth_date || "",
                gender: initialData.gender || "male",
                height: initialData.height || "",
                weight: initialData.weight || "",
                special_note: initialData.special_note || ""
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("authToken");

        // Calculate age roughly (Optional update?)
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
            const res = await fetch(`${API_BASE_URL}/user/family/${initialData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("가족 정보가 수정되었습니다.");
                navigate("/mypage");
            } else {
                const err = await res.json();
                alert("수정 실패: " + JSON.stringify(err));
            }
        } catch (error) {
            console.error("Edit family error:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("정말로 이 가족 구성원을 삭제하시겠습니까?")) return;

        const token = localStorage.getItem("authToken");
        try {
            const res = await fetch(`${API_BASE_URL}/user/family/${initialData.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("삭제되었습니다.");
                navigate("/mypage");
            } else {
                alert("삭제 실패");
            }
        } catch (error) {
            console.error("Delete family error:", error);
            alert("서버 오류가 발생했습니다.");
        }
    };

    if (!initialData.id) {
        return <div style={{ padding: 20 }}>잘못된 접근입니다.</div>;
    }

    return (
        <div className="my-page-container" style={{ backgroundColor: 'white' }}>
            <div className="mypage-header" style={{ backgroundColor: '#9F63FF' }}>
                <button onClick={() => navigate(-1)} className="back-btn">⬅</button>
                <div className="header-title">Edit Family</div>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="content-scrollable" style={{ marginTop: 0, paddingTop: 20 }}>
                <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
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

                    <div>
                        <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>특이사항 (알러지 등)</label>
                        <textarea
                            name="special_note"
                            value={formData.special_note}
                            onChange={handleChange}
                            rows={3}
                            placeholder="예: 페니실린 알러지 있음"
                            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8 }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            marginTop: 30,
                            backgroundColor: '#6C48F2',
                            color: 'white',
                            padding: 15,
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        수정하기
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        style={{
                            marginTop: 10,
                            backgroundColor: '#FFEBEE',
                            color: '#D32F2F',
                            padding: 15,
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        삭제하기
                    </button>
                    <div style={{ height: 100 }}></div>
                </form>
            </div>
        </div>
    );
};

export default EditFamily;
