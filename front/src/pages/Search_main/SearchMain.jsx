import React from "react";
import { useNavigate } from "react-router-dom";
import { Element } from "../../components/Element/Element";
import { InputBar } from "../../components/InputBar/InputBar";
import scanIcon from "./scan_icon.svg";
import "./style.css";

const SearchMain = () => {
  const navigate = useNavigate();

  return (
    <div className="search-main">
      <Element variant="alarm" />

      <div className="search-ui">

        <div className="search-bar-row">
          {/* InputBar 클릭 → /search */}
          <div
            className="inputbar-reset"
            onClick={() => navigate("/search")}
          >
            <InputBar />
          </div>

          {/* Scan 아이콘 → /search_camera */}
          {/* Scan 아이콘 → /search_camera */}
          <img
            src={scanIcon}
            alt="scan"
            className="scan-icon"
            style={{
              opacity: localStorage.getItem("authToken") ? 1 : 0.5,
              cursor: localStorage.getItem("authToken") ? "pointer" : "not-allowed"
            }}
            onClick={() => {
              if (!localStorage.getItem("authToken")) {
                alert("로그인이 필요한 서비스입니다.");
                navigate("/login");
                return;
              }
              navigate("/search/camera");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchMain;
