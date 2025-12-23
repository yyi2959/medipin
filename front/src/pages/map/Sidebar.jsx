// Sidebar.jsx
import "./style.css";
export default function Sidebar({
  radius,
  setRadius,
  searchQuery,
  setSearchQuery,
  currentCity,
  onCityChange,

  // ⭐ 카테고리 필터
  filterType,
  setFilterType,

  results = [],
  onSelectResult,

  cities = [
    "서울특별시", "부산광역시", "대구광역시", "인천광역시",
    "광주광역시", "대전광역시", "울산광역시", "경기도",
    "강원도", "충청북도", "충청남도",
    "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
  ],
}) {
  return (
    <aside className="sidebar">
      <h2>🏥 내 주변 병원·약국</h2>

      {/* ✅ 카테고리 버튼 필터 */}
      <div className="category-filter">
        <button
          className={filterType === "all" ? "active" : ""}
          onClick={() => setFilterType("all")}
        >
          전체
        </button>

        <button
          className={filterType === "hospital" ? "active" : ""}
          onClick={() => setFilterType("hospital")}
        >
          병원
        </button>

        <button
          className={filterType === "pharmacy" ? "active" : ""}
          onClick={() => setFilterType("pharmacy")}
        >
          약국
        </button>

        <button
          className={filterType === "convenience" ? "active" : ""}
          onClick={() => setFilterType("convenience")}
        >
          편의점
        </button>
      </div>

      {/* 도시 필터 */}
      <label>도시 선택</label>
      <select value={currentCity} onChange={(e) => onCityChange(e.target.value)}>
        <option value="">현재 위치 기준</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* 이름 검색 */}
      <label>이름 검색</label>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="병원 또는 약국"
      />

      {/* 반경 설정 */}
      <label>검색 반경: {(radius / 1000).toFixed(1)}km</label>
      <input
        type="range"
        min="300"
        max="3000"
        step="100"
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
      />

      {/* 검색 결과 리스트 */}
      <ul className="result-list">
        {results.length === 0 && <li>검색 결과 없음</li>}
        {results.map((r, idx) => (
          <li key={idx} onClick={() => onSelectResult(r)}>
            <strong>{r.name}</strong>
            <div>{r.address}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
