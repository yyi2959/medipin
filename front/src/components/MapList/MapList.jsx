import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 🚨 추가
import "./style.css";

const SHEET = {
    CLOSED: "CLOSED",
    MIN: "MIN",
    FULL: "FULL",
};

const MapList = ({ sheetState, setSheetState, places = [], selectedPlace, setSelectedPlace }) => {
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const [dragging, setDragging] = useState(false);
    const navigate = useNavigate(); // 🚨 추가

    /* 상태별 위치 계산 */
    const getTranslateY = () => {
        const vh = window.innerHeight;
        // 하단 네비게이션(약 80px) 고려
        if (sheetState === SHEET.CLOSED) return vh - 90; // 네비게이션 위로 살짝 올라온 상태 (핸들만 보임)
        if (sheetState === SHEET.MIN) return vh - 300; // 일부 보임
        if (sheetState === SHEET.FULL) return 100; // 거의 다 보임
        return vh;
    };

    /* 상태 변경 시 위치 반영 */
    useEffect(() => {
        if (!sheetRef.current) return;
        sheetRef.current.style.transform = `translate(-50%, ${getTranslateY()}px)`;
    }, [sheetState]);

    /* 드래그 시작 */
    const onStart = (e) => {
        setDragging(true);
        startY.current = e.touches ? e.touches[0].clientY : e.clientY;
    };

    /* 드래그 중 */
    const onMove = (e) => {
        if (!dragging) return;
        currentY.current = e.touches ? e.touches[0].clientY : e.clientY;
        const delta = currentY.current - startY.current;

        // 현재 기준 위치 + 델타
        sheetRef.current.style.transform =
            `translate(-50%, ${getTranslateY() + delta}px)`;
    };

    /* 드래그 종료 */
    const onEnd = () => {
        if (!dragging) return;
        setDragging(false);
        const delta = currentY.current - startY.current;

        // 위로 많이 드래그하면 FULL
        if (delta < -50) {
            if (sheetState === SHEET.CLOSED) setSheetState(SHEET.MIN);
            else setSheetState(SHEET.FULL);
        }
        // 아래로 많이 드래그하면 CLOSED/MIN
        else if (delta > 50) {
            if (sheetState === SHEET.FULL) setSheetState(SHEET.MIN);
            else setSheetState(SHEET.CLOSED);
        }
        else {
            // 원복
            sheetRef.current.style.transform = `translate(-50%, ${getTranslateY()}px)`;
        }
    };

    const handleCardClick = (place) => {
        // 상세 페이지 이동 대신, 내부 상태 변경으로 Detail View 전환
        setSelectedPlace(place);
        // 바텀시트가 닫혀있거나 최소화 상태면 올리기 (UX)
        if (sheetState === SHEET.CLOSED) setSheetState(SHEET.MIN);
    };

    const handleBackToList = () => {
        setSelectedPlace(null);
    };

    return (
        <div ref={sheetRef} className="map-list" style={{ transition: dragging ? 'none' : 'transform 0.3s ease-out' }}>
            {/* 드래그 핸들 */}
            <div
                className="handle"
                onMouseDown={onStart}
                onMouseMove={onMove}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={onStart}
                onTouchMove={onMove}
                onTouchEnd={onEnd}
            >
                <div className="handle-bar" />
            </div>

            {/* 리스트 컨텐츠 or 상세 컨텐츠 */}
            <div className="list-content">
                {selectedPlace ? (
                    // --- 상세 뷰 ---
                    <div className="detail-view">
                        <button className="back-btn" onClick={handleBackToList}>
                            &larr; 목록으로
                        </button>
                        <div className="detail-image-wrapper">
                            <img
                                src={selectedPlace.type === 'hospital'
                                    ? "https://postfiles.pstatic.net/MjAyNTEyMDlfODYg/MDAxNzY1MjU4NTgxMTE3.OR1zSpBxdcgRJ3VwdV_GHl9qojPdx9JQmyy2Bz-XQ8og.aSJDea3drP1B7zcwZc-V02F42kqp3XR9BR7liqI8h40g.PNG/hospital.png?type=w966"
                                    : selectedPlace.type === 'emergency'
                                        ? "/ambulance.svg"
                                        : selectedPlace.type === 'convenience'
                                            ? "https://postfiles.pstatic.net/MjAyNTEyMDlfMjUx/MDAxNzY1MjU4NTgxMTE3.Ruq6sQhusMsEEGY4E5bDbIDr5CdgsO3FM9urY0_iykwg.dm7HDIzMQOfLV3zzyl80gPdXdW54XNJWjDEVKuCg6_Qg.PNG/conveni.png?type=w966"
                                            : "https://postfiles.pstatic.net/MjAyNTEyMDlfMjY1/MDAxNzY1MjU4ODI0ODI4._p_9MD5vjkfIGL_iIUBCSVHhx5JTAG9wqhRkxrmuei0g.Mo5O6ZABPabGYjuAScmOmCcab_BYlKUwcf-SjEnWVk0g.PNG/pill-removebg-preview.png?type=w966"
                                }
                                alt={selectedPlace.name}
                                className="detail-image"
                            />
                        </div>
                        <div className="detail-info">
                            <h2 className="detail-name">{selectedPlace.name}</h2>
                            <span className="detail-badge">영업중</span>
                            <div className="detail-row">
                                <span className="label">주소</span>
                                <span>{selectedPlace.address}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">전화</span>
                                <span>{selectedPlace.tel || selectedPlace.phone || "정보 없음"}</span>
                            </div>
                            {selectedPlace.homepage && (
                                <div className="detail-row">
                                    <span className="label">홈페이지</span>
                                    <a href={selectedPlace.homepage} target="_blank" rel="noreferrer" style={{ color: '#9F63FF' }}>
                                        방문하기
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- 리스트 뷰 ---
                    places.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            검색 결과가 없습니다.
                        </div>
                    ) : (
                        places.map((place, index) => (
                            <div
                                key={index}
                                className="place-card"
                                onClick={() => handleCardClick(place)}
                            >
                                <div className="place-image-wrapper">
                                    <img
                                        src={place.type === 'hospital'
                                            ? "https://postfiles.pstatic.net/MjAyNTEyMDlfODYg/MDAxNzY1MjU4NTgxMTE3.OR1zSpBxdcgRJ3VwdV_GHl9qojPdx9JQmyy2Bz-XQ8og.aSJDea3drP1B7zcwZc-V02F42kqp3XR9BR7liqI8h40g.PNG/hospital.png?type=w966"
                                            : place.type === 'emergency'
                                                ? "/ambulance.svg"
                                                : place.type === 'convenience'
                                                    ? "https://postfiles.pstatic.net/MjAyNTEyMDlfMjUx/MDAxNzY1MjU4NTgxMTE3.Ruq6sQhusMsEEGY4E5bDbIDr5CdgsO3FM9urY0_iykwg.dm7HDIzMQOfLV3zzyl80gPdXdW54XNJWjDEVKuCg6_Qg.PNG/conveni.png?type=w966"
                                                    : "https://postfiles.pstatic.net/MjAyNTEyMDlfMjY1/MDAxNzY1MjU4ODI0ODI4._p_9MD5vjkfIGL_iIUBCSVHhx5JTAG9wqhRkxrmuei0g.Mo5O6ZABPabGYjuAScmOmCcab_BYlKUwcf-SjEnWVk0g.PNG/pill-removebg-preview.png?type=w966"
                                        }
                                        alt={place.name}
                                        className="place-image"
                                    />
                                </div>
                                <div className="place-info">
                                    <div className="place-header">
                                        <span className="place-name">{place.name}</span>
                                    </div>
                                    <div className="place-status active">영업중</div>
                                    <div className="place-address">{place.address}</div>
                                    <div className="place-phone">{place.tel || place.phone || "정보 없음"}</div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default MapList;
