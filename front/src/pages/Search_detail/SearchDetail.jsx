import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { SearchResultIn } from "../../components/SearchResultIn/SearchResultIn";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import { API_BASE_URL } from "../../api/config";


import AddScheduleModal from "../../components/AddScheduleModal/AddScheduleModal"; // ✅ Import Modal

import { useAlarm } from "../../context/AlarmContext";
import "./style.css";

const SearchDetail = () => {
  const navigate = useNavigate();
  const { toggleOverlay } = useAlarm();
  const { query } = useParams(); // ✅ 검색어 URL 파라미터

  // Icons
  const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18L9 12L15 6" />
    </svg>
  );

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]); // ✅ 검색 기록 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // ✅ 모달 상태
  const [selectedPillName, setSelectedPillName] = useState(""); // ✅ 선택된 약 이름

  // 1. 초기 로드: 쿼리가 없으면 로컬 스토리지에서 기록 불러오기
  useEffect(() => {
    if (!query) {
      const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      setHistory(saved);
      setLoading(false);
      return;
    }

    // 2. 쿼리가 있으면 API 호출
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/drugs/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);

        // 검색 성공 시 기록 저장
        saveHistory(query);
      } catch (err) {
        console.error("검색 실패", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const saveHistory = (newQuery) => {
    let saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
    // 중복 제거 및 최신순 정렬
    saved = [newQuery, ...saved.filter(q => q !== newQuery)].slice(0, 10);
    localStorage.setItem("recentSearches", JSON.stringify(saved));
  };

  const handleClearHistory = () => {
    localStorage.removeItem("recentSearches");
    setHistory([]);
  };

  return (
    <div className="search-detail">
      {/* 헤더 */}
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
        {/* 결과 영역 */}
        <div className="search-result-2">
          {/* 타이틀 표시 (필요 시) */}
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
            {query ? `"${query}" 검색 결과` : "Search List"}
          </h2>

          {/* Case A: 검색 모드 */}
          {query && (
            <>
              {loading && <p>로딩 중...</p>}
              {!loading && results.length === 0 && <p>검색 결과가 없습니다.</p>}
              {!loading && results.length > 0 && (
                <div className="frame-7">
                  {results.map((item) => (
                    <SearchResultIn
                      key={item.id}
                      imageUrl={item.item_image}
                      title={item.drug_name}
                      onPlusClick={() => {
                        setSelectedPillName(item.drug_name);
                        setIsModalOpen(true);
                      }}
                      onImageClick={() => navigate(`/search/result/${item.id}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ✅ 복약 일정 추가 모달 */}
          <AddScheduleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            defaultPillName={selectedPillName}
          />

          {/* Case B: 히스토리 모드 (쿼리 없음) */}
          {!query && (
            <div>
              {history.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888' }}>최근 검색 기록이 없습니다.</p>
              ) : (
                <ul className="history-list">
                  {history.map((h, idx) => (
                    <li
                      key={idx}
                      onClick={() => navigate(`/search/detail/${h}`)}
                      className="history-item"
                    >
                      <span>{h}</span>
                      <span style={{ color: '#ccc' }}>↗</span>
                    </li>
                  ))}
                </ul>
              )}
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  style={{
                    marginTop: '20px',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#9F63FF',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  Delete all history
                </button>
              )}
            </div>
          )}
        </div>
        {/* Padding for bottom nav */}
        <div style={{ height: 80 }}></div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="bottom-nav-container">
        <HomeBar />
      </div>
    </div>
  );
};

export default SearchDetail;
