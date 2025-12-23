import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import "./style.css"; // Reuse MyPage styles or create new

const EditMyPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        birthdate: "",
        gender: "male"
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
                    // 데이터 매핑 (API 응답 필드명 확인 필요)
                    setFormData({
                        name: data.name || "",
                        email: data.email || "",
                        phone_number: data.phone_number || "",
                        birthdate: data.birthdate || "",
                        gender: data.gender || "male"
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
        try {
            const res = await fetch(`${API_BASE_URL}/user/profile/detail`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("정보가 수정되었습니다.");
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="my-page-screen" style={{ overflowY: 'auto' }}>
            <div className="frame-3">
                <div className="group" onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
                    <div className="fill">⬅️</div>
                </div>
                <div className="my-page-2" style={{ fontWeight: 'bold' }}>내 정보 수정</div>
                <div style={{ width: 24 }}></div>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>

                <div>
                    <label>이메일 (변경 불가)</label>
                    <input
                        type="email"
                        value={formData.email}
                        disabled
                        style={{ width: '100%', padding: '10px', backgroundColor: '#f0f0f0' }}
                    />
                </div>

                <div>
                    <label>이름</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>

                <div>
                    <label>전화번호</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>

                <div>
                    <label>생년월일</label>
                    <input
                        type="date"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>

                <div>
                    <label>성별</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px' }}
                    >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                    </select>
                </div>

                <button
                    type="submit"
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#6C48F2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    저장하기
                </button>

            </form>
        </div>
    );
};

export default EditMyPage;
