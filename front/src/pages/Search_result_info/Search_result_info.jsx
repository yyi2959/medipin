import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import preIcon from "./pre_icon.svg";
import pillPic from "./pill_pic.svg";
import AddScheduleModal from "../../components/AddScheduleModal/AddScheduleModal"; // ✅ Import
import "./style.css";

/* 헤더 컴포넌트 */
const Element = ({ className }) => (
  <div className={`element ${className} `}>
    <div className="frame">
      <div className="text-wrapper">MediPIN</div>
    </div>
  </div>
);

const SearchResultInfo = () => {
  const { drugId } = useParams();
  const navigate = useNavigate();

  const [drugDetail, setDrugDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ 모달 상태

  /* 드래그 관련 상태 */
  const [sheetHeight, setSheetHeight] = useState(80); // vh 단위, 초기값 80% (상세정보 보임)
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef(null);

  const getDisplayValue = (value) => (value ? value : ".");
  const getLengthValue = (value) => (value ? `${value} ` : ".");

  useEffect(() => {
    if (!drugId) {
      setError("약품 ID가 URL에 없습니다.");
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/drugs/${drugId}`
        );
        if (!res.ok) {
          throw new Error(`API 호출 실패: ${res.status}`);
        }

        const data = await res.json();
        setDrugDetail(data);
      } catch (err) {
        console.error(err);
        setError("약 상세 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [drugId]);

  /* 드래그 핸들러 */
  const handleStart = (clientY) => {
    isDragging.current = true;
    startY.current = clientY;
    startHeight.current = sheetRef.current ? sheetRef.current.offsetHeight : 0;
  };

  const handleMove = (clientY) => {
    if (!isDragging.current) return;

    const deltaY = startY.current - clientY; // 위로 드래그하면 양수 -> 높이 증가
    const newHeightPx = startHeight.current + deltaY;
    const windowHeight = window.innerHeight;

    // px -> vh 변환
    let newHeightVh = (newHeightPx / windowHeight) * 100;

    // 범위 제한 (최소 45vh ~ 최대 95vh)
    if (newHeightVh < 45) newHeightVh = 45;
    if (newHeightVh > 95) newHeightVh = 95;

    setSheetHeight(newHeightVh);
  };

  const handleEnd = () => {
    isDragging.current = false;

    // 스냅 포인트 (중간 지점 60 기준으로 위/아래 고정)
    if (sheetHeight > 60) {
      setSheetHeight(85); // 펼침
    } else {
      setSheetHeight(45); // 접힘 (사진 보임)
    }
  };

  /* Touch Events */
  const onTouchStart = (e) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e) => handleMove(e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  /* Mouse Events (PC 테스트용) */
  const onMouseDown = (e) => handleStart(e.clientY);

  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDragging.current) {
        handleMove(e.clientY);
      }
    };
    const handleWindowMouseUp = () => {
      if (isDragging.current) {
        handleEnd();
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [sheetHeight]);

  /* 로딩/에러 처리 */
  if (loading || error || !drugDetail) {
    return (
      <div className="search-detail-page">
        <Element className="header" />
        <div style={{ textAlign: "center", marginTop: "150px" }}>
          {loading ? "로딩중..." : error || "정보 없음"}
        </div>
        <HomeBar />
      </div>
    );
  }

  return (
    <div className="search-detail-page search-result-final">
      {/* 1. 상단 이미지 영역 (Fixed Background) */}
      <div className="top-area-fixed">
        {/* 뒤로가기 & 타이틀 */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <img src={preIcon} alt="Back" />
          </button>
          <div className="header-title-container" style={{ opacity: sheetHeight > 70 ? 0 : 1, transition: 'opacity 0.3s' }}>
            <h2 className="header-title">{drugDetail.item_name}</h2>
          </div>
        </div>

        {/* 약품 이미지 - 시트 높이에 따라 위치/크기 조정 가능하지만 일단 중앙 고정 */}
        <div className="image-container-fixed">
          <img
            src={drugDetail.item_image || pillPic}
            alt={drugDetail.item_name}
            onError={(e) => { e.target.src = pillPic; }}
            className="main-drug-img"
          />
        </div>
      </div>

      {/* 2. 하단 상세 정보 (Bottom Sheet) */}
      <div
        className="bottom-sheet"
        ref={sheetRef}
        style={{ height: `${sheetHeight}vh`, transition: isDragging.current ? 'none' : 'height 0.3s ease-out' }}
      >
        {/* 드래그 핸들 영역 */}
        <div
          className="sheet-handle-area"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="sheet-handle"></div>
        </div>

        {/* 상단 타이틀 & 추가 버튼 */}
        <div className="sheet-header">
          <div className="titles">
            <h1 className="drug-name-kr">{drugDetail.item_name}</h1>
            <h3 className="drug-name-en">{drugDetail.item_eng_name || "Asidol soft cap."}</h3>
          </div>
          <button className="add-btn" onClick={() => setIsModalOpen(true)}>
            <span className="plus-icon">+</span>
          </button>
        </div>

        {/* 정보 리스트 */}
        <div className="info-list">
          <InfoRow label="품목 일련번호" value={drugDetail.item_seq || "200808876"} />
          <InfoRow label="전문/일반 구분" value={drugDetail.etc_otc_name} />
          <InfoRow label="체형 코드 이름" value={drugDetail.form_code_name} />
          <InfoRow label="의약품 모양" value={drugDetail.drug_shape} />
          <InfoRow label="색깔(앞)" value={drugDetail.color_class1} />
          <InfoRow label="색깔(뒤)" value={drugDetail.color_class2} />
          <InfoRow label="표시(앞)" value={drugDetail.print_front} />
          <InfoRow label="크기(장축)" value={getLengthValue(drugDetail.leng_long)} />
          <InfoRow label="크기(단축)" value={getLengthValue(drugDetail.leng_short)} />
          <InfoRow label="업체명" value={drugDetail.company_name} />
          <InfoRow label="업체 일련번호" value={drugDetail.entp_seq || "19540006"} />
          <InfoRow label="약의 용도" value={drugDetail.class_name} />
          <InfoRow label="분류 번호" value={drugDetail.class_no} />
        </div>

        {/* 하단 여백 확보 */}
        <div style={{ height: "80px" }}></div>
      </div>

      {/* ✅ 복약 일정 추가 모달 */}
      <AddScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPillName={drugDetail ? drugDetail.item_name : ""}
      />

      {/* 3. 하단 네비게이션 */}
      <div className="bottom-nav-container">
        <HomeBar />
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="label">{label}</span>
    <span className="value">{value}</span>
  </div>
);

export default SearchResultInfo;
