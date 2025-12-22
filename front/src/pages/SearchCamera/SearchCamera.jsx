import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../api/config";
import { SearchSwitcher } from "./SearchSwitcher";
import "./style.css";

export const SearchCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [facingMode, setFacingMode] = useState("environment");

  const startCamera = async (mode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("카메라 접근 실패:", err);
      alert("카메라에 접근할 수 없습니다.");
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line
  }, []);

  const toggleCamera = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next);
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append("image", blob, "prescription.jpg");

        try {
          const res = await fetch(
            `${API_BASE_URL}/api/ocr/prescription`,
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await res.json();
          console.log("OCR 결과:", data);
        } catch (err) {
          console.error("OCR 요청 실패:", err);
          alert("OCR 처리 중 오류가 발생했습니다.");
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="search-camera">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="camera-preview"
      />

      <div className="rectangle" />

      <SearchSwitcher className="search-switcher-instance" />

      {/* 하단 컨트롤 */}
      <div className="bottom-drawer">
        {/* 셔터 버튼 */}
        <button
          type="button"
          className="icon-shutter"
          onClick={capture}
          aria-label="사진 촬영"
        />

        {/* 카메라 전환 버튼 */}
        <button
          type="button"
          className="action-rotate"
          onClick={toggleCamera}
          aria-label="카메라 전환"
        />
      </div>
    </div>
  );
};
