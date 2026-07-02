import React from "react";
// import AuthService from "../../../../services/auth.service";

interface Props {
  emailVerified: boolean;
  handleRegister: (e: React.FormEvent<HTMLFormElement>) => void;
  prevStep: () => void;
  message?: string;
}

export const Step3Finish: React.FC<Props> = ({
  emailVerified,
  handleRegister,
  prevStep,
  message,
}) => {
  return (
    <form className="auth-card" onSubmit={handleRegister}>
      <p className={`msg-box ${
          (message?.includes("успеш") || emailVerified) ? "msg-success" : "msg-error"
        }`}>
        {message || (emailVerified 
          ? "почта подтверждена. можно завершить регистрацию." 
          : "подтвердите почту, чтобы завершить регистрацию.")
        }
      </p>

      <button
        type="submit"
        disabled={!emailVerified}
        className={`auth-btn-primary mt-4 ${!emailVerified ? "disabled:bg-white/35 disabled:text-white-soft disabled:cursor-not-allowed" : ""}`}
      >
        Зарегистрироваться
      </button>

      <button type="button" onClick={prevStep} className="auth-btn-secondary">
        Назад
      </button>
    </form>
  );
};
