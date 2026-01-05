// front/src/pages/Register/Register.jsx
import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Element } from "../../components/Element";
import { Warning } from "../../components/Warning/Warning";
import { useNavigate } from "react-router-dom";
import line from "./line.svg";
import "./style.css";
import { API_BASE_URL } from "../../api/config";

const API_URL = `${API_BASE_URL}/register`;

const Register = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [age, setAge] = useState("");

  const [warningType, setWarningType] = useState(null);

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPassword = (value) => value.length >= 8;

  const parseErrorMessage = async (res) => {
    const raw = await res.text(); // JSON이든 text든 우선 확보
    let data = null;

    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    // FastAPI: {"detail": "..."} 또는 {"detail":[{msg:...}, ...]} 케이스 대응
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail.map((d) => d.msg).join(", ");
      }
      return String(data.detail);
    }

    return raw || `요청 실패 (${res.status})`;
  };

  const handleRegister = async () => {
    // 프론트 유효성 검사
    if (!isValidEmail(email)) {
      setWarningType("unrequire-email");
      return;
    }
    if (!isValidPassword(password)) {
      setWarningType("unrequire-password");
      return;
    }
    if (password !== confirmPassword) {
      setWarningType("incorrect-password-confirm");
      return;
    }

    const ageNum = Number(age);
    if (!Number.isInteger(ageNum) || ageNum <= 0) {
      alert("나이를 올바르게 입력해주세요.");
      return;
    }
    if (!name || !phoneNum) {
      alert("이름/전화번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          phone_num: phoneNum,
          age: ageNum,
        }),
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        alert(msg); // 여기서 400의 원인이 정확히 뜹니다(예: "이미 존재하는 이메일입니다.")
        return;
      }

      // ✅ 성공일 때만 완료 Warning
      setWarningType("register-complete");
    } catch (err) {
      console.error("🔴 Register Network Error:", err);
      alert(`회원가입 중 네트워크 오류가 발생했습니다.\n주소: ${API_BASE_URL}\n상세: ${err.message}`);
    }
  };

  const handleCloseWarning = () => {
    if (warningType === "register-complete") {
      navigate("/login");
      return;
    }
    setWarningType(null);
  };

  return (
    <div className="register">
      {warningType && (
        <Warning one={warningType} onClose={handleCloseWarning} />
      )}

      <Element variant="simple" />

      <div className="frame-2">
        <div className="frame-3">
          <div className="frame-wrapper">
            <div className="div-wrapper">
              <div className="text-wrapper-2">Join our PIN!</div>
            </div>
          </div>

          <div className="frame-4">
            <div className="frame-5">
              <div className="input-wrap">
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
                {!email && <span>ID (E-mail)</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>

            <div className="frame-5">
              <div className="input-wrap">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {!password && <span>Password</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>

            <div className="frame-5">
              <div className="input-wrap">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {!confirmPassword && <span>Confirm Password</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>

            <div className="frame-5">
              <div className="input-wrap">
                <input value={name} onChange={(e) => setName(e.target.value)} />
                {!name && <span>Name</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>

            <div className="frame-5">
              <div className="input-wrap">
                <input
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                />
                {!phoneNum && <span>Phone-number</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>

            <div className="frame-5">
              <div className="input-wrap">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
                {!age && <span>Age</span>}
              </div>
              <img className="line" src={line} alt="" />
            </div>
          </div>
        </div>

        <Button
          one="register"
          className="button-instance"
          onClick={handleRegister}
        />
      </div>
    </div>
  );
};

export default Register;
