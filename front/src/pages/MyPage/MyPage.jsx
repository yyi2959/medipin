import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import "./style.css";

// 누락된 이미지/아이콘 컴포넌트 임시 대체
const User = () => <div style={{ width: 30, height: 30, backgroundColor: '#ccc', borderRadius: '50%' }} />;
const SearchOutline = () => <div style={{ width: 30, height: 30, backgroundColor: '#ccc' }} />;
const Pill = () => <div style={{ width: 30, height: 30, backgroundColor: '#ccc' }} />;

import { useEffect, useState } from "react";

// Icons 
const UserIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
const PillIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="6" ry="6"></rect>
  </svg>
);
const LogoutIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);
const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export const MyPageScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "MediPin User", email: "loading...", age: 0 });
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        // 1. Fetch Main Profile
        const profileRes = await fetch("http://localhost:8000/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUser(data);
        }

        // 2. Fetch Family Members
        const familyRes = await fetch("http://localhost:8000/user/family", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (familyRes.ok) {
          const familyData = await familyRes.json();
          setFamilyMembers(familyData);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchAllData();
  }, []);

  const MenuRow = ({ icon: Icon, label, onClick, showBorder = true }) => (
    <div className="menu-row" onClick={onClick}>
      <div className="menu-icon-wrapper">
        <Icon />
      </div>
      <div className="menu-label">{label}</div>
      <div className="menu-arrow"><ChevronRight /></div>
    </div>
  );

  return (
    <div className="my-page-container">
      {/* Header */}
      <div className="mypage-header">
        <button onClick={() => navigate(-1)} className="back-btn">⬅</button>
        <div className="header-title">My page</div>
        <div style={{ width: 24 }}></div>
      </div>

      <div className="content-scrollable">
        {/* 1. Family Cards Section (Carousel style if many) */}
        <div className="section-label">Family Members</div>
        {familyMembers.map((member) => (
          <div key={member.id} className="profile-card family-card">
            <div className="card-left">
              <div className="profile-name">{member.name}</div>
              <div className="profile-detail-row">
                <span className="detail-label">Birthdate</span>
                <span className="detail-value">{member.birth_date || "-"}</span>
              </div>
              <div className="profile-detail-row">
                <span className="detail-label">Age</span>
                <span className="detail-value">{member.age || "-"}</span>
              </div>
            </div>
            <div className="card-right">
              <button className="change-user-btn" onClick={() => navigate("/edit-family", { state: member })}>
                Edit<br />Info
              </button>
            </div>
          </div>
        ))}

        {/* 2. Add Button */}
        <button className="add-family-btn" onClick={() => navigate("/add-family")}>
          +
        </button>

        {/* 3. Main User Card */}
        <div className="section-label" style={{ marginTop: 20 }}>Main User</div>
        <div className="profile-card user-card">
          <div className="user-avatar">
            <UserIcon /> {/* Placeholder for image */}
          </div>
          <div className="user-info-col">
            <div className="profile-name">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>

        {/* 4. Menu List */}
        <div className="menu-list-container">
          <MenuRow icon={UserIcon} label="Edit profile" onClick={() => navigate("/edit-mypage")} />
          <div className="menu-divider"></div>
          <MenuRow icon={SearchIcon} label="Search List" onClick={() => navigate("/search/detail")} />
          <div className="menu-divider"></div>
          <MenuRow icon={PillIcon} label="Pill List" onClick={() => navigate("/pill-management")} />
          <div className="menu-divider"></div>
          <MenuRow icon={LogoutIcon} label="Logout" onClick={() => {
            localStorage.removeItem("authToken");
            navigate("/login");
          }} />
        </div>

        {/* Padding for bottom nav */}
        <div style={{ height: 80 }}></div>
      </div>
    </div>
  );
};