import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ManagerService from "../../../services/manager.service";
import { displayRole } from "../../../utils/display-utils";

interface User {
  id: number;
  username: string;
  email: string;
  isBlocked: boolean;
  roles?: Array<{ id: number; name: string }>;
  createdAt?: string;
}

const UserModeration: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadUsers(showBlockedOnly);
  }, [showBlockedOnly]);

  const loadUsers = async (blockedOnly: boolean) => {
    try {
      setLoading(true);
      setError("");
      const res = await ManagerService.getUsersForModeration({
        blockedOnly,
      });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      setActionLoadingId(userId);
      await ManagerService.blockUser(userId, {
        reason: "Нарушение правил платформы",
      });
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isBlocked: true } : user)));
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка блокировки пользователя");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      setActionLoadingId(userId);
      await ManagerService.unblockUser(userId);
      setUsers((prev) =>
        prev
          .map((user) => (user.id === userId ? { ...user, isBlocked: false } : user))
          .filter((user) => (showBlockedOnly ? user.isBlocked : true))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка разблокировки пользователя");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => {
      const roleNames = user.roles?.map((role) => role.name).join(" ") || "";
      const values = [String(user.id), user.username, user.email, roleNames];
      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [users, searchTerm]);

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Управление пользователями</h1>
          <Link
            to="/manager"
            className="px-4 py-2 bg-primary/20 rounded hover:bg-primary/30 transition"
          >
            ← Назад
          </Link>
        </div>

        <div className="panel-surface backdrop-blur-xl p-5 mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по id, username, email, роли..."
            className="flex-1 bg-white/10 border border-white/20 rounded px-4 py-2 text-white placeholder:text-white-soft"
          />
          <button
            onClick={() => setShowBlockedOnly((prev) => !prev)}
            className={`px-4 py-2 rounded border transition ${
              showBlockedOnly
                ? "bg-red-500/20 border-red-400/50 text-red-200"
                : "bg-white/5 border-white/20 text-white-soft"
            }`}
          >
            {showBlockedOnly ? "Показывать всех" : "Только заблокированные"}
          </button>
        </div>

        {error && (
          <p className="mb-6 p-3 bg-red-500/20 text-red-300 rounded border border-red-400/30">
            {error}
          </p>
        )}

        {loading ? (
          <div className="panel-surface backdrop-blur-xl p-6">
            <p className="text-white-soft">Загрузка пользователей...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="panel-surface backdrop-blur-xl p-6">
            <p className="text-white-soft">Пользователи не найдены</p>
          </div>
        ) : (
          <div className="panel-surface backdrop-blur-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-white-soft text-sm">ID</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Username</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Email</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Роли</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Статус</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleLabel =
                    user.roles && user.roles.length > 0
                      ? user.roles.map((role) => displayRole(role.name)).join(", ")
                      : "Не указано";
                  const actionLoading = actionLoadingId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-white-soft">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-white-soft">{roleLabel}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.isBlocked
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                          }`}
                        >
                          {user.isBlocked ? "Заблокирован" : "Активен"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${user.id}`} className="text-primary hover:underline">
                            Профиль
                          </Link>
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 disabled:opacity-50"
                            >
                              {actionLoading ? "..." : "Разблокировать"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(user.id)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {actionLoading ? "..." : "Блокировать"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserModeration;
