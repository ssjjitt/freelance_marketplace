import React, { useState, useEffect, useRef } from "react";
import AuthService from "../../../services/auth.service";
import ProfileService from "../../../services/profile.service";
import ChatService from "../../../services/chat.service";
import { Link, NavLink, useNavigate } from "react-router-dom";
import CategoryService from "../../../services/category.service";
import NotificationService from "../../../services/notification.service";
import websocketService from "../../../services/websocket.service";
import {
  Bell,
  ChevronDown,
  Heart,
  List,
  LogOut,
  Menu,
  MessageSquare,
  Pencil,
  Search,
  User,
  X,
} from "lucide-react";
import { ThemeToggle } from "../../../components/ui/theme-toggle";

const iNav = { strokeWidth: 1.5, size: 20 } as const;
const iMenu = { strokeWidth: 1.5, size: 18 } as const;

interface Category {
  id: number;
  name: string;
}

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const currentUser = AuthService.getCurrentUser() as {
    username: string;
    roles?: string[];
    id?: number;
  } | null;
  const userRoles = currentUser?.roles || [];
  const hasCustomerRole = userRoles.some((r: string) => r.toUpperCase().includes("CUSTOMER"));
  const hasExecuterRole = userRoles.some((r: string) => r.toUpperCase().includes("EXECUTER"));
  const isAdmin = currentUser?.username === "admin" || userRoles.some((r: string) => r.toUpperCase().includes("ADMINISTRATOR"));

  useEffect(() => {
    loadCategories();
    if (currentUser) {
      loadUnreadNotificationsCount();
      loadUnreadChatsCount();
      loadUserAvatar();

      const handleNewNotification = () => {
        loadUnreadNotificationsCount();
      };

      const handleNotificationsUpdated = () => {
        loadUnreadNotificationsCount();
      };

      const handleChatsUpdated = () => {
        loadUnreadChatsCount();
      };

      websocketService.onNotification(handleNewNotification);
      websocketService.onNotificationsUpdated(handleNotificationsUpdated);
      websocketService.onChatsUpdated(handleChatsUpdated);
      websocketService.onNewMessage(handleChatsUpdated);

      return () => {
        websocketService.offNotification(handleNewNotification);
        websocketService.offNotificationsUpdated(handleNotificationsUpdated);
        websocketService.offChatsUpdated(handleChatsUpdated);
        websocketService.offNewMessage(handleChatsUpdated);
      };
    } else {
      websocketService.disconnect();
      setUserAvatar(null);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (
        categoriesRef.current &&
        !categoriesRef.current.contains(event.target as Node)
      ) {
        setCategoriesOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleFocus = () => {
      if (currentUser) {
        loadUserAvatar();
        loadUnreadNotificationsCount();
        loadUnreadChatsCount();
      }
    };

    const handleAvatarUpdated = () => {
      if (currentUser) {
        loadUserAvatar();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
    };
  }, [currentUser?.id]);

  const loadCategories = async () => {
    try {
      const res = await CategoryService.getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error("Ошибка загрузки категорий:", error);
    }
  };

  const loadUnreadNotificationsCount = async () => {
    try {
      const res = await NotificationService.getUnreadCount();
      setUnreadNotificationsCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Ошибка загрузки количества уведомлений:", error);
    }
  };

  const loadUnreadChatsCount = async () => {
    try {
      const res = await ChatService.getUnreadCount();
      setUnreadChatsCount(res.data.unreadCount || 0);
    } catch (error) {
      console.error("Ошибка загрузки количества непрочитанных сообщений:", error);
    }
  };

  const loadUserAvatar = async () => {
    try {
      const res = await ProfileService.getProfile<{ profile?: { avatar?: string } }>();
      const avatar = res.data?.profile?.avatar;
      if (avatar) {
        setUserAvatar(avatar);
      }
    } catch (error) {
      console.error("Ошибка загрузки аватара:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="navbar-btn"
            >
              <Menu {...iNav} />
            </button>

            <Link to="/" className="navbar-brand">
              Freelance
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
          {currentUser ? (
            <div className="navbar-icons">
              {/* SEARCH */}
              <form onSubmit={handleSearch} className="navbar-search-wrapper">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск заказов, услуг и пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="navbar-search"
                  />
                  <button type="submit" className="navbar-search-btn">
                    <Search {...iNav} />
                  </button>
                </div>
              </form>

              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `navbar-btn relative${isActive ? " text-primary" : ""}`
                }
              >
                <Bell {...iNav} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-xl border border-primary/35 bg-white/5 px-1.5 py-0.5 text-center text-xs text-primary">
                    {unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/chats"
                className={({ isActive }) =>
                  `navbar-btn relative${isActive ? " text-primary" : ""}`
                }
              >
                <MessageSquare {...iNav} />
                {unreadChatsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-xl border border-primary/35 bg-white/5 px-1.5 py-0.5 text-center text-xs text-primary">
                    {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
                  </span>
                )}
              </NavLink>

              <div className="relative" ref={profileMenuRef}>
                <button 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="navbar-btn outline-none border-none p-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
                >
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-surface text-white">
                  <User {...iMenu} />
                </div>
                )}
                </button>

                {profileMenuOpen && (
                  <div className="modal-panel absolute right-0 z-50 mt-3 w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2">
                      <NavLink
                        to="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                            isActive
                              ? "text-primary bg-white/5"
                              : "text-white-soft hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        <User {...iMenu} />
                        Профиль
                      </NavLink>
                      <NavLink
                        to="/profile/edit"
                        onClick={() => setProfileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                            isActive
                              ? "text-primary bg-white/5"
                              : "text-white-soft hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        <Pencil {...iMenu} />
                        Редактировать
                      </NavLink>
                      {!isAdmin && (
                        <>
                          <NavLink
                            to="/my-items"
                            onClick={() => setProfileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                isActive
                                  ? "text-primary bg-white/5"
                                  : "text-white-soft hover:bg-white/10 hover:text-white"
                              }`
                            }
                          >
                            <List {...iMenu} />
                            Мои заказы/услуги
                          </NavLink>
                          <NavLink
                            to="/applications"
                            onClick={() => setProfileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                isActive
                                  ? "text-primary bg-white/5"
                                  : "text-white-soft hover:bg-white/10 hover:text-white"
                              }`
                            }
                          >
                            <List {...iMenu} />
                            Отклики к моим объявлениям
                          </NavLink>
                          <NavLink
                            to="/applications/history"
                            onClick={() => setProfileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                isActive
                                  ? "text-primary bg-white/5"
                                  : "text-white-soft hover:bg-white/10 hover:text-white"
                              }`
                            }
                          >
                            <List {...iMenu} />
                            История моих откликов
                          </NavLink>
                        </>
                      )}
                      {hasCustomerRole && (
                        <NavLink
                          to="/favorites"
                          onClick={() => setProfileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                              isActive
                                ? "text-primary bg-white/5"
                                : "text-white-soft hover:bg-white/10 hover:text-white"
                            }`
                          }
                        >
                          <Heart {...iMenu} />
                          Избранное
                        </NavLink>
                      )}
                      <div className="h-px bg-white/10 my-1"></div>
                      <button 
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 border border-transparent px-4 py-3 text-left text-sm text-white/80 transition-all duration-200 hover:border-danger/50 hover:text-danger"
                      >
                        <LogOut {...iMenu} />
                        Выход
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar-link${isActive ? " navbar-link-active" : ""}`
                }
              >
                Войти
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `navbar-link${isActive ? " navbar-link-active" : ""}`
                }
              >
                Регистрация
              </NavLink>
            </div>
          )}
          </div>
        </div>
      </header>

      {currentUser && (
        <>
          <div
            className={`sidebar-backdrop ${
              menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMenuOpen(false)}
          />

          <div
            ref={menuRef}
            className={`sidebar ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex flex-col h-screen">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Меню</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="navbar-btn"
                >
                  <X {...iNav} />
                </button>
              </div>

              <nav className="sidebar-content">
                <div className="space-y-2">
                  <NavLink
                    to="/"
                    end
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Главная
                  </NavLink>

                  <NavLink
                    to="/chats"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link flex justify-between items-center${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Чаты
                    {unreadChatsCount > 0 && (
                      <span className="rounded-xl border border-primary/35 bg-white/5 px-2 py-0.5 text-xs text-primary">
                        {unreadChatsCount}
                      </span>
                    )}
                  </NavLink>
                  
                  <NavLink
                    to="/notifications"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link flex justify-between items-center${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Уведомления
                    {unreadNotificationsCount > 0 && (
                      <span className="rounded-xl border border-primary/35 bg-white/5 px-2 py-0.5 text-xs text-primary">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </NavLink>

                  {hasCustomerRole && (
                    <NavLink
                      to="/orders/new"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                      }
                    >
                      Новый заказ
                    </NavLink>
                  )}

                  {hasExecuterRole && (
                    <NavLink
                      to="/services/new"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                      }
                    >
                      Новая услуга
                    </NavLink>
                  )}

                  {!isAdmin && (
                    <>
                      <NavLink
                        to="/my-items"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                        }
                      >
                        Управление заказами/услугами
                      </NavLink>
                      <NavLink
                        to="/applications"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                        }
                      >
                        Отклики к моим объявлениям
                      </NavLink>
                      <NavLink
                        to="/applications/history"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                        }
                      >
                        История моих откликов
                      </NavLink>
                    </>
                  )}

                  {isAdmin && (
                    <NavLink
                      to="/admin/resumes"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                      }
                    >
                      Модерация резюме
                    </NavLink>
                  )}

                  {hasCustomerRole && (
                    <NavLink
                      to="/favorites"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                      }
                    >
                      Избранное
                    </NavLink>
                  )}

                  <NavLink
                    to="/catalog"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Каталог
                  </NavLink>

                  <div className="relative" ref={categoriesRef}>
                    <button
                      onClick={() => setCategoriesOpen(!categoriesOpen)}
                      className="sidebar-category-btn"
                    >
                      <span>Категории</span>
                      <ChevronDown {...iMenu} className="shrink-0 opacity-70" />
                    </button>

                    {categoriesOpen && (
                      <div className="sidebar-category-group">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/catalog?categoryId=${cat.id}`}
                            onClick={() => {
                              setCategoriesOpen(false);
                              setMenuOpen(false);
                            }}
                            className="sidebar-category-link"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <NavLink
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Профиль
                  </NavLink>

                  <NavLink
                    to="/profile/edit"
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    Настройки профиля
                  </NavLink>
                </div>
              </nav>

              <div className="sidebar-footer">
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="sidebar-logout"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
