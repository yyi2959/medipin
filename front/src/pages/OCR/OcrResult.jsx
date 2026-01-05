import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import { getAccessToken } from "../../auth/token";
import "./style.css";

const OcrResult = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 🚨 1. 안전한 데이터 참조 적용 (Optional Chaining)
    const ocrData = location.state?.ocrData;

    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(false);

    // 🗓️ 날짜 상태 추가
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");

    // 🚨 0. 페이지 진입 시 인증 상태 체크
    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
            navigate("/login");
        }
    }, [navigate]);

    // 🚨 2. 페이지 진입 시 데이터 확인 및 안전한 초기화
    useEffect(() => {
        console.log("OCR Result Page Loaded. State Data:", location.state);

        if (ocrData) {
            let items = [];

            // 🚨 3. 깊은 참조 시 Optional Chaining 적용 및 타입 체크
            try {
                if (ocrData?.parsed_prescription?.medicines) {
                    items = ocrData.parsed_prescription.medicines;
                } else if (Array.isArray(ocrData?.parsed_medication)) {
                    items = ocrData.parsed_medication;
                } else if (Array.isArray(ocrData?.schedule)) {
                    items = ocrData.schedule;
                }
            } catch (err) {
                console.error("데이터 파싱 중 오류 발생:", err);
                items = [];
            }

            if (Array.isArray(items)) {
                const normalized = items.map(m => ({
                    name: m?.name || m?.pill_name || "",
                    dose: m?.dose || m?.once_dose || "",
                    timing: m?.timing || "",
                    meal: m?.meal_relation || "",
                    days: m?.days || ocrData?.days || 3 // 추출된 '일분' 정보 활용
                }));
                setMedicines(normalized);

                // 종료일 자동 계산 (가장 긴 복용 기간 기준)
                const maxDays = Math.max(...normalized.map(m => m.days));
                const end = new Date();
                end.setDate(end.getDate() + (maxDays > 0 ? maxDays - 1 : 2));
                setEndDate(end.toISOString().split("T")[0]);
            }
        }
    }, [location.state, ocrData]);

    const handleCheckEfficacy = (name) => {
        if (!name) return;
        navigate(`/search/detail/${name}`);
    };

    const handleRegisterSchedule = async () => {
        const token = getAccessToken();
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);

            // 🚨 1. 토큰에서 user_id 추출 (안전하게)
            let userId = null;
            try {
                // localStorage에 저장된 ID가 있는지 먼저 확인
                const storedId = localStorage.getItem("userId");
                if (storedId) {
                    userId = parseInt(storedId);
                } else {
                    // 토큰 디코딩 시도
                    const base64Url = token.split(".")[1];
                    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                    const payload = JSON.parse(window.atob(base64));
                    userId = parseInt(payload.id || payload.sub); // id 필드 우선, 없으면 sub
                }
            } catch (e) {
                console.error("Token decoding failed:", e);
            }

            if (!userId || isNaN(userId)) {
                alert("사용자 정보를 확인할 수 없습니다. 다시 로그인해 주세요.");
                // navigate("/login"); // 🚨 즉시 튕기지 않고 알림만 우선
                setLoading(false);
                return;
            }

            // 🚨 4. 빈 배열(Map) 및 각 항목 유효성 체크
            if (!Array.isArray(medicines) || medicines.length === 0) {
                alert("등록할 약 정보가 없습니다.");
                return;
            }

            const failedItems = [];
            const results = await Promise.all(medicines.map(async (m, index) => {
                // 필수 데이터 누락 시 기본값 부여 또는 스킵
                if (!m.name) {
                    failedItems.push(`항목 ${index + 1}: 약 이름 누락`);
                    return { ok: false, name: "이름 없음" };
                }

                try {
                    const res = await fetch(`${API_BASE_URL}/medication/schedule`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            user_id: userId,
                            pill_name: m.name,
                            dose: m.dose || "1정", // 기본값
                            timing: m.timing || "아침", // 기본값
                            meal_relation: m.meal || "식후 30분", // 기본값
                            start_date: startDate, // 사용자가 선택한 시작일
                            end_date: endDate,     // 사용자가 선택한 종료일
                            notify: true
                        })
                    });

                    if (!res.ok) {
                        const errorData = await res.json();
                        console.error(`Registration failed for ${m.name}:`, errorData);
                        failedItems.push(`${m.name}: ${res.statusText}`);
                    }
                    return res;
                } catch (err) {
                    failedItems.push(`${m.name}: 네트워크 오류`);
                    return { ok: false };
                }
            }));

            if (results.every(r => r.ok)) {
                alert("모든 약이 내 일정에 등록되었습니다.");
                navigate("/calendar");
            } else {
                alert(`일부 약 등록에 실패했습니다:\n${failedItems.join("\n")}`);
            }
        } catch (err) {
            console.error(err);
            alert("일정 등록 중 오류가 발생했습니다. 토큰 정보를 확인해 주세요.");
        } finally {
            setLoading(false);
        }
    };

    const loadExampleData = () => {
        const example = [
            { name: "타이레놀정 500mg", dose: "1정", timing: "아침/점심/저녁", meal: "식후 30분" },
            { name: "아모크라정", dose: "1정", timing: "아침/저녁", meal: "식후 30분" },
            { name: "메디핀시럽", dose: "5ml", timing: "취침전", meal: "공복" }
        ];
        setMedicines(example);
    };

    const isEmpty = !Array.isArray(medicines) || medicines.length === 0;

    return (
        <div className="ocr-result-container">
            <div className="ocr-result-header">
                <h2>분석 결과 확인</h2>
                {isEmpty ? (
                    <p className="warning-text">인식된 정보가 없습니다. 아래 버튼으로 추가하거나 예시 데이터를 불러와보세요.</p>
                ) : (
                    <p>자동 추출된 정보입니다. 틀린 내용이 있다면 수정해주세요.</p>
                )}
            </div>

            <div className="medicine-list">
                {!isEmpty ? (
                    medicines.map((m, idx) => (
                        <div key={idx} className="medicine-card">
                            <div className="card-top">
                                <input
                                    className="pill-name-input"
                                    value={m?.name || ""}
                                    onChange={(e) => {
                                        const newMeds = [...medicines];
                                        newMeds[idx].name = e.target.value;
                                        setMedicines(newMeds);
                                    }}
                                    placeholder="약 이름 입력"
                                />
                                <button className="check-btn" onClick={() => handleCheckEfficacy(m?.name)}>
                                    정보 확인
                                </button>
                                <button className="remove-btn" onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))}>
                                    ✕
                                </button>
                            </div>
                            <div className="card-bottom">
                                <div className="info-group">
                                    <span>용량</span>
                                    <input
                                        value={m?.dose || ""}
                                        onChange={(e) => {
                                            const newMeds = [...medicines];
                                            newMeds[idx].dose = e.target.value;
                                            setMedicines(newMeds);
                                        }}
                                        placeholder="예: 1정"
                                    />
                                </div>
                                <div className="info-group">
                                    <span>시간</span>
                                    <input
                                        value={m?.timing || ""}
                                        onChange={(e) => {
                                            const newMeds = [...medicines];
                                            newMeds[idx].timing = e.target.value;
                                            setMedicines(newMeds);
                                        }}
                                        placeholder="예: 아침"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-placeholder">
                        <div className="icon">📄🔍</div>
                        <p>추출된 약 정보가 비어있습니다.</p>
                        <button className="example-btn" onClick={loadExampleData}>시연용 예시 데이터 불러오기</button>
                    </div>
                )}
            </div>

            {/* 🗓️ 복용 기간 선택 섹션 추가 */}
            {!isEmpty && (
                <div className="date-selection-section">
                    <div className="section-title">📅 복용 기간 설정</div>
                    <div className="date-input-row">
                        <div className="date-group">
                            <label>시작일</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="date-arrow">→</div>
                        <div className="date-group">
                            <label>종료일</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="action-footer">
                <button className="add-manual-btn" onClick={() => setMedicines([...medicines, { name: "", dose: "", timing: "", meal: "" }])}>
                    + 약 직접 추가하기
                </button>
                <div className="footer-btns">
                    <button className="back-btn" onClick={() => navigate(-1)}>다시 찍기</button>
                    <button
                        className="save-btn"
                        onClick={handleRegisterSchedule}
                        disabled={loading || medicines.length === 0}
                    >
                        {loading ? "등록 중..." : "내 일정에 등록하기"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OcrResult;
