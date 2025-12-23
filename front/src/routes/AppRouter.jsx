// src/routes/AppRouter.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

/* layouts */
import MainLayout from "../layouts/MainLayout";
import EmptyLayout from "../layouts/EmptyLayout";

/* pages */
import Welcome from "../pages/Welcome/Welcome";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import SearchMain from "../pages/Search_main/SearchMain";
import { Search } from "../pages/Search/Search";
import SearchDetail from "../pages/Search_detail/SearchDetail";
import SearchResultInfo from "../pages/Search_result_info/Search_result_info";
import { SearchCamera } from "../pages/SearchCamera/SearchCamera";

import EditMyPage from "../pages/EditMyPage/Editmypage";
import AddFamily from "../pages/AddFamily/AddFamily";
import EditFamily from "../pages/EditFamily/EditFamily"; // ✅ Import

/* 마이페이지 */
import { MyPageScreen } from "../pages/MyPage/MyPage"; // 🚨 추가

/* 지도 */
import MapMain from "../pages/Map_main/MapMain";
import MapRInfo from "../pages/MapRInfo/MapRInfo";

/* 캘린더 */
import Calendar from "../pages/Calendar/Calendar";

/* 챗봇 */
import ChattingMain from "../pages/Chat/ChattingMain";

function AppRouter() {
  return (
    <Routes>
      {/* 1. HomeBar(하단바)가 없는 페이지들 */}
      <Route element={<EmptyLayout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 검색 입력 페이지 (입력 시엔 하단바가 없는 것이 일반적) */}
        <Route path="/search" element={<Search />} />

        {/* 검색 결과 리스트 (B파일 설정 반영) */}
        <Route path="/search/detail/:query" element={<SearchDetail />} />

        <Route path="/search/detail" element={<SearchDetail />} />

        {/* 약 상세 정보 페이지 */}
        <Route path="/search/result/:drugId" element={<SearchResultInfo />} />
      </Route>

      {/* 2. HomeBar(하단바)가 있는 페이지들 */}
      <Route element={<MainLayout />}>
        {/* 서비스 메인 */}
        <Route path="/search_main" element={<SearchMain />} />

        {/* 내 정보 수정 */}
        <Route path="/edit-mypage" element={<EditMyPage />} /> {/* 내 정보 수정 페이지 등록 */}
        <Route path="/add-family" element={<AddFamily />} /> {/* 가족 추가 페이지 */}
        <Route path="/edit-family" element={<EditFamily />} /> {/* 가족 수정 페이지 */}

        {/* 복용 약 관리 -> 캘린더 페이지로 연결 */}
        <Route path="/pill-management" element={<Calendar />} />

        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPageScreen />} />

        {/* 지도 */}
        <Route path="/map" element={<MapMain />} />
        <Route path="/map/detail/:name" element={<MapRInfo />} />

        {/* 캘린더 */}
        <Route path="/calendar" element={<Calendar />} />

        {/* 챗봇 (하단바를 포함하는 디자인일 경우 여기에 배치) */}
        <Route path="/chat" element={<ChattingMain />} />

        {/* 카메라 */}
        <Route path="/search/camera" element={<SearchCamera />} />
      </Route>

      {/* 404 처리 */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: "center", marginTop: 50 }}>
            페이지를 찾을 수 없습니다.
          </div>
        }
      />
    </Routes>
  );
}

export default AppRouter;