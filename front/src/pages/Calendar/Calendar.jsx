import React, { useState, useEffect, useRef } from "react";
import { useAlarm } from "../../context/AlarmContext";
import AlarmOverlay from "../../components/AlarmOverlay/AlarmOverlay";
import { useLocation, useNavigate } from "react-router-dom"; // ✅ useNavigate 추가
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, parseISO } from "date-fns";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import { API_BASE_URL } from "../../api/config";
/* 아이콘들 */
import preIcon from "../Search_detail/pre_icon.svg";
import "./style.css";

const Calendar = () => {
    const navigate = useNavigate(); // ✅ navigate 훅 추가
    const { toggleOverlay } = useAlarm();
    // 날짜 상태
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 데이터 상태
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

    // 모드 상태
    const [isAddMode, setIsAddMode] = useState(false);

    // 드래그 관련 상태 (List Sheet)
    const [sheetHeight, setSheetHeight] = useState(0); // vh 단위 - 초기값 0으로 설정
    const listSheetRef = useRef(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(0);

    // 드래그 관련 상태 (Add Sheet)
    const [addSheetHeight, setAddSheetHeight] = useState(0);
    const addSheetRef = useRef(null);
    const addDragStartY = useRef(0);
    const addDragStartHeight = useRef(0);
    const isAddDragging = useRef(false);

    // 상세 시트 상태
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [detailSheetHeight, setDetailSheetHeight] = useState(0);

    // 수정 모드 상태
    const [editId, setEditId] = useState(null);

    // 폼 상태
    const [formData, setFormData] = useState({
        pill_name: "",
        dose: "",
        start_date: "",
        end_date: "",
        timing: "",
        memo: "",
    });

    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const API_URL = `${API_BASE_URL}/medication`;
    // const USER_ID = 1; 
    const storedUserId = localStorage.getItem("userId");
    const USER_ID = storedUserId ? parseInt(storedUserId) : 1; // Fallback or handle error

    // --- 데이터 패칭 ---
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            fetchSchedules();
        }
    }, [currentMonth, users]);

    const fetchUsers = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
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
                if (!selectedUserId) setSelectedUserId(mainUser.id);
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

    const location = useLocation(); // ✅ Hook 사용

    // 검색 페이지에서 넘어왔을 때 자동 실행
    useEffect(() => {
        if (location.state?.addPillName) {
            setTimeout(() => {
                openAddSheet({ pill_name: location.state.addPillName });
            }, 100);
        }

        // 초기 로딩 시에는 시트를 숨김 (사용자가 날짜를 클릭할 때만 표시)
        // 초기 로딩 시 오늘 데이터에 맞춰 시트 높이 설정 - 제거됨
    }, [location.state]);

    const fetchSchedules = async () => {
        if (users.length === 0) return;
        setLoading(true);
        try {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth() + 1;

            // users 배열에 있는 모든 유저(본인+가족)에 대해 스케줄 요청
            const promises = users.map(u =>
                fetch(`${API_URL}/schedule?user_id=${u.id}&year=${year}&month=${month}`)
                    .then(res => res.json())
            );

            const results = await Promise.all(promises);
            // results는 배열의 배열이므로 flatten
            const allSchedules = results.flat();
            setSchedules(allSchedules);
        } catch (error) {
            console.error("Error fetching schedules:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 이벤트 핸들러 ---

    const handleDateClick = (e, day) => {
        e.stopPropagation(); // 배경 클릭 이벤트 전파 방지
        setSelectedDate(day);

        // 날짜에 해당하는 일정 개수 확인
        const dayStr = format(day, 'yyyy-MM-dd');
        const countOnDay = schedules.filter(s => s.start_date <= dayStr && s.end_date >= dayStr).length;

        // [규격화] 2개 이하일 때는 30vh 고정 (리스트1의 기본 크기)
        // 3개부터는 약이 전부 보이도록 비례 확장 (최대 85vh)
        const expandedHeight = Math.min(85, Math.max(30, 8 + (countOnDay * 10)));
        setSheetHeight(expandedHeight);

        // 폼 초기화 (선택된 날짜로)
        setFormData(prev => ({
            ...prev,
            start_date: format(day, 'yyyy-MM-dd')
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.pill_name) {
            alert("Pill name is required");
            return;
        }

        // Schema: user_id, pill_name, dose, date, ...
        // UI Start time / End time -> timing 필드에 병합 저장 (예: "10:00-12:00")
        // 또는 start_date/end_date는 기간(Date)일 수 있음. 여기서는 date(하루) 기준이므로
        // UI의 Start/End time은 시간 문자열로 간주하여 timing이나 memo에 넣거나,
        // user schema의 timing에 넣는 것이 적절해 보임.
        // *User Schema*: timing (String).

        let timingStr = formData.timing;
        if (formData.start_time && formData.end_time) {
            timingStr = `${formData.start_time}-${formData.end_time}`;
        } else if (formData.start_time) {
            timingStr = formData.start_time;
        }

        const payload = {
            user_id: selectedUserId,
            pill_name: formData.pill_name,
            dose: formData.dose,
            start_date: formData.start_date || format(selectedDate, 'yyyy-MM-dd'),
            end_date: formData.end_date || formData.start_date || format(selectedDate, 'yyyy-MM-dd'),
            timing: formData.timing,
            meal_relation: null,
            memo: formData.memo,
            notify: true,
            is_taken: false, // 기본값
        };

        try {
            let res;
            if (editId) {
                // 수정 (PATCH)
                res = await fetch(`${API_URL}/schedule/${editId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } else {
                // 생성 (POST)
                res = await fetch(`${API_URL}/schedule`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                alert(editId ? "Event Updated!" : "Event Created!");
                closeAddSheet();
                fetchSchedules(); // 리스트 갱신
            } else {
                const errorData = await res.json();
                alert(`Failed to save event: ${errorData.detail || res.statusText}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error saving event: ${err.message}`);
        }
    };

    // --- 상세 시트 핸들러 ---
    const openDetailSheet = (event) => {
        setSelectedEvent(event);
        setDetailSheetOpen(true);
        setDetailSheetHeight(40); // 40vh 정도
    };

    const closeDetailSheet = () => {
        setDetailSheetOpen(false);
        setDetailSheetHeight(0);
        setTimeout(() => setSelectedEvent(null), 300);
    };

    // 복용 완료 토글
    const handleToggleTaken = async () => {
        if (!selectedEvent) return;
        try {
            const newStatus = !selectedEvent.is_taken;
            const res = await fetch(`${API_URL}/schedule/${selectedEvent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_taken: newStatus })
            });
            if (res.ok) {
                // 로컬 상태 업데이트 (리스트 즉시 반영을 위해)
                const updated = await res.json();
                setSelectedEvent(updated);
                fetchSchedules();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update status");
        }
    };

    // 삭제
    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (!window.confirm("Are you sure you want to delete this?")) return;

        try {
            const res = await fetch(`${API_URL}/schedule/${selectedEvent.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                alert("Deleted!");
                closeDetailSheet();
                fetchSchedules();
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete");
        }
    };

    // 수정 버튼 클릭
    const handleEditClick = () => {
        if (!selectedEvent) return;
        setEditId(selectedEvent.id);
        closeDetailSheet();
        openAddSheet(selectedEvent); // 데이터를 직접 전달하여 비동기 이슈 방지
    };

    // --- 달력 렌더링 ---
    const generateCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, dateFormat);
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                // 해당 날짜에 일정이 있는지 확인 (dot 표시용)
                // 해당 날짜에 일정이 있는 유저들의 고유 ID 추출
                const dayStr = format(day, 'yyyy-MM-dd');
                const daySchedules = schedules.filter(s => s.start_date <= dayStr && s.end_date >= dayStr);
                const userIdsOnDay = [...new Set(daySchedules.map(s => s.user_id))];

                days.push(
                    <div
                        className={`col cell ${!isCurrentMonth ? "disabled" : ""} ${isSelected ? "selected" : ""}`}
                        key={day}
                        onClick={(e) => handleDateClick(e, cloneDay)}
                    >
                        <span className="number">{formattedDate}</span>
                        {/* 일정 있으면 유저별 색상 dot 표시 */}
                        {isCurrentMonth && userIdsOnDay.length > 0 && (
                            <div className="dot-container">
                                {userIdsOnDay.map(uid => {
                                    // 유저 리스트에서의 인덱스를 기반으로 색상 결정
                                    const userIndex = users.findIndex(u => u.id === uid);
                                    const colorClass = ["purple", "green", "blue"][userIndex % 3] || "purple";
                                    return <div key={uid} className={`dot ${colorClass}`}></div>;
                                })}
                            </div>
                        )}
                    </div>
                );
                day = new Date(day.getTime() + 86400000);
            }
            rows.push(
                <div className="row" key={day}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="body">{rows}</div>;
    };

    // --- 선택된 날짜의 일정 필터링 ---
    const filteredSchedules = schedules.filter(s => {
        if (!s.start_date) return false;
        const dayStr = format(selectedDate, 'yyyy-MM-dd');
        return s.start_date <= dayStr && s.end_date >= dayStr;
    });

    // --- 드래그 핸들러 (List) ---
    const isDragging = useRef(false);

    const handleListTouchStart = (e) => {
        isDragging.current = true;
        dragStartY.current = e.targetTouches[0].clientY;
        dragStartHeight.current = sheetHeight;
    };

    const handleListTouchMove = (e) => {
        if (!isDragging.current) return;
        const currentY = e.targetTouches[0].clientY;
        const deltaY = currentY - dragStartY.current;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        let newHeight = dragStartHeight.current - deltaVh;

        // 제한 범위 - 최소값 0으로 변경
        if (newHeight < 0) newHeight = 0;
        if (newHeight > 85) newHeight = 85;
        setSheetHeight(newHeight);
    };

    const handleListTouchEnd = () => {
        isDragging.current = false;
    };

    // 마우스 이벤트 (데스크톱)
    const handleListMouseDown = (e) => {
        isDragging.current = true;
        dragStartY.current = e.clientY;
        dragStartHeight.current = sheetHeight;
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current) return;
            const currentY = e.clientY;
            const deltaY = currentY - dragStartY.current;
            const deltaVh = (deltaY / window.innerHeight) * 100;
            let newHeight = dragStartHeight.current - deltaVh;

            if (newHeight < 0) newHeight = 0;
            if (newHeight > 85) newHeight = 85;
            setSheetHeight(newHeight);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        if (isDragging.current) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [sheetHeight]);

    // --- 드래그 핸들러 (Add) ---
    const handleAddStart = (clientY) => {
        isAddDragging.current = true;
        addDragStartY.current = clientY;
        addDragStartHeight.current = addSheetHeight;
    };

    const handleAddMove = (clientY) => {
        if (!isAddDragging.current) return;
        const currentY = clientY;
        const deltaY = currentY - addDragStartY.current;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        let newHeight = addDragStartHeight.current - deltaVh;

        if (newHeight < 0) newHeight = 0;
        if (newHeight > 90) newHeight = 90;
        setAddSheetHeight(newHeight);
    };

    const handleAddEnd = () => {
        if (!isAddDragging.current) return;
        isAddDragging.current = false;
        if (addSheetHeight < 40) {
            closeAddSheet();
        } else {
            setAddSheetHeight(85);
        }
    };

    // Touch events for Add
    const handleAddTouchStart = (e) => handleAddStart(e.targetTouches[0].clientY);
    const handleAddTouchMove = (e) => handleAddMove(e.targetTouches[0].clientY);
    const handleAddTouchEnd = () => handleAddEnd();

    // Mouse events for Add (Desktop)
    const handleAddMouseDown = (e) => handleAddStart(e.clientY);

    useEffect(() => {
        const handleMouseMove = (e) => handleAddMove(e.clientY);
        const handleMouseUp = () => handleAddEnd();

        if (isAddMode) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isAddMode, addSheetHeight]);

    const openAddSheet = (initialData = null) => {
        setIsAddMode(true);
        setAddSheetHeight(85);

        if (initialData) {
            // 전달된 초기값이 있으면 설정 (기존 formData 유지하면서 병합)
            setFormData({
                pill_name: initialData.pill_name || "",
                dose: initialData.dose || "",
                start_date: initialData.start_date || format(selectedDate, 'yyyy-MM-dd'),
                end_date: initialData.end_date || initialData.start_date || format(selectedDate, 'yyyy-MM-dd'),
                timing: initialData.timing || "",
                memo: initialData.memo || "",
            });
            // 유저 아이디도 동기화 (상세 시트에서 선택된 유저 정보가 있다면)
            if (initialData.user_id) setSelectedUserId(initialData.user_id);
        } else if (!editId) {
            // 수정 모드(신규 생성)일 때만 초기화
            setFormData({
                pill_name: "",
                dose: "",
                start_date: format(selectedDate, 'yyyy-MM-dd'),
                end_date: format(selectedDate, 'yyyy-MM-dd'),
                timing: "",
                memo: "",
            });
        }
    };

    const closeAddSheet = () => {
        setAddSheetHeight(0);
        setTimeout(() => {
            setIsAddMode(false);
            setEditId(null); // 모드 초기화
        }, 300);
    };

    /* Icons */
    const BackIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <div className="calendar-page">
            <AlarmOverlay />
            {/* New Header */}
            <div className="calendar-page-header">
                <button onClick={() => navigate(-1)} className="calendar-back-btn">
                    <BackIcon />
                </button>
                <div className="header-title">Calendar</div>
                <div className="icon-wrapper" onClick={toggleOverlay}>
                    <div className="icon-alarm" />
                </div>
            </div>

            <div className="calendar-content-sheet"
                onClick={() => {
                    // 2개 이하: 바로 닫기 (sheetHeight = 0)
                    // 3개 이상: 첫 클릭 시 25vh로 축소, 두 번째 클릭 시 닫기
                    if (sheetHeight > 0) {
                        if (sheetHeight > 25) {
                            setSheetHeight(25);
                        } else {
                            setSheetHeight(0);
                        }
                    }
                }}
            >
                <div className="calendar-view">
                    <div className="calendar-header">
                        <div className="icon" onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }}>
                            <img src={preIcon} alt="prev" style={{ transform: "rotate(0deg)" }} />
                        </div>
                        <div className="title">
                            <span className="month">{format(currentMonth, "MMMM")}</span>
                            <span className="year">{format(currentMonth, "yyyy")}</span>
                        </div>
                        <div className="icon" onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }}>
                            <img src={preIcon} alt="next" style={{ transform: "rotate(180deg)" }} />
                        </div>
                    </div>

                    <div className="calendar-weekdays">
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                    </div>

                    {generateCalendar()}
                </div>
            </div>

            {/* --- 배경 어둡게 (Overlay) --- */}
            {(isAddMode || detailSheetOpen) && (
                <div
                    className="sheet-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100vh',
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1500,
                        transition: 'opacity 0.3s ease'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isAddMode) closeAddSheet();
                        else if (detailSheetOpen) setDetailSheetOpen(false);
                    }}
                />
            )}

            {/* --- 스케줄 리스트 시트 --- */}
            <div
                className="schedule-sheet"
                style={{ height: `${sheetHeight}vh`, transition: 'height 0.1s linear' }}
                ref={listSheetRef}
            >
                <div
                    className="sheet-handle-bar"
                    onTouchStart={handleListTouchStart}
                    onTouchMove={handleListTouchMove}
                    onTouchEnd={handleListTouchEnd}
                    onMouseDown={handleListMouseDown}
                >
                    <div className="handle"></div>
                </div>

                <div className="sheet-content">
                    {filteredSchedules.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#ccc', marginTop: '20px' }}>
                            No pills for today.
                        </div>
                    ) : (
                        filteredSchedules.map((item) => {
                            const userIndex = users.findIndex(u => u.id === item.user_id);
                            // Colors: Purple, Green, Blue
                            const colorHex = ["#9F63FF", "#00C48C", "#5B4DFF"][userIndex % 3] || "#9F63FF";

                            return (
                                <div
                                    className={`event-card ${item.is_taken ? "taken" : ""}`}
                                    key={item.id}
                                    onClick={() => openDetailSheet(item)}
                                >
                                    <div className="event-time">
                                        <span className="dot" style={{ borderColor: item.is_taken ? '#aaa' : colorHex, background: item.is_taken ? '#aaa' : 'transparent' }}></span>
                                        {item.timing || "Anytime"}
                                    </div>
                                    <div className="event-title" style={{ textDecoration: item.is_taken ? "line-through" : "none", color: item.is_taken ? "#aaa" : "#333" }}>
                                        {item.pill_name}
                                    </div>
                                    <div className="event-desc">{item.memo || item.dose}</div>
                                </div>
                            )
                        })
                    )}
                </div>

                {!isAddMode && (
                    <div className="fab-add" onClick={openAddSheet}>+</div>
                )}
            </div>

            {/* --- 복용약 추가 시트 --- */}
            <div
                className={`add-pill-sheet`}
                style={{
                    height: `${addSheetHeight}vh`,
                    bottom: isAddMode ? 0 : '-100vh',
                    transition: isAddDragging.current ? 'none' : 'bottom 0.3s ease-out, height 0.3s ease-out'
                }}
                ref={addSheetRef}
            >
                <div
                    className="sheet-handle-bar"
                    onTouchStart={handleAddTouchStart}
                    onTouchMove={handleAddTouchMove}
                    onTouchEnd={handleAddTouchEnd}
                    onMouseDown={handleAddMouseDown}
                >
                    <div className="handle"></div>
                </div>

                <div className="sheet-header">
                    <h3>{editId ? "Edit Pill" : "Add new Pill"}</h3>
                </div>

                <div className="sheet-content-scroll">
                    <div className="form-group">
                        <label>Pill name*</label>
                        <input name="pill_name" value={formData.pill_name} onChange={handleFormChange} placeholder="Pill name" />
                    </div>
                    <div className="form-group">
                        <label>dose</label>
                        <input name="dose" value={formData.dose} onChange={handleFormChange} placeholder="dose" />
                    </div>
                    <div className="row-group">
                        <div className="form-group half">
                            <label>start date</label>
                            <input type="date" name="start_date" value={formData.start_date} onChange={handleFormChange} />
                        </div>
                        <div className="form-group half">
                            <label>end date</label>
                            <input type="date" name="end_date" value={formData.end_date} onChange={handleFormChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>timing</label>
                        <input name="timing" value={formData.timing} onChange={handleFormChange} placeholder="timing (e.g. After meal)" />
                    </div>
                    <div className="form-group">
                        <label>memo</label>
                        <textarea name="memo" value={formData.memo} onChange={handleFormChange} placeholder="memo" rows={3}></textarea>
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

                    <button className="create-btn" onClick={handleSubmit}>
                        {editId ? "Update Event" : "Create Event"}
                    </button>
                    <div style={{ height: '100px' }}></div>
                </div>
            </div>



            {/* --- 상세 정보 시트 (Click to Action) --- */}
            <div
                className="detail-sheet"
                style={{
                    bottom: detailSheetOpen ? 0 : '-100vh',
                }}
            >
                {selectedEvent && (
                    <div className="detail-content">
                        <h3 className="detail-pill-name">{selectedEvent.pill_name}</h3>

                        <div className="detail-info-list">
                            <div className="detail-info-item">
                                <span className="label">Period</span>
                                <span className="value">{selectedEvent.start_date} ~ {selectedEvent.end_date}</span>
                            </div>

                            {selectedEvent.timing && (
                                <div className="detail-info-item">
                                    <span className="label">Timing</span>
                                    <span className="value">{selectedEvent.timing}</span>
                                </div>
                            )}

                            {selectedEvent.memo && (
                                <div className="detail-info-item memo">
                                    <span className="label">Memo</span>
                                    <span className="value">{selectedEvent.memo}</span>
                                </div>
                            )}
                        </div>

                        <div className="action-buttons">
                            <button
                                onClick={handleToggleTaken}
                                style={{
                                    flex: 1, // Equal size
                                    padding: '12px 4px', // Tighter padding for long text
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: selectedEvent.is_taken ? '#eee' : '#9F63FF',
                                    color: selectedEvent.is_taken ? '#333' : 'white',
                                    fontWeight: 'bold',
                                    fontSize: '13px' // Slightly smaller to fit "Mark as Taken"
                                }}
                            >
                                {selectedEvent.is_taken ? "Undo Taken" : "Mark as Taken"}
                            </button>
                            <button
                                onClick={handleEditClick}
                                style={{
                                    flex: 1, // Equal size
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '13px'
                                }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                style={{
                                    flex: 1, // Equal size
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: '#FFEBEE',
                                    color: '#D32F2F',
                                    fontWeight: 'bold',
                                    fontSize: '13px'
                                }}
                            >
                                Del
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bottom-nav-container" style={{ display: (sheetHeight > 5 || isAddMode || detailSheetOpen) ? 'none' : 'block' }}>
                <HomeBar />
            </div>
        </div >
    );
};

export default Calendar;
