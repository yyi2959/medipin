import React from "react";
import { useAlarm } from "../../context/AlarmContext";
// import { InputBar } from "../InputBar";
import "./style.css";

/**
 * variant
 * - "simple" : 로고만 (로그인)
 * - "alarm"  : 로고 + 알림
 * - "search" : 로고 + 알림 + 검색
 */

export const Element = ({ variant = "simple", className = "" }) => {
  const { toggleOverlay } = useAlarm();

  return (
    <div className={`element element--${variant} ${className}`}>
      <div className="header-top">
        <div className="logo">MediPIN</div>

        {(variant === "alarm" || variant === "search") && (
          <div className="icon-wrapper" onClick={toggleOverlay}>
            <div className="icon-alarm" />
          </div>
        )}
      </div>

      {variant === "search" && (
        <InputBar className="header-search" iconStroke="search_icon.svg" />
      )}
    </div>
  );
};

export default Element;
