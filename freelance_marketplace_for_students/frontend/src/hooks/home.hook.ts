import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/auth.service";
import OrderService from "../services/order.service";
import ServiceService from "../services/service.service";
import CategoryService from "../services/category.service";
import StatsService from "../services/stats.service";
import ResumeService from "../services/resume.service";
import NotificationService from "../services/notification.service";
import type {
  PlatformStats,
  HomeCategory,
  HomeOrder,
  HomeService,
  HomeUser,
  HomeActivity,
} from "../types/home.types";

export interface MonthlyStatDay {
  day: number;
  count: number;
  date?: string;
}

export function useHomeDashboard() {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser() as {
    username: string;
    roles?: string[];
    id?: number;
  } | null;
  const userRoles = currentUser?.roles || [];
  const hasCustomerRole = userRoles.some((r: string) =>
    r.toUpperCase().includes("CUSTOMER")
  );
  const hasExecuterRole = userRoles.some((r: string) =>
    r.toUpperCase().includes("EXECUTER")
  );
  const isAdmin =
    currentUser?.username === "admin" ||
    userRoles.some((r: string) => r.toUpperCase().includes("ADMINISTRATOR"));

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [animatedStats, setAnimatedStats] = useState<PlatformStats | null>(null);
  const [popularCategories, setPopularCategories] = useState<HomeCategory[]>([]);
  const [newCategories, setNewCategories] = useState<HomeCategory[]>([]);
  const [allCategories, setAllCategories] = useState<HomeCategory[]>([]);
  const [recentOrders, setRecentOrders] = useState<HomeOrder[]>([]);
  const [recentServices, setRecentServices] = useState<HomeService[]>([]);
  const [bestFreelancers, setBestFreelancers] = useState<HomeUser[]>([]);
  const [bestCustomers, setBestCustomers] = useState<HomeUser[]>([]);
  const [activityFeed, setActivityFeed] = useState<HomeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatDay[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatType, setSelectedStatType] = useState<string>("orders");
  const [pendingResumes, setPendingResumes] = useState<unknown[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [subcategoryParentId, setSubcategoryParentId] = useState<number | null>(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryDesc, setSubcategoryDesc] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const promises: Promise<{ data?: unknown }>[] = [
        StatsService.getPlatformStats().catch(() => ({ data: null })),
        StatsService.getPopularCategories(6).catch(() => ({ data: [] })),
        StatsService.getNewCategories(6).catch(() => ({ data: [] })),
        StatsService.getBestFreelancers(6).catch(() => ({ data: [] })),
        StatsService.getBestCustomers(6).catch(() => ({ data: [] })),
        StatsService.getActivityFeed(20).catch(() => ({ data: [] })),
        CategoryService.getCategories().catch(() => ({ data: [] })),
      ];

      if (hasExecuterRole) {
        promises.push(
          OrderService.getOrders({ status: "open", catalogOnly: true }).catch(() => ({
            data: [],
          }))
        );
      }

      if (hasCustomerRole) {
        promises.push(
          ServiceService.getServices({ status: "active", catalogOnly: true }).catch(() => ({
            data: [],
          }))
        );
      }

      const results = await Promise.all(promises);

      if (results[0]?.data) setStats(results[0].data as PlatformStats);
      if (results[1]?.data) setPopularCategories(results[1].data as HomeCategory[]);
      if (results[2]?.data) setNewCategories(results[2].data as HomeCategory[]);
      if (results[3]?.data) setBestFreelancers(results[3].data as HomeUser[]);
      if (results[4]?.data) setBestCustomers(results[4].data as HomeUser[]);
      if (results[5]?.data) setActivityFeed(results[5].data as HomeActivity[]);
      if (results[6]?.data) setAllCategories(results[6].data as HomeCategory[]);

      let resultIndex = 7;

      if (hasExecuterRole && results[resultIndex]?.data) {
        const orders = (results[resultIndex].data as HomeOrder[]).slice(0, 6);
        setRecentOrders(orders);
        resultIndex++;
      }

      if (hasCustomerRole && results[resultIndex]?.data) {
        const services = (results[resultIndex].data as HomeService[]).slice(0, 6);
        setRecentServices(services);
      }
    } catch {
      /* keep UI usable */
    } finally {
      setLoading(false);
    }
  }, [hasCustomerRole, hasExecuterRole]);

  const loadAdminData = useCallback(async () => {
    try {
      const resumesRes = await ResumeService.getPendingResumes();
      setPendingResumes(resumesRes.data);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMonthlyStats = useCallback(async () => {
    try {
      const res = await StatsService.getMonthlyStats(
        selectedYear,
        selectedMonth,
        selectedStatType
      );
      setMonthlyStats((res.data || []) as MonthlyStatDay[]);
    } catch {
      setMonthlyStats([]);
    }
  }, [selectedYear, selectedMonth, selectedStatType]);

  useEffect(() => {
    void loadHomeData();
    if (isAdmin) {
      void loadAdminData();
    }
  }, [loadHomeData, loadAdminData, isAdmin]);

  useEffect(() => {
    if (isAdmin && selectedMonth && selectedYear && selectedStatType) {
      void loadMonthlyStats();
    }
  }, [isAdmin, selectedMonth, selectedYear, selectedStatType, loadMonthlyStats]);

  useEffect(() => {
    if (!stats) return;

    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.min(currentStep / steps, 1);

      setAnimatedStats({
        totalUsers: Math.floor(stats.totalUsers * progress),
        totalOrders: Math.floor(stats.totalOrders * progress),
        totalServices: Math.floor(stats.totalServices * progress),
        totalCategories: Math.floor(stats.totalCategories * progress),
        totalApplications: Math.floor(stats.totalApplications * progress),
        activeOrders: Math.floor(stats.activeOrders * progress),
        completedOrders: Math.floor(stats.completedOrders * progress),
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedStats(stats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [stats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return "По договоренности";
    return new Intl.NumberFormat("ru-BY", {
      style: "currency",
      currency: "BYN",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return formatDate(dateString);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CategoryService.createCategory({
        name: newCategoryName,
        description: newCategoryDesc || undefined,
      });
      setNewCategoryName("");
      setNewCategoryDesc("");
      setAdminMessage("Категория создана успешно");
      void loadHomeData();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка создания категории";
      setAdminMessage(msg);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryParentId) {
      setAdminMessage("Выберите родительскую категорию");
      return;
    }
    try {
      await CategoryService.createSubcategory({
        parentId: subcategoryParentId,
        name: subcategoryName,
        description: subcategoryDesc || undefined,
      });
      setSubcategoryParentId(null);
      setSubcategoryName("");
      setSubcategoryDesc("");
      setAdminMessage("Подкатегория создана успешно");
      void loadHomeData();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка создания подкатегории";
      setAdminMessage(msg);
    }
  };

  const handleApproveResume = async (resumeId: number) => {
    try {
      await ResumeService.approveResume(resumeId);
      setAdminMessage("Резюме одобрено");
      void loadAdminData();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка одобрения резюме";
      setAdminMessage(msg);
    }
  };

  const handleSendNotificationToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await NotificationService.sendNotificationToAll(notificationTitle, notificationMessage);
      setNotificationTitle("");
      setNotificationMessage("");
      setAdminMessage("Уведомление отправлено всем пользователям");
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка отправки уведомления";
      setAdminMessage(msg);
    }
  };

  const getMaxCount = () => {
    if (monthlyStats.length === 0) return 1;
    return Math.max(...monthlyStats.map((s) => s.count), 1);
  };

  return {
    navigate,
    hasCustomerRole,
    hasExecuterRole,
    isAdmin,
    stats,
    animatedStats,
    popularCategories,
    newCategories,
    allCategories,
    recentOrders,
    recentServices,
    bestFreelancers,
    bestCustomers,
    activityFeed,
    loading,
    searchQuery,
    setSearchQuery,
    monthlyStats,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedStatType,
    setSelectedStatType,
    pendingResumes,
    newCategoryName,
    setNewCategoryName,
    newCategoryDesc,
    setNewCategoryDesc,
    notificationTitle,
    setNotificationTitle,
    notificationMessage,
    setNotificationMessage,
    subcategoryParentId,
    setSubcategoryParentId,
    subcategoryName,
    setSubcategoryName,
    subcategoryDesc,
    setSubcategoryDesc,
    adminMessage,
    setAdminMessage,
    handleSearch,
    formatPrice,
    formatDate,
    formatTimeAgo,
    handleCreateCategory,
    handleCreateSubcategory,
    handleApproveResume,
    handleSendNotificationToAll,
    getMaxCount,
  };
}
