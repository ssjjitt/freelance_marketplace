import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FavoriteService from "../../../services/favorite.service";
import avatarPlaceholder from "../../../assets/images/user.svg";
import { appDialog } from "../../../components/ui/app-dialog";

const FavoritesList: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const res = await FavoriteService.getFavorites();
      setFavorites(res.data);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, executerId: number) => {
    e.preventDefault();
    if (!(await appDialog.confirm("Удалить из избранного?", { danger: true }))) return;
    try {
      await FavoriteService.removeFavorite(executerId);
      setFavorites(favorites.filter(f => f.executerId !== executerId));
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
    }
  };

  if (loading) {
    return (
        <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
            <div className="max-w-7xl mx-auto">
                <div className="panel-surface p-6 backdrop-blur-xl">
                    <p className="text-white-soft">Загрузка...</p>
                </div>
            </div>
        </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Избранные исполнители</h1>
          <p className="text-white-soft">Список специалистов, которых вы сохранили</p>
        </div>

        {favorites.length === 0 ? (
            <div className="panel-surface p-10 backdrop-blur-xl text-center">
                <p className="text-white-soft text-lg mb-4">У вас пока нет избранных исполнителей</p>
                <Link to="/catalog" className="inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white backdrop-blur-md transition-all hover:border-primary/35 hover:text-primary">
                    Перейти в каталог
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((fav) => {
                    const executer = fav.executer;
                    return (
                        <Link 
                            key={fav.id} 
                            to={`/profile/${executer.id}`}
                            className="group relative block panel-surface p-6 backdrop-blur-xl transition-colors hover:border-primary/30"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <img 
                                    src={executer.profile?.avatar || avatarPlaceholder} 
                                    alt={executer.username}
                                    className="w-14 h-14 rounded-full object-cover bg-white/5"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-primary">
                                        {executer.username}
                                    </h3>
                                    <p className="text-white-soft text-sm">{executer.email}</p>
                                </div>
                            </div>
                            
                            <button
                                onClick={(e) => handleRemove(e, executer.id)}
                                className="absolute top-4 right-4 p-2 text-white-soft hover:text-error transition-colors z-10"
                                title="Удалить из избранного"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </Link>
                    );
                })}
            </div>
        )}
      </div>
    </section>
  );
};

export default FavoritesList;

