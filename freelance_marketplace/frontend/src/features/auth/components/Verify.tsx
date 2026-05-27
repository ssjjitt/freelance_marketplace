import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../../services/auth.service";
import { OtpDigitInputs, formatResendCooldown } from "../../../components/ui/OtpDigitInputs";

const RESEND_COOLDOWN_SEC = 60;

const Verify: React.FC = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage("Укажите email");
      return;
    }
    try {
      setSendStatus("sending");
      setMessage("");
      await AuthService.sendVerification(email);
      setSendStatus("sent");
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setCode("");
      setMessage("Код отправлен. Введите 4 цифры из письма.");
    } catch {
      setSendStatus("error");
      setMessage("Не удалось отправить письмо. Попробуйте позже.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await AuthService.verifyEmailCode(email, code);
      setStatus("ok");
      setMessage("Почта подтверждена. Можно вернуться к регистрации или войти в аккаунт.");
    } catch (err: unknown) {
      setStatus("error");
      const ax = err as { response?: { data?: { message?: string } } };
      setMessage(ax.response?.data?.message || "Не удалось подтвердить код");
    }
  };

  const sendLabel =
    sendStatus === "sending"
      ? "Отправка..."
      : resendCooldown > 0
        ? `Отправить снова через ${formatResendCooldown(resendCooldown)}`
        : sendStatus === "sent"
          ? "Отправить код повторно"
          : "Отправить код на почту";

  return (
    <div className="auth-container px-4">
      <form className="auth-card max-w-md w-full" onSubmit={handleSubmit}>
        <h2 className="auth-title">Подтверждение почты</h2>
        <p className="mb-6 text-center text-sm text-white-soft">
          Укажите email, получите код и введите четыре цифры из письма.
        </p>

        <label className="mb-1.5 block text-sm font-medium text-white">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input mb-4"
          placeholder="you@example.com"
          required
        />

        <button
          type="button"
          onClick={handleSendCode}
          disabled={!email.trim() || sendStatus === "sending" || resendCooldown > 0}
          className="auth-btn-primary mb-6 w-full disabled:opacity-60"
        >
          {sendLabel}
        </button>

        <label className="mb-3 block text-center text-sm font-medium text-white-soft">Код из письма</label>
        <div className="mb-6 flex justify-center">
          <OtpDigitInputs value={code} onChange={setCode} disabled={status === "loading"} />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || code.length !== 4}
          className="auth-btn-primary disabled:opacity-60"
        >
          {status === "loading" ? "Проверка..." : "Подтвердить"}
        </button>

        {message && (
          <p
            className={`msg-box mt-4 ${
              status === "ok" || message.startsWith("Код отправлен")
                ? "msg-success"
                : "msg-error"
            }`}
          >
            {message}
          </p>
        )}

        <Link to="/login" className="auth-btn-secondary mt-4 block text-center">
          На страницу входа
        </Link>
        <Link to="/register" className="auth-btn-secondary mt-2 block text-center">
          К регистрации
        </Link>
      </form>
    </div>
  );
};

export default Verify;
