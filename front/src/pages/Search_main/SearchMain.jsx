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
          <img
            src={scanIcon}
            alt="scan"
            className="scan-icon"
            onClick={() => navigate("/search/camera")}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchMain;
