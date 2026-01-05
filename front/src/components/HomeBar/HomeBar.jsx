// src/components/HomeBar/HomeBar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

import aiChattingIcon from "./ai_chatting_icon.svg";
import calendarIcon from "./calendar_icon.svg";
import mapIcon from "./map_icon.svg";
import mypageIcon from "./mypage_icon.svg";
import searchIcon from "./search_icon.svg";
import background from "./homebar_background.svg";

import "./style.css";

export const HomeBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /* 🔑 search 계열 경로 판별 */
  const isSearchActive =
    location.pathname.startsWith("/search");

  /* 🔑 map 계열 경로 판별 */
  const isMapActive =
    location.pathname.startsWith("/map");

  /* 🔑 calendar 계열 경로 판별 */
  const isCalendarActive =
    location.pathname.startsWith("/calendar");

  /* 🔑 mypage 계열 경로 판별 */
  const isMyPageActive =
    location.pathname.startsWith("/mypage");

  return (
    <div className="homebar">
      {/* 배경 */}
      <img
        src={background}
        alt="homebar background"
        className="homebar-bg"
      />

      {/* 아이콘 프레임 */}
      <div className="homebar-frame">
        {/* 왼쪽 아이콘 */}
        <div className="icon-group">
          <div
            className={`icon-item ${isSearchActive ? "active" : ""
              }`}
            onClick={() => navigate("/search_main")}
          >
            <img src={searchIcon} alt="search" />
            <span>Search</span>
          </div>

          <div
            className={`icon-item ${isMapActive ? "active" : ""
              }`}
            onClick={() => navigate("/map")}
          >
            <img src={mapIcon} alt="map" />
            <span>Map</span>
          </div>
        </div>

        {/* 오른쪽 아이콘 */}
        <div className="icon-group">
          <div
            className={`icon-item ${isCalendarActive ? "active" : ""
              }`}
            onClick={() => navigate("/calendar")}
          >
            <img src={calendarIcon} alt="calendar" />
            <span>Calendar</span>
          </div>

          <div
            className={`icon-item ${isMyPageActive ? "active" : ""
              }`}
            onClick={() => navigate("/mypage")}
          >
            <img src={mypageIcon} alt="mypage" />
            <span>My page</span>
          </div>
        </div>
      </div>

      {/* 중앙 AI 버튼 */}
      <div
        className="ai-center"
        onClick={() => navigate("/chat")}
      >
        <img src={aiChattingIcon} alt="ai chat" />
      </div>
    </div>
  );
};

export default HomeBar;
