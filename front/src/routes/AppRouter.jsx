// src/routes/AppRouter.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

/* layouts */
import MainLayout from "../layouts/MainLayout";
import EmptyLayout from "../layouts/EmptyLayout";
import ProtectRoute from "../auth/ProtectRoute";

/* pages */
import Welcome from "../pages/Welcome/Welcome";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

// 검색
import SearchMain from "../pages/Search_main/SearchMain";
import { Search } from "../pages/Search/Search";
import SearchDetail from "../pages/Search_detail/SearchDetail";
import SearchResultInfo from "../pages/Search_result_info/Search_result_info";
import { SearchCamera } from "../pages/SearchCamera/SearchCamera";

// 마이페이지/가족 관리
import EditMyPage from "../pages/EditMyPage/Editmypage";
import AddFamily from "../pages/AddFamily/AddFamily";
import EditFamily from "../pages/EditFamily/EditFamily";
import { MyPageScreen } from "../pages/MyPage/MyPage";
import NotificationList from "../pages/NotificationList/NotificationList";

// 지도
import MapMain from "../pages/Map_main/MapMain";
import MapRInfo from "../pages/MapRInfo/MapRInfo";

// OCR
import OcrResult from "../pages/OCR/OcrResult";

// 캘린더
import Calendar from "../pages/Calendar/Calendar";

// 챗봇
import ChattingMain from "../pages/Chat/ChattingMain";

function AppRouter() {
  return (
    <Routes>
      {/* 모든 페이지에 하단바 적용 (MainLayout 통합) */}
      <Route element={<MainLayout />}>
        {/* 로그인/회원가입 */}
        <Route path="/" element={<Welcome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 검색 관련 페이지 */}
        <Route path="/search" element={<Search />} />
        <Route path="/search/detail/:query" element={<SearchDetail />} />
        <Route path="/search/detail" element={<SearchDetail />} />
        <Route path="/search_detail" element={<SearchDetail />} />
        {/* 약 상세 정보 페이지 */}
        <Route path="/search/result/:drugId" element={<SearchResultInfo />} />
        {/* 서비스 메인 (Public) */}
        <Route path="/search_main" element={<SearchMain />} />

        {/* 지도 (Public) */}
        <Route path="/map" element={<MapMain />} />
        <Route path="/map/detail/:name" element={<MapRInfo />} />

        {/* Protected Routes */}
        <Route element={<ProtectRoute />}>
          {/* 마이페이지/가족 관리 */}
          <Route path="/mypage" element={<MyPageScreen />} />
          <Route path="/edit-mypage" element={<EditMyPage />} />
          <Route path="/add-family" element={<AddFamily />} />
          <Route path="/edit-family" element={<EditFamily />} />

          {/* 캘린더 */}
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/pill-management" element={<Calendar />} />

          {/* 알림 목록 페이지 */}
          <Route path="/notifications" element={<NotificationList />} />

          {/* OCR 결과 */}
          <Route path="/ocr/result" element={<OcrResult />} />

          {/* 챗봇 */}
          <Route path="/chat" element={<ChattingMain />} />
          <Route path="/chat/history" element={<ChattingMain />} />

          {/* 카메라 */}
          <Route path="/search/camera" element={<SearchCamera />} />
        </Route>
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