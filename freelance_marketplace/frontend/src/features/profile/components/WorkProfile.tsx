import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import ProfileService from "../../../services/profile.service";
import AuthService from "../../../services/auth.service";
import ChatService from "../../../services/chat.service";
import RatingService from "../../../services/rating.service";
import FavoriteService from "../../../services/favorite.service";
import AdminService from "../../../services/admin.service";
import ReportService from "../../../services/report.service";
import ResumesList from "../../resume/components/ResumesList";
import RatingForm from "../../rating/components/RatingForm";
import avatarPlaceholder from "../../../assets/images/user.svg";
import { appDialog } from "../../../components/ui/app-dialog";

type Contact = {
  id: number;
  platform: string;
  username?: string | null;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
  isPublic?: boolean;
};

type WorkProfilePayload = {
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    roles: string[];
    isBlocked?: boolean;
  };
  summary: {
    location: string;
    phone: string;
    website: string;
    availability: string;
  };
  stats: {
    applicationsCount: number;
    rating: number;
  };
  skills: string[];
  education: string;
  contacts: {
    messengers: Contact[];
    socialNetworks: Contact[];
    other: Contact[];
  };
  about: string;
  avatar?: string | null;
  lastSeen?: string | null;
  profileViews?: number;
};

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  darkness: number;
  grain: number;
  temperature: number;
}

const WorkProfile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser() as { id?: number; roles?: string[]; username?: string } | null;
  const isOwnProfile = !id || (currentUser && Number(id) === currentUser.id);
  const isAdmin = currentUser?.username === "admin" || currentUser?.roles?.some((r: string) => r.toUpperCase().includes("ADMINISTRATOR"));
  
  const [profile, setProfile] = useState<WorkProfilePayload | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [error, setError] = useState<string>("");
  const [ratings, setRatings] = useState<any[]>([]);
  const [, setLoadingRatings] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState<boolean>(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [filters, setFilters] = useState<ImageFilters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    darkness: 0,
    grain: 0,
    temperature: 0
  });
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadRatings(userId: number): Promise<void> {
    try {
      setLoadingRatings(true);
      const response = await RatingService.getRatings({ userId });
      const filteredRatings = response.data.filter(
        (rating: { order?: { status?: string }; service?: { status?: string } }) =>
          (!rating.order && !rating.service) ||
          (rating.order && rating.order.status === "completed") ||
          (rating.service && rating.service.status === "completed")
      );
      setRatings(filteredRatings);
    } catch (error) {
      console.error("Ошибка загрузки отзывов:", error);
    } finally {
      setLoadingRatings(false);
    }
  }

  async function checkFavoriteStatus(): Promise<void> {
    try {
      const res = await FavoriteService.getFavorites();
      const favorites = res.data;
      const isFav = favorites.some((f: { executerId?: number }) => f.executerId === profile?.user.id);
      setIsFavorite(isFav);
    } catch (error) {
      console.error("Ошибка проверки избранного:", error);
    }
  }

  const reloadProfile = useCallback(async () => {
    setStatus("loading");
    setProfile(null);
    setError("");
    try {
      const own = !id || (currentUser?.id != null && Number(id) === currentUser.id);
      if (own) {
        const response = await ProfileService.getWorkProfile<WorkProfilePayload>();
        setProfile(response.data);
        setStatus("ready");
      } else if (id) {
        const response = await ProfileService.getUserWorkProfile<WorkProfilePayload>(Number(id));
        setProfile(response.data);
        setStatus("ready");
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      const message =
        apiError.response?.data?.message ||
        "Не удалось загрузить профиль. Попробуйте позже.";
      setError(message);
      setStatus("error");
    }
  }, [id, currentUser?.id]);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  useEffect(() => {
    const uid = profile?.user?.id;
    if (!uid) return;
    let cancelled = false;

    (async () => {
      await loadRatings(uid);
      if (cancelled) return;
      if (currentUser?.id != null && uid !== currentUser.id) {
        await checkFavoriteStatus();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.user?.id, currentUser?.id]);

  const toggleFavorite = async () => {
    if (!profile) return;
    try {
      if (isFavorite) {
        await FavoriteService.removeFavorite(profile.user.id);
        setIsFavorite(false);
      } else {
        await FavoriteService.addFavorite(profile.user.id);
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error("Ошибка обновления избранного:", error);
      void appDialog.alert(error.response?.data?.message || "Ошибка обновления избранного", "error");
    }
  };

  useEffect(() => {
    if (showAvatarEditor && avatarImage) {
      drawImage();
    }
  }, [showAvatarEditor, avatarImage, zoom, rotation, flipHorizontal, filters, imagePosition]);

  const handleStartChat = async (): Promise<void> => {
    if (!profile || !currentUser) return;
    try {
      const response = await ChatService.getOrCreateChat(profile.user.id);
      navigate(`/chats?chatId=${response.data.id}`);
    } catch (error) {
      console.error("Ошибка создания чата:", error);
      void appDialog.alert("Не удалось создать чат", "error");
    }
  };

  const handleBlockUser = async () => {
    if (!profile) return;
    if (
      !(await appDialog.confirm("Вы уверены, что хотите заблокировать этого пользователя?", {
        danger: true,
      }))
    )
      return;
    const raw = await appDialog.prompt("Укажите причину блокировки:", {
      placeholder: "Причина (необязательно)",
    });
    const reason =
      raw !== null && raw.trim() ? raw.trim() : "Нарушение правил платформы";
    try {
        await AdminService.blockUser(profile.user.id, reason);
        setProfile({ ...profile, user: { ...profile.user, isBlocked: true } });
    } catch (error: any) {
        void appDialog.alert(error.response?.data?.message || "Ошибка блокировки", "error");
    }
  };

  const handleUnblockUser = async () => {
    if (!profile) return;
    try {
        await AdminService.unblockUser(profile.user.id);
        setProfile({ ...profile, user: { ...profile.user, isBlocked: false } });
    } catch (error: any) {
        void appDialog.alert(error.response?.data?.message || "Ошибка разблокировки", "error");
    }
  };

  const handleReportUser = async () => {
    if (!profile) return;
    const reason = await appDialog.prompt("Опишите причину жалобы на пользователя:", {
      placeholder: "Текст жалобы",
    });
    if (reason === null || !reason.trim()) return;
    try {
      await ReportService.createReport({
        targetId: profile.user.id,
        targetType: "user",
        reason: reason.trim(),
      });
      void appDialog.alert("Жалоба отправлена менеджеру", "success");
    } catch (error: any) {
      void appDialog.alert(error.response?.data?.message || "Ошибка отправки жалобы", "error");
    }
  };

  const getAvailabilityColor = (availability: string): string => {
    const avail = availability.toLowerCase();
    if (avail.includes('свободен') || avail.includes('свободна') || avail.includes('открыт')) {
      return 'bg-success/20 text-success border-success/50';
    } else if (avail.includes('занят') || avail.includes('занята')) {
      return 'bg-error/20 text-error border-error/50';
    } else if (avail.includes('частично')) {
      return 'border-primary/35 bg-white/5 text-primary';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
  };

  const stats = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      {
        label: "Откликов",
        value: profile.stats.applicationsCount,
      },
      {
        label: "Средняя оценка",
        value: profile.stats.rating.toFixed(1),
      },
    ];
  }, [profile]);

  if (status === "loading") {
    return (
      <div className="login_container">
        <div className="login_form">
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="login_container">
        <div className="login_form">
          <p className="message-box error">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarImage(result);
        setZoom(1);
        setRotation(0);
        setFlipHorizontal(false);
        setImagePosition({ x: 0, y: 0 });
        setFilters({
          brightness: 100,
          contrast: 100,
          saturation: 100,
          darkness: 0,
          grain: 0,
          temperature: 0
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const applyFiltersToImageData = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    const brightness = filters.brightness / 100;
    const contrast = filters.contrast / 100;
    const saturation = filters.saturation / 100;
    const darkness = filters.darkness / 100;
    const temperature = filters.temperature;
    const grain = filters.grain;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      r *= brightness;
      g *= brightness;
      b *= brightness;

      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
      g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
      b = Math.max(0, Math.min(255, factor * (b - 128) + 128));

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);

      r *= (1 - darkness);
      g *= (1 - darkness);
      b *= (1 - darkness);

      if (temperature > 0) {
        r += temperature * 0.5;
        b -= temperature * 0.5;
      } else {
        r += temperature * 0.5;
        b -= temperature * 0.5;
      }

      if (grain > 0) {
        const noise = (Math.random() - 0.5) * grain * 2;
        r = Math.max(0, Math.min(255, r + noise));
        g = Math.max(0, Math.min(255, g + noise));
        b = Math.max(0, Math.min(255, b + noise));
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    return imageData;
  };

  const drawImage = (): void => {
    if (!canvasRef.current || !avatarImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      tempCtx.drawImage(img, 0, 0);

      let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      imageData = applyFiltersToImageData(imageData);
      tempCtx.putImageData(imageData, 0, 0);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipHorizontal ? -1 : 1, 1);
      
      const scale = zoom;
      const imgWidth = tempCanvas.width * scale;
      const imgHeight = tempCanvas.height * scale;
      
      ctx.translate(imagePosition.x, imagePosition.y);
      ctx.drawImage(tempCanvas, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
      ctx.restore();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      const gridSize = canvas.width / 3;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
      }
    };
    img.src = avatarImage;
    imageRef.current = img;
  };

  const handleZoomIn = (): void => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = (): void => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = (): void => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFlip = (): void => {
    setFlipHorizontal(prev => !prev);
  };

  const handleCrop = (): void => {
    if (!canvasRef.current || !avatarImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = 500;
    croppedCanvas.height = 500;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;

    croppedCtx.putImageData(imageData, 0, 0);
    
    const croppedDataUrl = croppedCanvas.toDataURL('image/png');
    setAvatarImage(croppedDataUrl);
    setZoom(1);
    setRotation(0);
    setFlipHorizontal(false);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleSaveAvatar = async (): Promise<void> => {
    if (!canvasRef.current || !avatarImage) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Не удалось получить контекст canvas");
      }

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Ошибка загрузки изображения"));
        img.onload = () => {
          try {
            canvas.width = 500;
            canvas.height = 500;
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) {
              reject(new Error("Не удалось создать временный canvas"));
              return;
            }

            tempCtx.drawImage(img, 0, 0);

            let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            imageData = applyFiltersToImageData(imageData);
            tempCtx.putImageData(imageData, 0, 0);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipHorizontal ? -1 : 1, 1);
            
            const scale = zoom;
            const imgWidth = tempCanvas.width * scale;
            const imgHeight = tempCanvas.height * scale;
            
            ctx.translate(imagePosition.x, imagePosition.y);
            ctx.drawImage(tempCanvas, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
            ctx.restore();
            
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        img.src = avatarImage;
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some((val, idx) => idx % 4 !== 3 && val !== 0);
      if (!hasContent) {
        throw new Error("Canvas пустой, изображение не было отрисовано");
      }

      let quality = 0.85;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      while (dataUrl.length > 6000000 && quality > 0.5) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      
      if (dataUrl.length > 6000000) {
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = 400;
        smallCanvas.height = 400;
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.drawImage(canvas, 0, 0, 400, 400);
          dataUrl = smallCanvas.toDataURL('image/jpeg', 0.8);
        }
      }
      
      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error("Не удалось получить данные изображения");
      }
      
      await ProfileService.uploadAvatar(dataUrl);
      setShowAvatarEditor(false);
      void reloadProfile();
      
      window.dispatchEvent(new CustomEvent('avatarUpdated'));
    } catch (error: any) {
      console.error("Ошибка сохранения аватара:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Ошибка сохранения аватара";
      void appDialog.alert(`Ошибка сохранения аватара: ${errorMessage}`, "error");
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isDragging && dragStart) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    setDragStart(null);
  };

  const updateFilter = (filterName: keyof ImageFilters, value: number): void => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const renderContact = (contact: Contact) => {
    if (contact.url) {
      return (
        <a
          href={contact.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {contact.url.replace(/^https?:\/\//, "")}
        </a>
      );
    }

    if (contact.username) {
      return <span>@{contact.username}</span>;
    }

    if (contact.phone) {
      return <span>{contact.phone}</span>;
    }

    if (contact.email) {
      return <span>{contact.email}</span>;
    }

    return <span>—</span>;
  };

  const contactsOrder: Array<{
    key: keyof WorkProfilePayload["contacts"];
    title: string;
  }> = [
    { key: "messengers", title: "Мессенджеры" },
    { key: "socialNetworks", title: "Социальные сети" },
    { key: "other", title: "Другие контакты" },
  ];

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-8 text-white">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative inline-block">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Аватар"
                  className="w-24 h-24 rounded-full bg-white/5 border border-white/10 object-cover"
                />
              ) : (
            <img
              src={avatarPlaceholder}
              alt="Аватар"
              className="w-24 h-24 rounded-full bg-white/5 p-4 border border-white/10 object-contain"
            />
              )}
              {isOwnProfile && (
                <button
                  onClick={() => {
                    setShowAvatarEditor(true);
                    if (profile.avatar) {
                      setAvatarImage(profile.avatar);
                    }
                  }}
                  className="absolute z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-surface text-white transition-all hover:border-primary/40 hover:bg-gradient-to-br hover:from-surface hover:to-primary/10"
                  title="Изменить аватар"
                  style={{ top: '2px', right: '2px' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-primary text-sm uppercase tracking-[3px] mb-1">
                {profile.user.roles.join(" / ") || "Специалист"}
              </p>
              <h1 className="text-3xl font-semibold mb-2">
                {profile.user.fullName}
              </h1>
              <p className="text-white mb-3">{profile.summary.location}</p>
              {profile.profileViews !== undefined && (
                <p className="text-white-soft text-sm mb-3">
                  Просмотров профиля: {profile.profileViews}
                </p>
              )}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <span className={`border rounded-full px-4 py-1 text-sm ${getAvailabilityColor(profile.summary.availability)}`}>
                  {profile.summary.availability}
                </span>
                {profile.summary.phone && (
                  <span className="border border-white/20 rounded-full px-4 py-1 text-sm">
                    {profile.summary.phone}
                  </span>
                )}
                {profile.summary.website && (
                  <a
                    href={profile.summary.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white/20 rounded-full px-4 py-1 text-sm hover:border-primary/40 transition-colors"
                  >
                    {profile.summary.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {isOwnProfile && (
                <Link
                  to="/profile/edit"
                  className="border border-white/25 rounded-full px-4 py-1 text-sm hover:border-primary/40 transition-colors"
                >
                  Редактировать
                </Link>
                )}
              </div>
            </div>

            {!isOwnProfile && currentUser && (
              <div className="flex flex-col gap-3 w-full md:w-auto md:ml-auto mt-4 md:mt-0 min-w-[200px]">
                <button
                  onClick={handleStartChat}
                  className="ui-btn-primary flex w-full items-center justify-center gap-2 py-2 text-sm font-medium"
                >
                  <span>Написать сообщение</span>
                </button>
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="ui-btn-outline flex w-full items-center justify-center gap-2 py-2 text-sm font-medium"
                >
                  <span>Оставить отзыв</span>
                </button>
                <button
                  onClick={handleReportUser}
                  className="rounded-xl border border-white/20 py-2 px-4 text-sm font-medium text-white transition-colors hover:border-danger/50 hover:text-danger"
                >
                  Пожаловаться
                </button>
                {currentUser.roles?.some(r => r.toUpperCase().includes("CUSTOMER")) && profile.user.roles.some(r => r.toUpperCase().includes("EXECUTER")) && (
                  <button
                    onClick={toggleFavorite}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 px-4 text-sm font-medium transition-colors ${
                      isFavorite 
                        ? "border-primary/40 bg-white/10 text-primary" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <Heart
                      strokeWidth={1.5}
                      size={16}
                      className={isFavorite ? "fill-current" : ""}
                    />
                    <span>{isFavorite ? "В избранном" : "В избранное"}</span>
                  </button>
                )}
                {isAdmin && (
                    profile.user.isBlocked ? (
                        <button
                            onClick={handleUnblockUser}
                            className="w-full rounded-xl border border-emerald-600/50 py-2 px-4 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10"
                        >
                            Разблокировать
                        </button>
                    ) : (
                        <button
                            onClick={handleBlockUser}
                            className="w-full rounded-xl border border-error/50 py-2 px-4 text-sm font-medium text-error transition-colors hover:bg-error/10"
                        >
                            Заблокировать
                        </button>
                    )
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="panel-surface p-5 text-center backdrop-blur-xl"
            >
              <p className="text-white-soft text-sm mb-2 uppercase tracking-wide">
                {item.label}
              </p>
              {typeof item.value === 'string' ? (
                <p className="text-3xl font-semibold">{item.value}</p>
              ) : (
                <div className="flex items-center justify-center gap-1 text-3xl font-semibold">
                  {item.value}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-3">О специалисте</h2>
            <p className="text-white leading-relaxed">
              {profile.about || "Описание профиля пока не заполнено."}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Навыки</h2>
            {profile.skills.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="border border-white/20 rounded-full px-4 py-1 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-white-soft">Навыки не указаны.</p>
            )}
          </div>

          {profile.education && (
            <div>
              <h2 className="text-2xl font-semibold mb-3">Образование</h2>
              <p className="text-white">{profile.education}</p>
            </div>
          )}
        </div>

        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl space-y-8">
          <h2 className="text-2xl font-semibold">Контакты</h2>
          {contactsOrder.map(({ key, title }) => {
            const list = profile.contacts[key];

            if (!list.length) {
              return null;
            }

            return (
              <div key={key}>
                <p className="text-white-soft uppercase tracking-[3px] mb-3">
                  {title}
                </p>
                <div className="flex flex-col gap-2">
                  {list.map((contact) => (
                    <div
                      key={`${contact.platform}-${contact.id}`}
                      className="flex flex-wrap gap-2 items-center border border-white/10 rounded-xl p-3"
                    >
                      <span className="text-white font-medium min-w-[120px]">
                        {contact.platform}
                      </span>
                      <span className="text-white">
                        {renderContact(contact)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!contactsOrder.some(({ key }) => profile.contacts[key].length) && (
            <p className="text-white-soft">Контакты не добавлены.</p>
          )}
        </div>

        <ResumesList 
          executerId={profile.user.id} 
          isOwnProfile={!!isOwnProfile}
        />

        {ratings.length > 0 && (
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl space-y-6">
            <h2 className="text-2xl font-semibold">Отзывы</h2>
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="border border-white/10 rounded-xl p-5 bg-white/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < rating.rating ? 'text-primary' : 'text-white-soft'}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-white font-medium">
                        {rating.fromUser?.username || 'Пользователь'}
                      </span>
                    </div>
                    <span className="text-white-soft text-sm">
                      {new Date(rating.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-white mb-2">{rating.comment}</p>
                  )}
                  {(rating.order || rating.service) && (
                    <p className="text-white-soft text-sm">
                      {rating.order ? `Заказ: ${rating.order.title}` : `Услуга: ${rating.service.title}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showRatingModal && (
        <div className="modal-backdrop">
          <div className="modal-panel w-full max-w-md relative">
            <button
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6">
                <RatingForm 
                    toUserId={profile.user.id}
                    onSuccess={() => {
                        setShowRatingModal(false);
                        loadRatings(profile.user.id);
                        void reloadProfile(); 
                    }}
                />
            </div>
          </div>
        </div>
      )}

      {showAvatarEditor && (
        <div className="modal-backdrop">
          <div className="modal-panel w-full max-w-5xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-2xl font-semibold">Редактор аватара</h2>
                <button
                  onClick={() => setShowAvatarEditor(false)}
                  className="text-white hover:text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="ui-btn-primary px-6 py-2.5"
                >
                  Выбрать файл
                </button>
              </div>

              {avatarImage && (
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div
                      ref={containerRef}
                      className="relative bg-white/5 border border-white/20 rounded-xl overflow-hidden cursor-move"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      style={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-full"
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      />
                    </div>
                  </div>

                  <div className="w-80 flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleZoomIn}
                        className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        title="Приблизить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        <span>Приблизить</span>
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        title="Отдалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                        </svg>
                        <span>Отдалить</span>
                      </button>
                      <button
                        onClick={handleRotate}
                        className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        title="Повернуть на 90°"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Повернуть</span>
                      </button>
                      <button
                        onClick={handleFlip}
                        className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        title="Отзеркалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Отзеркалить</span>
                      </button>
                      <button
                        onClick={handleCrop}
                        className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                        title="Обрезать"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>Обрезать</span>
                      </button>
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                          showSettings ? 'border-primary/40 bg-surface text-primary' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        title="Настройки"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Настройки</span>
                      </button>
                    </div>

                    {showSettings && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 overflow-y-auto max-h-[400px]">
                        <h3 className="text-white text-lg font-semibold mb-4">Настройки изображения</h3>
                        <div className="space-y-4">
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Яркость: {filters.brightness}%</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.brightness}
                                onChange={(e) => updateFilter('brightness', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${(filters.brightness / 200) * 100}%, rgba(255,255,255,0.3) ${(filters.brightness / 200) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Контраст: {filters.contrast}%</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.contrast}
                                onChange={(e) => updateFilter('contrast', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${(filters.contrast / 200) * 100}%, rgba(255,255,255,0.3) ${(filters.contrast / 200) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Насыщенность: {filters.saturation}%</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.saturation}
                                onChange={(e) => updateFilter('saturation', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${(filters.saturation / 200) * 100}%, rgba(255,255,255,0.3) ${(filters.saturation / 200) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Затемнение: {filters.darkness}%</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={filters.darkness}
                                onChange={(e) => updateFilter('darkness', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${(filters.darkness / 100) * 100}%, rgba(255,255,255,0.3) ${(filters.darkness / 100) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Зернистость: {filters.grain}%</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={filters.grain}
                                onChange={(e) => updateFilter('grain', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${(filters.grain / 100) * 100}%, rgba(255,255,255,0.3) ${(filters.grain / 100) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <label className="block text-white text-sm mb-2">Температура: {filters.temperature}</label>
                            <div className="flex items-center h-[18px]">
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={filters.temperature}
                                onChange={(e) => updateFilter('temperature', parseInt(e.target.value))}
                                className="w-full slider-white"
                                style={{
                                  background: `linear-gradient(to right, white 0%, white ${((filters.temperature + 100) / 200) * 100}%, rgba(255,255,255,0.3) ${((filters.temperature + 100) / 200) * 100}%, rgba(255,255,255,0.3) 100%)`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 mt-auto pt-4">
                      <button
                        onClick={handleSaveAvatar}
                        disabled={!avatarImage}
                        className="ui-btn-primary w-full px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setShowAvatarEditor(false)}
                        className="bg-transparent border border-white text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-colors w-full"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WorkProfile;
