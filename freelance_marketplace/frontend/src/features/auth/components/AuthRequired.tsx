import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../../../services/auth.service";

const AuthRequired: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    AuthService.login(username, password).then(
      () => {
        window.location.reload();
      },
      (error: any) => {
        setMessage(error.response?.data?.message || "Ошибка входа");
      }
    );
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-md mx-auto">
        <div className="form-panel">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Требуется авторизация
            </h2>
            <p className="text-white">
              Для доступа к этой странице необходимо войти в систему
            </p>
          </div>

          <div className="flex gap-2 mb-6 border-b border-white/20">
            <button
              onClick={() => {
                setShowLogin(true);
                setMessage("");
              }}
              className={`flex-1 py-2 text-center transition-colors ${
                showLogin
                  ? "border-b-2 border-primary text-primary"
                  : "text-white-soft hover:text-white"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => {
                setShowLogin(false);
                setMessage("");
              }}
              className={`flex-1 py-2 text-center transition-colors ${
                !showLogin
                  ? "border-b-2 border-primary text-primary"
                  : "text-white-soft hover:text-white"
              }`}
            >
              Регистрация
            </button>
          </div>

          {showLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Логин"
                  className="ui-input py-2.5"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Пароль"
                  className="ui-input py-2.5"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="ui-btn-primary w-full cursor-pointer py-2.5"
              >
                Войти
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-white text-center mb-4">
                Для регистрации перейдите на страницу регистрации
              </p>
              <Link
                to="/register"
                className="ui-btn-primary block w-full py-2.5 text-center"
              >
                Зарегистрироваться
              </Link>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 rounded-xl p-3 text-center ${
                message.includes("успешн") || message.includes("успешно")
                  ? "bg-success/20 text-success"
                  : "bg-error/20 text-error"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/catalog"
              className="text-sm text-primary transition-colors hover:text-primary-hover"
            >
              Вернуться в каталог
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthRequired;

