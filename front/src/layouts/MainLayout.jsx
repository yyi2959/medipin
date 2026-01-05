// src/layouts/MainLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import HomeBar from "../components/HomeBar/HomeBar";
import AlarmOverlay from "../components/AlarmOverlay/AlarmOverlay";

function MainLayout() {
  return (
    <>
      <AlarmOverlay />
      <Outlet />
      <HomeBar />
    </>
  );
}

export default MainLayout;
