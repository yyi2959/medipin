import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Element } from "../../components/Element/Element";
import { ElementInputBar } from "../../components/ElementInputBar/ElementInputBar";
import trashIcon from "./trash.svg";


import "./style.css";

export const Search = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);

  /* 최근 검색어 로드 */
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("search_history") || "[]"
    );
    setHistory(saved);
  }, []);

  /* 검색 실행 */
  const handleSearch = () => {
    if (!query.trim()) return;

    const updatedHistory = [
      query,
      ...history.filter((item) => item !== query),
    ].slice(0, 5);

    localStorage.setItem(
      "search_history",
      JSON.stringify(updatedHistory)
    );
    setHistory(updatedHistory);

    navigate(`/search/detail/${encodeURIComponent(query)}`);
  };


  /* 개별 검색어 삭제 */
  const handleDelete = (item, e) => {
    e.stopPropagation();

    const updated = history.filter((h) => h !== item);
    localStorage.setItem(
      "search_history",
      JSON.stringify(updated)
    );
    setHistory(updated);
  };

  /* Icons */
  const BackIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="search">
      <div className="search-header">
        <button onClick={() => navigate(-1)} className="search-back-btn">
          <BackIcon />
        </button>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="search-body">
        <div className="frame-2">
          <div className="frame-wrapper">
            <div className="frame-3">
              <div className="div-wrapper">
                <div className="frame-4">
                  <div className="frame-5">
                    <div className="frame-4">
                      <div className="text-wrapper-3">Search</div>
                    </div>
                  </div>
                </div>
              </div>

              <ElementInputBar
                className="input-bar"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch()
                }
                onSearch={handleSearch}
              />
            </div>
          </div>

          <div className="frame-6">
            {history.length === 0 && (
              <div className="frame-7">
                <div className="text-wrapper-4">
                  최근 검색어가 없습니다
                </div>
              </div>
            )}

            {history.map((item, idx) => (
              <div
                key={idx}
                className="history-row"
                onClick={() =>
                  navigate(`/search/detail/${encodeURIComponent(item)}`)
                }
              >
                <span className="history-text">{item}</span>

                <img
                  src={trashIcon}
                  alt="delete"
                  className="trash-icon"
                  onClick={(e) => handleDelete(item, e)}
                />
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
};
