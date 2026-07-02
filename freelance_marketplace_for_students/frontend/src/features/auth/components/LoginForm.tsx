import React, { useState } from "react";
import AuthService from "../../../services/auth.service";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    AuthService.login(username, password).then(
      () => {
        window.location.href = "/profile";
      },
      (error: unknown) => {
        const msg =
          (error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Ошибка входа";
        setMessage(msg);
      }
    );
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-card">
        <h2 className="auth-title">Логин</h2>

        <input
          id="username"
          type="text"
          placeholder="Логин"
          className="auth-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          id="password"
          type="password"
          placeholder="Пароль"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="auth-btn-primary">
          Войти
        </button>
      </form>

      {message && (
        <p
          className={`msg-box ${
            message.includes("успешна") ? "msg-success" : "msg-error"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default LoginForm;
