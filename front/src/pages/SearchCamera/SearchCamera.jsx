import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom"; // 🚨 추가
import { API_BASE_URL } from "../../api/config";
import { SearchSwitcher } from "./SearchSwitcher";
import "./style.css";

export const SearchCamera = () => {
  const navigate = useNavigate(); // 🚨 추가
  const videoRef = useRef(null);
  const streamRef = useRef(null);



  const [facingMode, setFacingMode] = useState("environment");
  const [loading, setLoading] = useState(false); // 🚨 로딩 상태 추가

  const startCamera = async (mode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // 자동 초점 시도 (일부 최신 브라우저 지원)
      const track = stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        track.applyConstraints({
          advanced: [{ focusMode: "continuous" }]
        }).catch(() => console.log("자동 초점 설정을 지원하지 않는 기기입니다."));
      }

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

        setLoading(true); // 로딩 시작

        const formData = new FormData();
        // 🚨 백엔드(app/routers/ocr.py)의 read_text 함수 파라미터명 'file'과 일치시켜야 함
        formData.append("file", blob, "prescription.jpg");

        try {
          const res = await fetch(
            `${API_BASE_URL}/ocr/read`,
            {
              method: "POST",
              body: formData,
            }
          );

          const data = await res.json();
          console.log("OCR 결과:", data);

          if (data.success) {
            // ✅ 결과 페이지로 이동 (데이터 전달)
            navigate("/ocr/result", { state: { ocrData: data.data } });
          } else {
            alert(data.message || "분석에 실패했습니다. 다시 촬영해 주세요.");
          }
        } catch (err) {
          console.error("OCR 요청 실패:", err);
          alert(`OCR 처리 중 오류가 발생했습니다.\n상세: ${err.message}`);
        } finally {
          setLoading(false); // 로딩 종료
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

      {/* 닫기 버튼 */}
      <button
        type="button"
        className="close-button"
        onClick={() => navigate(-1)}
        aria-label="닫기"
      >
        ✕
      </button>

      {/* 하단 컨트롤 */}
      <div className="bottom-drawer">
        {/* 로딩 메시지 */}
        {loading && <div className="loading-overlay">분석 중...</div>}

        {/* 셔터 버튼 */}
        <button
          type="button"
          className="icon-shutter"
          onClick={capture}
          disabled={loading}
          aria-label="사진 촬영"
        />

        {/* 카메라 전환 버튼 */}
        <button
          type="button"
          className="action-rotate"
          onClick={toggleCamera}
          disabled={loading}
          aria-label="카메라 전환"
        />
      </div>
    </div>
  );
};
