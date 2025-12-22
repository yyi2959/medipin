// src/pages/Login/Login.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api/config";
import { Button } from "../../components/Button";
import { Element } from "../../components/Element";
import { Warning } from "../../components/Warning/Warning";
import { setTokens } from "../../auth/token";
import "./style.css";

export const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Warning 상태
  const [warningType, setWarningType] = useState("hidden");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // FastAPI가 JSON으로 응답하므로 그대로 파싱
      const data = await res.json();

      // 서버 도달은 했지만 인증 실패(401 등)
      if (!res.ok) {
        setWarningType("incorrect-password");
        return;
      }

      // 로그인 성공: access + refresh 저장
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      navigate("/search_main");
    } catch (err) {
      // 서버 자체에 연결 불가(다운/주소 오류/네트워크 등)
      console.error(err);
      setWarningType("network-error"); // Warning 컴포넌트에 타입 추가 권장
    }
  };

  return (
    <div className="login">
      {warningType !== "hidden" && (
        <Warning one={warningType} onClose={() => setWarningType("hidden")} />
      )}

      <Element variant="simple" />

      <div className="frame-2">
        <div className="frame-3">
          <div className="text-wrapper-2">Welcome</div>

          <div className="frame-4">
            <div className="div-wrapper">
              <input
                className="input-field"
                placeholder="ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="div-wrapper">
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button one="login" className="button-instance" onClick={handleLogin} />

        <div className="frame-5">
          <p className="don-t-have-an" onClick={() => navigate("/register")}>
            <span className="span">Don’t have an account?</span>
            <span className="text-wrapper-4"> Sign Up</span>
          </p>

          <div
            className="text-wrapper-5"
            onClick={() => setWarningType("forget-password")}
          >
            forget password?
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
