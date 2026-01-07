import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";

import { AiIcon } from "../../components/AiIcon";
import { ChatbubbleEllipsesOutline } from "../../components/ChatbubbleEllipsesOutline";
import { Element } from "../../components/Element";
import { HomeBar } from "../../components/HomeBar/HomeBar";
import { ChatHistory } from "./ChatHistory";

import doctorPin from "./doctor_pin.png";
import "./style.css";

const ChattingMain = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();



  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation();
  const activeTab = location.pathname.startsWith("/chat/history") ? "History" :
    location.pathname.startsWith("/chat/setting") ? "Setting" : "Chat";

  const scrollRef = useRef();

  const markMessagesAsRead = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/chatbot/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // data is desc by created_at, so reverse to show oldest first in chat flow
        const formatted = data.reverse().map(m => ({
          text: m.message,
          sender: m.sender
        }));
        setMessages(formatted);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "Chat") {
      const isHistoryRequest = searchParams.get("history") === "true";
      if (isHistoryRequest) {
        fetchMessages();
      } else {
        setMessages([]); // Clear for fresh look
      }
      markMessagesAsRead();
    }
  }, [activeTab, searchParams]);

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
      console.log("Chatbot Response:", data);

      const botReply = data.response || data.answer;
      if (botReply) {
        const botMessage = { text: botReply, sender: "bot" };
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
      <Element variant={(activeTab === "History" || searchParams.get("history") === "true") ? "chat-list" : "alarm"} />

      <div className={`chat-ui ${activeTab === "History" || searchParams.get("history") === "true" ? "history-mode" : ""} ${searchParams.get("history") === "true" ? "history-detail-mode" : ""}`}>
        {activeTab === "Chat" && searchParams.get("history") !== "true" && <h1 className="page-title">Chat AI</h1>}

        {searchParams.get("history") !== "true" && (
          <div className="tabs">
            <div
              className={`tab ${activeTab === "Chat" ? "active" : ""}`}
              onClick={() => navigate("/chat")}
            >
              <ChatbubbleEllipsesOutline className="tab-icon" />
              <span>Chat</span>
            </div>
            <div
              className={`tab ${activeTab === "History" ? "active" : ""}`}
              onClick={() => navigate("/chat/history")}
            >
              <span className="tab-icon-placeholder">🕒</span>
              <span>History</span>
            </div>
            <div
              className={`tab ${activeTab === "Setting" ? "active" : ""}`}
              onClick={() => navigate("/chat/setting")}
            >
              <span className="tab-icon-placeholder">⚙️</span>
              <span>Setting</span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="chat-content-area" ref={scrollRef}>
          {activeTab === "Chat" ? (
            messages.length === 0 ? (
              <div className="suggestion-container">
                <div className="suggestion-header">Suggestion</div>
                <div className="suggestion-content">
                  <div className="character-section">
                    <img src={doctorPin} alt="Doctor Pin" className="doctor-pin-img" />
                  </div>
                  <div className="bubbles-section">
                    <div className="suggestion-bubble" onClick={() => setInputValue("해당 성분이 들어간 약 목록을 모두 보여주세요.")}>
                      <div className="bubble-title">원하는 약 목록을 물어보세요.</div>
                      <div className="bubble-desc">"해당 성분이 들어간 약 목록을 모두 보여주세요."</div>
                    </div>
                    <div className="suggestion-bubble" onClick={() => setInputValue("알레르기를 가지고 있는데 해당 성분이 들어간 약을 복용해도 괜찮을까요?")}>
                      <div className="bubble-title">알레르기 성분을 물어보세요.</div>
                      <div className="bubble-desc">"알레르기를 가지고 있는데 해당 성분이 들어간 약을 복용해도 괜찮을까요?"</div>
                    </div>
                    <div className="suggestion-bubble" onClick={() => setInputValue("제가 복용하고 있는 약과 새로운 약이 괜찮은 조합인가요?")}>
                      <div className="bubble-title">복용중인 약과의 조합을 물어보세요.</div>
                      <div className="bubble-desc">"제가 복용하고 있는 약과 새로운 약이 괜찮은 조합인가요?"</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((msg, index) => (
                  <div key={index} className={`message-bubble ${msg.sender}`}>
                    <div className="message-content">
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="loading-message">
                    메디핀이 답변을 생각 중이에요...
                  </div>
                )}
              </div>
            )
          ) : activeTab === "History" ? (
            <ChatHistory />
          ) : (
            <div className="setting-placeholder">Setting content coming soon...</div>
          )}
        </div>
      </div>

      {/* Input Area - Only show in Chat tab */}
      {activeTab === "Chat" && (
        <div className="input-section">
          <div className="input-label">What would you like to know?</div>
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Type message here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button className="send-button" onClick={handleSendMessage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="home-bar-container">
        <HomeBar />
      </div>
    </div >
  );
};

export default ChattingMain;