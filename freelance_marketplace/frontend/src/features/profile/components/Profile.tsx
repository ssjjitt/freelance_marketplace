import React, { useState, useEffect, useRef } from "react";
import AuthService from "../../../services/auth.service";
import ProfileService from "../../../services/profile.service";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import type { ContactPayload } from "../../../types/profile.types";

interface Contact {
  id?: number;
  platform: string;
  username?: string | null;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
  type?: "messenger" | "social" | "other";
}

interface Skill {
  name: string;
}

interface ProfileData {
  id?: number;
  lastname?: string;
  name?: string;
  birthday?: string;
  gender?: string;
  country?: string;
  city?: string;
  education?: string;
  website?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  skills?: Skill[];
  contacts?: Contact[];
}

interface ProfileResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  profile: ProfileData | null;
}

interface FormData {
  lastname: string;
  name: string;
  birthday: string;
  gender: string;
  country: string;
  city: string;
  education: string;
  website: string;
  skills: string[];
  phone: string;
  email: string;
  messengers: Contact[];
  socialNetworks: Contact[];
  otherContacts: Contact[];
}

interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  darkness: number;
  grain: number;
  temperature: number;
}

const Profile: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [availableSkills] = useState<string[]>([
    "JavaScript", "React", "Node.js", "Python", "Java", "C++", "HTML", "CSS", 
    "SQL", "MongoDB", "Git", "Docker", "AWS", "Photoshop", "Illustrator", "Figma"
  ]);

  const [formData, setFormData] = useState<FormData>({
    lastname: "",
    name: "",
    birthday: "",
    gender: "",
    country: "",
    city: "",
    education: "",
    website: "",
    skills: [],
    phone: "",
    email: "",
    messengers: [],
    socialNetworks: [],
    otherContacts: []
  });

  useEffect(() => {
    if (currentUser?.id != null) {
      loadProfile();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (showAvatarEditor && avatarImage) {
      drawImage();
    }
  }, [showAvatarEditor, avatarImage, zoom, rotation, flipHorizontal, filters, imagePosition]);

  const loadProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await ProfileService.getProfile<ProfileResponse>();
      const data = response.data;
      
      setProfileData(data);
      
      if (data.profile) {
        const profile = data.profile;
        setFormData({
          lastname: profile.lastname || "",
          name: profile.name || "",
          birthday: profile.birthday ? profile.birthday.split('T')[0] : "",
          gender: profile.gender || "",
          country: profile.country || "",
          city: profile.city || "",
          education: profile.education || "",
          website: profile.website || "",
          skills: profile.skills ? profile.skills.map(s => s.name) : [],
          phone: profile.phone || "",
          email: profile.email || "",
          messengers: profile.contacts ? profile.contacts.filter(c => c.type === 'messenger') : [],
          socialNetworks: profile.contacts ? profile.contacts.filter(c => c.type === 'social') : [],
          otherContacts: profile.contacts ? profile.contacts.filter(c => c.type === 'other') : []
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error);
      setMessage("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[] | Contact[]): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillToggle = (skill: string): void => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSave = async (): Promise<void> => {
    try {
      setMessage("");
      
      const profileDataToSave = {
        lastname: formData.lastname,
        name: formData.name,
        birthday: formData.birthday,
        gender: formData.gender,
        country: formData.country,
        city: formData.city,
        education: formData.education,
        website: formData.website,
        phone: formData.phone,
        email: formData.email
      };

      const contactsData = [
        ...formData.messengers,
        ...formData.socialNetworks,
        ...formData.otherContacts
      ];

      const skillsData = formData.skills;

      await ProfileService.updateProfile(profileDataToSave, contactsData as ContactPayload[], skillsData);
      
      setMessage("Профиль успешно обновлен!");
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
      setMessage("Ошибка сохранения профиля");
    }
  };

  const handleCancel = (): void => {
    setEditing(false);
    loadProfile(); 
    setMessage("");
  };

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
      const dataUrl = canvas.toDataURL('image/png');
      
      await ProfileService.uploadAvatar(dataUrl);
      setShowAvatarEditor(false);
      setMessage("Аватар успешно обновлен!");
      loadProfile();
    } catch (error) {
      console.error("Ошибка сохранения аватара:", error);
      setMessage("Ошибка сохранения аватара");
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

  if (!currentUser) {
    return (
      <div className="font-sans min-h-screen bg-transparent py-10 px-5 flex flex-col justify-center items-center">
        <div className="panel-surface p-10 md:p-12 w-full max-w-[1200px] mx-auto relative overflow-hidden">
          <p className="text-white text-center">
            Вы не авторизованы
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="font-sans min-h-screen bg-transparent py-10 px-5 flex flex-col justify-center items-center">
        <div className="panel-surface p-10 md:p-12 w-full max-w-[1200px] mx-auto relative overflow-hidden">
          <p className="text-white text-center">
            Загрузка профиля...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-transparent py-10 px-5 flex flex-col justify-center items-center">
      <h1 className="text-[32px] font-semibold text-white mb-8 text-center tracking-wide uppercase">Профиль</h1>
      
      <div className="panel-surface p-10 md:p-12 w-full max-w-[1200px] mx-auto relative overflow-hidden">
        <div className="mb-10 flex justify-center">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full bg-white/10 border-2 border-primary flex items-center justify-center overflow-hidden">
              {profileData?.profile?.avatar ? (
                <img 
                  src={profileData.profile.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/15 to-white/5 text-4xl font-bold text-primary">
                  {profileData?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowAvatarEditor(true);
                if (profileData?.profile?.avatar) {
                  setAvatarImage(profileData.profile.avatar);
                }
              }}
              className="absolute right-0 top-0 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-surface text-white transition-all hover:border-primary/45 hover:bg-gradient-to-br hover:from-surface hover:to-primary/15"
              title="Изменить аватар"
              style={{ transform: 'translate(25%, -25%)' }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-white text-xl font-semibold mb-5 border-b-2 border-primary pb-2.5">Основная информация</h2>
          
          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Фамилия</label>
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleInputChange('lastname', e.target.value)}
                disabled={!editing}
                placeholder="Введите фамилию"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Имя</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!editing}
                placeholder="Введите имя"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Дата рождения</label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                disabled={!editing}
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Пол</label>
              <SelectDropdown
                value={formData.gender}
                onChange={(gender) => handleInputChange('gender', gender)}
                options={[
                  { value: "male", label: "Мужской" },
                  { value: "female", label: "Женский" },
                  { value: "other", label: "Другой" }
                ]}
                placeholder="Выберите пол"
                disabled={!editing}
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Страна</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!editing}
                placeholder="Введите страну"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Город</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!editing}
                placeholder="Введите город"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Образование</label>
              <textarea
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                disabled={!editing}
                placeholder="Опишите ваше образование"
                className="w-full bg-transparent border-2 border-white text-white py-2.5 px-2.5 rounded-xl text-[15px] min-h-[80px] resize-y transition-colors placeholder:text-placeholder focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Сайт/Блог</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                disabled={!editing}
                placeholder="https://example.com"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Телефон</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!editing}
                placeholder="+7 (999) 123-45-67"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center mb-5 gap-4">
            <div className="flex-1 relative">
              <label className="block text-white text-sm mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!editing}
                placeholder="example@email.com"
                className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
            <button 
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-primary/40 bg-transparent text-primary transition-all hover:bg-white/10 hover:text-primary-hover"
              onClick={() => setEditing(!editing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-white text-xl font-semibold mb-5 border-b-2 border-primary pb-2.5">Навыки</h2>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {availableSkills.map(skill => (
              <button
                key={skill}
                type="button"
                className={`bg-transparent border rounded-full py-2 px-4 text-sm cursor-pointer transition-all ${
                  formData.skills.includes(skill)
                    ? 'border-primary bg-white/10 text-primary'
                    : 'border-white/35 text-white hover:border-white hover:text-white'
                } disabled:cursor-not-allowed`}
                onClick={() => handleSkillToggle(skill)}
                disabled={!editing}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-white text-xl font-semibold mb-5 border-b-2 border-primary pb-2.5">Контакты</h2>
          
          <h3 className="text-white mb-4">Мессенджеры</h3>
          {formData.messengers.map((contact, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-primary font-semibold text-sm uppercase">{contact.platform}</span>
                {editing && (
                  <div className="flex gap-2.5">
                    <button className="bg-transparent border border-error text-error rounded px-2.5 py-1.5 text-xs cursor-pointer transition-all hover:bg-error hover:text-white">
                      Удалить
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Имя пользователя</label>
                  <input
                    type="text"
                    value={contact.username || ""}
                    disabled={!editing}
                    placeholder="@username"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Телефон</label>
                  <input
                    type="tel"
                    value={contact.phone || ""}
                    disabled={!editing}
                    placeholder="+375 (29) 123-45-67"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}

          <h3 className="text-white mb-4 mt-8">Социальные сети</h3>
          {formData.socialNetworks.map((contact, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-primary font-semibold text-sm uppercase">{contact.platform}</span>
                {editing && (
                  <div className="flex gap-2.5">
                    <button className="bg-transparent border border-error text-error rounded px-2.5 py-1.5 text-xs cursor-pointer transition-all hover:bg-error hover:text-white">
                      Удалить
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Имя пользователя</label>
                  <input
                    type="text"
                    value={contact.username || ""}
                    disabled={!editing}
                    placeholder="username"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Ссылка</label>
                  <input
                    type="url"
                    value={contact.url || ""}
                    disabled={!editing}
                    placeholder="https://example.com"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}

          <h3 className="text-white mb-4 mt-8">Прочее</h3>
          {formData.otherContacts.map((contact, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-primary font-semibold text-sm uppercase">{contact.platform}</span>
                {editing && (
                  <div className="flex gap-2.5">
                    <button className="bg-transparent border border-error text-error rounded px-2.5 py-1.5 text-xs cursor-pointer transition-all hover:bg-error hover:text-white">
                      Удалить
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Имя пользователя</label>
                  <input
                    type="text"
                    value={contact.username || ""}
                    disabled={!editing}
                    placeholder="username"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative mb-0">
                  <label className="block text-white text-sm mb-1.5 font-medium">Ссылка</label>
                  <input
                    type="url"
                    value={contact.url || ""}
                    disabled={!editing}
                    placeholder="https://example.com"
                    className="w-full bg-transparent border-none border-b-2 border-white text-white py-2.5 px-1.5 text-[15px] transition-colors placeholder:text-placeholder focus:outline-none focus:border-b-2 focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          ))}

          {editing && (
            <button className="w-full cursor-pointer rounded border-2 border-dashed border-primary/40 p-5 text-base text-primary transition-all hover:border-solid hover:bg-white/5">
              + Добавить контакт
            </button>
          )}
        </div>

        {editing && (
          <div className="flex justify-center gap-5 mt-10 flex-col md:flex-row">
            <button 
              className="ui-btn-primary cursor-pointer px-8 py-2.5 text-[15px] font-bold"
              onClick={handleSave}
            >
              Сохранить
            </button>
            <button 
              className="py-3 px-8 bg-transparent border border-white text-white rounded-xl text-[15px] font-bold cursor-pointer transition-colors hover:bg-white/10"
              onClick={handleCancel}
            >
              Отмена
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-5 p-4 rounded-xl text-sm leading-relaxed border text-center ${
            message.includes('Ошибка')
              ? 'border-error bg-error/10 text-error'
              : 'border-success bg-white/10 text-success'
          }`}>
            {message}
          </div>
        )}
      </div>

      {showAvatarEditor && (
        <div className="modal-backdrop">
          <div className="modal-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto border-primary/35 shadow-2xl">
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
                <div className="mb-6">
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

                  <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    <button
                      onClick={handleZoomIn}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                      title="Приблизить"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                      title="Отдалить"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleRotate}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                      title="Повернуть на 90°"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={handleFlip}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                      title="Отзеркалить"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCrop}
                      className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-colors"
                      title="Обрезать"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        showSettings ? 'border-primary/40 bg-surface text-white' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      title="Настройки"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>

                  {showSettings && (
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-white text-lg font-semibold mb-4">Настройки изображения</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white text-sm mb-2">Яркость: {filters.brightness}%</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={filters.brightness}
                            onChange={(e) => updateFilter('brightness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm mb-2">Контраст: {filters.contrast}%</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={filters.contrast}
                            onChange={(e) => updateFilter('contrast', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm mb-2">Насыщенность: {filters.saturation}%</label>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={filters.saturation}
                            onChange={(e) => updateFilter('saturation', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm mb-2">Затемнение: {filters.darkness}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.darkness}
                            onChange={(e) => updateFilter('darkness', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm mb-2">Зернистость: {filters.grain}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.grain}
                            onChange={(e) => updateFilter('grain', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm mb-2">Температура: {filters.temperature}</label>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={filters.temperature}
                            onChange={(e) => updateFilter('temperature', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowAvatarEditor(false)}
                  className="bg-transparent border border-white text-white px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={!avatarImage}
                  className="ui-btn-primary px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

