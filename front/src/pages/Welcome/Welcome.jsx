import React, { useEffect } from "react";
import welcomeVideo from "./welcome.mp4";
import "./style.css";

const Welcome = () => {

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/login";   // 원하는 페이지로 이동
    }, 5000); // ★ 1.5초 뒤 이동 (원하는 시간으로 변경 가능)

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="welcome">
      <video
        className="welcome-video"
        src={welcomeVideo}
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};

export default Welcome;
