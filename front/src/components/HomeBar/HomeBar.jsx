// src/components/HomeBar/HomeBar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../auth/token";

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
  const [toastMsg, setToastMsg] = useState("");

  const isLoggedIn = isAuthenticated();

  /* 🔑 search 계열 경로 판별 */
  const isSearchActive = location.pathname.startsWith("/search");

  /* 🔑 map 계열 경로 판별 */
  const isMapActive = location.pathname.startsWith("/map");

  /* 🔑 calendar 계열 경로 판별 */
  const isCalendarActive = location.pathname.startsWith("/calendar");

  /* 🔑 mypage 계열 경로 판별 */
  const isMyPageActive = location.pathname.startsWith("/mypage");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  const handleNav = (path, restricted = false) => {
    if (restricted && !isLoggedIn) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }
    navigate(path);
  };

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
          {/* Search: Always Active */}
          <div
            className={`icon-item ${isSearchActive ? "active" : ""}`}
            onClick={() => handleNav("/search_main")}
          >
            <img src={searchIcon} alt="search" />
            <span>Search</span>
          </div>

          {/* Map: Always Active */}
          <div
            className={`icon-item ${isMapActive ? "active" : ""}`}
            onClick={() => handleNav("/map")}
          >
            <img src={mapIcon} alt="map" />
            <span>Map</span>
          </div>
        </div>

        {/* 오른쪽 아이콘 */}
        <div className="icon-group">
          {/* Calendar: Restricted */}
          <div
            className={`icon-item ${isCalendarActive ? "active" : ""} ${!isLoggedIn ? "disabled" : ""}`}
            onClick={() => handleNav("/calendar", true)}
          >
            <img src={calendarIcon} alt="calendar" />
            <span>Calendar</span>
          </div>

          {/* My Page: Restricted */}
          <div
            className={`icon-item ${isMyPageActive ? "active" : ""} ${!isLoggedIn ? "disabled" : ""}`}
            onClick={() => handleNav("/mypage", true)}
          >
            <img src={mypageIcon} alt="mypage" />
            <span>My page</span>
          </div>
        </div>
      </div>

      {/* 중앙 AI 버튼 (Restricted) */}
      <div
        className={`ai-center ${!isLoggedIn ? "disabled" : ""}`}
        onClick={() => handleNav("/chat", true)}
        style={!isLoggedIn ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
      >
        <img src={aiChattingIcon} alt="ai chat" />
      </div>
    </div>
  );
};

export default HomeBar;

