import React from "react";
import { usePasswordStrength } from "../../../../hooks/auth.hook";

interface Props {
  username: string;
  setUsername: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  message: string;
  setMessage: (val: string) => void;
  nextStep: () => void;
}

export const Step1UserForm: React.FC<Props> = ({
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  message,
  setMessage,
  nextStep,
}) => {
  const passwordStrength = usePasswordStrength(password);
  const strengthClass =
    passwordStrength >= 4
      ? "strength-4"
      : passwordStrength === 3
      ? "strength-3"
      : passwordStrength === 2
      ? "strength-2"
      : passwordStrength === 1
      ? "strength-1"
      : "";

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) return setMessage("Пароли не совпадают");
    if (passwordStrength < 3) return setMessage("Пароль слишком слабый");
    setMessage("");
    nextStep();
  };

  return (
    <form className="auth-card" onSubmit={handleNext}>
      <h2 className="auth-title">Регистрация</h2>

      <input
        type="text"
        placeholder="Логин"
        className="auth-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />

      <input
        type="email"
        placeholder="Почта"
        className="auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <input
        type="password"
        placeholder="Пароль"
        className="auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />

      <div className={`pw-strength ${strengthClass}`}>
        {[1, 2, 3, 4].map((i) => (
          <span key={i}></span>
        ))}
      </div>

      <input
        type="password"
        placeholder="Повторите пароль"
        className="auth-input"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
      />

      <button type="submit" className="auth-btn-primary">
        Продолжить
      </button>

      {message && <p className="msg-box msg-error">{message}</p>}
    </form>
  );
};
