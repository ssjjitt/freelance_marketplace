import React from "react";
import { HashRouter as Router } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import Navbar from "./features/auth/components/Navbar";
import AuthService from "./services/auth.service";
import { AppRoutes } from "./routes";
import { useAppBootstrap } from "./hooks/use-app-bootstrap.hook";
import { AppDialogProvider } from "./components/ui/app-dialog";
import { ThemeProvider } from "./contexts/theme-context";

const App: React.FC = () => {
  const { isBlocked } = useAppBootstrap();

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-body/90 backdrop-blur-lg p-4">
        <div className="panel-surface w-full max-w-md border-error/50 p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-error/10">
            <TriangleAlert
              strokeWidth={1.5}
              size={40}
              className="text-error"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Ваш аккаунт заблокирован!
          </h1>
          <p className="text-white-soft mb-8">
            Доступ к платформе ограничен администратором. Если вы считаете, что
            это ошибка, пожалуйста, свяжитесь с поддержкой.
          </p>
          <button
            type="button"
            onClick={() => {
              AuthService.logout();
              window.location.reload();
            }}
            className="ui-btn-outline-danger w-full py-2.5"
          >
            Выйти из аккаунта
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <AppDialogProvider>
          <Navbar />
          <AppRoutes />
        </AppDialogProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
