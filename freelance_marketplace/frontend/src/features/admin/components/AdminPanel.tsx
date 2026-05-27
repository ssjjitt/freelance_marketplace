import React, { useState, useEffect } from "react";
import AdminService from "../../../services/admin.service";
import CategoryService from "../../../services/category.service";
import { Link } from "react-router-dom";

interface User {
  id: number;
  username: string;
  email: string;
  isBlocked: boolean;
  roles?: { name: string }[];
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Resume {
  id: number;
  title: string;
  executer: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingResumes, setPendingResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, categoriesRes, resumesRes] = await Promise.all([
        AdminService.getAllUsers(),
        CategoryService.getCategories(),
        AdminService.getPendingResumes()
      ]);
      setUsers(usersRes.data);
      setCategories(categoriesRes.data);
      setPendingResumes(resumesRes.data);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      await AdminService.blockUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: true } : u));
      setMessage("Пользователь заблокирован");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка блокировки");
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await AdminService.unblockUser(userId);
      setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: false } : u));
      setMessage("Пользователь разблокирован");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка разблокировки");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CategoryService.createCategory({
        name: newCategoryName,
        description: newCategoryDesc || undefined
      });
      setNewCategoryName("");
      setNewCategoryDesc("");
      await loadData();
      setMessage("Категория создана");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка создания категории");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await CategoryService.deleteCategory(id);
      await loadData();
      setMessage("Категория удалена");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка удаления категории");
    }
  };

  const handleApproveResume = async (id: number) => {
    try {
      await AdminService.approveResume(id);
      setPendingResumes(pendingResumes.filter(r => r.id !== id));
      setMessage("Резюме одобрено");
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка одобрения резюме");
    }
  };

  if (loading) {
    return (
      <div className="login_container">
        <div className="login_form">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="form-panel mb-8">
          <h1 className="text-3xl font-semibold mb-4">Панель администратора</h1>
          {message && (
            <p className={`message-box ${message.includes("успеш") ? "success" : "error"}`}>
              {message}
            </p>
          )}
          <Link 
            to="/admin/moderation" 
            className="inline-block mt-4 px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl transition-colors font-semibold"
          >
            Перейти на панель модерации →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="form-panel">
            <h2 className="text-2xl font-semibold mb-6">Пользователи</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-white/10 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-white-soft text-sm">{user.email}</p>
                      <p className={`text-xs mt-1 ${user.isBlocked ? "text-error" : "text-success"}`}>
                        {user.isBlocked ? "Заблокирован" : "Активен"}
                      </p>
                    </div>
                    {user.isBlocked ? (
                      <button
                        onClick={() => handleUnblock(user.id)}
                        className="rounded-xl border border-emerald-600/50 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400 transition-colors hover:bg-emerald-500/20"
                      >
                        Разблокировать
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlock(user.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                      >
                        Заблокировать
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-panel">
            <h2 className="text-2xl font-semibold mb-6">Категории</h2>
            
            <form onSubmit={handleCreateCategory} className="mb-6 space-y-4">
              <input
                type="text"
                required
                placeholder="Название категории"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="ui-input"
              />
              <textarea
                placeholder="Описание"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                rows={2}
                className="ui-textarea"
              />
              <button
                type="submit"
                className="ui-btn-primary w-full cursor-pointer"
              >
                Создать категорию
              </button>
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    {cat.description && (
                      <p className="text-white-soft text-sm">{cat.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-panel lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Резюме на модерации</h2>
              {pendingResumes.length > 5 && (
                <Link 
                  to="/admin/resumes" 
                  className="text-sm text-primary transition-colors hover:text-primary-hover"
                >
                  Показать все ({pendingResumes.length})
                </Link>
              )}
            </div>
            
            {pendingResumes.length === 0 ? (
              <p className="text-white-soft">Нет резюме, ожидающих проверки.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingResumes.slice(0, 5).map((resume) => (
                  <div key={resume.id} className="flex flex-col justify-between rounded-xl border border-white/10 p-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{resume.title}</h3>
                        <span className="text-xs text-white-soft">{new Date(resume.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white mb-2">Исполнитель: {resume.executer.username} ({resume.executer.email})</p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Link 
                        to={`/resumes/${resume.id}`} 
                        className="ui-btn-outline flex-1 py-2 text-center text-sm"
                        target="_blank"
                      >
                        Просмотреть
                      </Link>
                      <button
                        onClick={() => handleApproveResume(resume.id)}
                        className="ui-btn-primary flex-1 py-2 text-sm"
                      >
                        Одобрить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;

