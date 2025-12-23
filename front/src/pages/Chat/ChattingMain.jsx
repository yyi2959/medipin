import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";

import { AiIcon } from "../../components/AiIcon";
import { ChatbubbleEllipsesOutline } from "../../components/ChatbubbleEllipsesOutline";
import { Element } from "../../components/Element";

import calendarIcon from "../../components/HomeBar/calendar_icon.svg";
import iconStroke from "../../components/HomeBar/mypage_icon.svg";
import mapIcon from "../../components/HomeBar/map_icon.svg";
import searchIcon from "../../components/HomeBar/search_icon.svg";

import mediping21 from "./mediping-2-1.png";
import "./style.css";

const ChattingMain = () => {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      alert("세션이 만료되었거나 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (!inputValue.trim()) return;

    const currentQuestion = inputValue;
    const userMessage = { text: currentQuestion, sender: "user" };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      if (response.status === 401) {
        alert("인증에 실패했습니다. 다시 로그인해주세요.");
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }

      const data = await response.json();
      console.log("Chatbot Response:", data); // ✅ 응답 구조 확인용 로그

      if (data && data.response) {
        const botMessage = { text: data.response, sender: "bot" };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: "죄송합니다. 답변을 가져오지 못했습니다.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatting-main">
      <div className="frame-2" />
      <Element className="header" />

      {/* 대화창 영역 */}
      <div className="chat-container" ref={scrollRef} style={{
        position: "absolute", top: "150px", width: "100%", height: "400px",
        overflowY: "auto", padding: "0 20px", zIndex: 10,
      }}>
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender}`} style={{
            textAlign: msg.sender === "user" ? "right" : "left", margin: "10px 0",
          }}>
            <span style={{
              background: msg.sender === "user" ? "#9f63ff" : "#eee6ff",
              color: msg.sender === "user" ? "white" : "black",
              padding: "10px 15px", borderRadius: "15px", display: "inline-block", maxWidth: "80%", fontSize: "14px",
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && (
          <p style={{ fontSize: "12px", color: "#9f63ff", fontWeight: "bold" }}>
            메디핀이 답변을 생각 중이에요...
          </p>
        )}
      </div>

      {/* 추천 질문 */}
      {messages.length === 0 && (
        <div className="frame-6">
          <div className="text-wrapper-7">Suggestion</div>
          <div className="ask-sample-with-pic">
            <img className="mediping" alt="Mediping" src={mediping21} />
            <div className="ask-example">
              <div className="ask" onClick={() => setInputValue("해당 성분이 들어간 약 목록을 모두 보여주세요.")} style={{ cursor: "pointer" }}>
                <div className="text-wrapper-8">원하는 약 목록을 물어보세요.</div>
                <p className="text-wrapper-9">“해당 성분이 들어간 약 목록을 모두 보여주세요.”</p>
              </div>
              <div className="ask-2" onClick={() => setInputValue("알레르기가 있는데 이 약을 먹어도 괜찮을까요?")} style={{ cursor: "pointer" }}>
                <div className="text-wrapper-8">알레르기 성분을 물어보세요.</div>
                <p className="text-wrapper-9">“알레르기가 있는데 이 약을 먹어도 괜찮을까요?”</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="ai-icon-input-with">
        <div className="content">
          <input type="text" className="supporting-text" placeholder="메시지를 입력하세요..."
            value={inputValue} onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            style={{ border: "none", background: "transparent", width: "100%", outline: "none" }}
          />
        </div>
        <button onClick={handleSendMessage} style={{ border: "none", background: "none", cursor: "pointer" }}>
          <span style={{ color: "#9f63ff", fontWeight: "bold" }}>전송</span>
        </button>
      </div>

      {/* 하단 바 */}
      <div className="home-bar">
        <div className="frame-3">
          <div className="left-icon">
            <div className="search-icon" onClick={() => navigate("/search")} style={{ cursor: "pointer" }}>
              <div className="frame-4">
                <img className="img" src={searchIcon} alt="Search" />
                <div className="text-wrapper-4">Search</div>
              </div>
            </div>
            <div className="map-icon" onClick={() => navigate("/map")} style={{ cursor: "pointer" }}>
              <div className="frame-4">
                <img className="map-icon-2" src={mapIcon} alt="Map" />
                <div className="text-wrapper-4">Map</div>
              </div>
            </div>
          </div>

          <div className="ai-chatting active">
            <div className="frame-wrapper">
              <ChatbubbleEllipsesOutline className="icon-ionicons" />
            </div>
          </div>

          <div className="right-icon">
            <div className="calendar-icon">
              <div className="frame-5">
                <img className="calendar-icon-2" src={calendarIcon} alt="Calendar" />
                <div className="text-wrapper-5">Calendar</div>
              </div>
            </div>
            <div className="mypage-icon" onClick={() => navigate("/mypage")} style={{ cursor: "pointer" }}>
              <div className="frame-4">
                <img className="icon-stroke" src={iconStroke} alt="My page" />
                <div className="text-wrapper-4">My page</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> // 전체 컨테이너 닫기
  );
};

export default ChattingMain;