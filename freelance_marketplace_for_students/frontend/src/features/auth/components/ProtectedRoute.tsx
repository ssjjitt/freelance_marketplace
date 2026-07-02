import React from "react";
import AuthService from "../../../services/auth.service";
import AuthRequired from "./AuthRequired";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowPublic?: boolean;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowPublic = false,
  requiredRoles = [],
}) => {
  const currentUser = AuthService.getCurrentUser();

  if (allowPublic) {
    return children;
  }

  if (!currentUser) {
    return <AuthRequired />;
  }

  // Проверка роли если требуется
  if (requiredRoles.length > 0) {
    const userRole = currentUser.role || currentUser.roles?.[0];
    
    // Нормализуем роль: убираем ROLE_ префикс и переводим в нижний регистр
    let normalizedRole = userRole;
    if (userRole && typeof userRole === 'string') {
      normalizedRole = userRole
        .replace(/^ROLE_/i, '') // удаляем ROLE_ префикс
        .toLowerCase(); // переводим в нижний регистр
    }
    
    // Нормализуем требуемые роли для сравнения
    const normalizedRequiredRoles = requiredRoles.map(r => 
      r.replace(/^ROLE_/i, '').toLowerCase()
    );
    
    if (!normalizedRole || !normalizedRequiredRoles.includes(normalizedRole)) {
      return (
        <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl mx-auto text-white">
            <div className="panel-surface p-8 backdrop-blur-xl">
              <p className="text-2xl font-bold mb-4 text-red-400">Доступ запрещен</p>
              <p className="text-white-soft mb-4">У вас недостаточно прав для доступа к этой странице.</p>
              <a href="/" className="text-primary hover:underline">← На главную</a>
            </div>
          </div>
        </section>
      );
    }
  }

  return children;
};

export default ProtectedRoute;

