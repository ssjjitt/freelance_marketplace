import React, { useState, useEffect } from "react";
import AuthService from "../../../../services/auth.service";
import { OtpDigitInputs, formatResendCooldown } from "../../../../components/ui/OtpDigitInputs";

const RESEND_COOLDOWN_SEC = 60;

interface Props {
  roles: string[];
  handleRoleChange: (role: string) => void;
  email: string;

  verifStatus: "idle" | "sending" | "sent" | "error";
  setVerifStatus: (val: "idle" | "sending" | "sent" | "error") => void;

  message: string;
  setMessage: (val: string) => void;

  nextStep: () => void;
  prevStep: () => void;
  emailVerified: boolean;
  setEmailVerified: (val: boolean) => void;
}

export const Step2RoleEmail: React.FC<Props> = ({
  roles,
  handleRoleChange,
  email,
  verifStatus,
  setVerifStatus,
  message,
  setMessage,
  nextStep,
  prevStep,
  emailVerified,
  setEmailVerified,
}) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleSendVerification = async () => {
    try {
      setVerifStatus("sending");
      await AuthService.sendVerification(email);
      setVerifStatus("sent");
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setVerificationCode("");
      setEmailVerified(false);
      setMessage("На почту отправлен код из 4 цифр. Введите его в поля ниже.");
    } catch {
      setVerifStatus("error");
      setMessage("Не удалось отправить письмо. Попробуйте позже");
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      setMessage("Сначала укажите email на предыдущем шаге");
      return;
    }
    setCodeChecking(true);
    setMessage("");
    try {
      await AuthService.verifyEmailCode(email, verificationCode);
      setEmailVerified(true);
      setMessage("Почта подтверждена. Нажмите «Далее», чтобы завершить регистрацию.");
    } catch (err: unknown) {
      setEmailVerified(false);
      const ax = err as { response?: { data?: { message?: string } } };
      setMessage(ax.response?.data?.message || "Неверный или просроченный код");
    } finally {
      setCodeChecking(false);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerified) {
      setMessage("Сначала подтвердите код из письма.");
      return;
    }
    nextStep();
  };

  const sendButtonLabel =
    verifStatus === "sending"
      ? "Отправка..."
      : resendCooldown > 0
        ? `Отправить снова через ${formatResendCooldown(resendCooldown)}`
        : verifStatus === "sent"
          ? "Отправить код повторно"
          : "Отправить код на почту";

  const sendDisabled =
    !email || verifStatus === "sending" || resendCooldown > 0;

  return (
    <form className="auth-card" onSubmit={handleContinue}>
      <p className="text-white text-base text-center mb-2">Выберите роль</p>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => handleRoleChange("executer")}
          className={`role-btn ${roles.includes("executer") && "role-btn-active"}`}
        >
          Исполнитель
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange("customer")}
          className={`role-btn ${roles.includes("customer") && "role-btn-active"}`}
        >
          Заказчик
        </button>
      </div>

      <div className="mt-4 text-center space-y-2">
        <p className="text-xs text-white-soft">
          <span className="font-semibold text-primary">Исполнитель:</span> Может создавать услуги и выполнять заказы.
        </p>
        <p className="text-xs text-white-soft">
          <span className="font-semibold text-primary">Заказчик:</span> Может создавать заказы и покупать услуги.
        </p>
        <p className="text-xs text-white-soft italic mt-2">* Вы можете выбрать обе роли одновременно</p>
      </div>

      <button
        type="button"
        onClick={handleSendVerification}
        disabled={sendDisabled}
        className="auth-btn-primary mt-6 w-full disabled:border-white/15 disabled:bg-white/20 disabled:text-white/60"
      >
        {sendButtonLabel}
      </button>

      <div className="mt-6 flex flex-col items-center border-t border-white/10 pt-6">
        <p className="mb-4 text-center text-sm text-white-soft">Код из письма</p>
        <OtpDigitInputs
          value={verificationCode}
          onChange={setVerificationCode}
          disabled={codeChecking || !email}
        />
        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={!email || verificationCode.length !== 4 || codeChecking}
          className="auth-btn-primary mt-5 w-full max-w-xs disabled:opacity-50"
        >
          {codeChecking ? "Проверка..." : "Проверить"}
        </button>
      </div>

      {message && (
        <p
          className={`msg-box mt-4 ${
            message.includes("успеш") ||
            message.includes("отправлен") ||
            message.includes("Подтверждена") ||
            message.includes("подтверждена")
              ? "msg-success"
              : "msg-error"
          }`}
        >
          {message}
        </p>
      )}

      <button type="submit" className="auth-btn-primary mt-6 w-full" disabled={!emailVerified}>
        Далее
      </button>

      <button type="button" onClick={prevStep} className="auth-btn-secondary">
        Назад
      </button>
    </form>
  );
};
