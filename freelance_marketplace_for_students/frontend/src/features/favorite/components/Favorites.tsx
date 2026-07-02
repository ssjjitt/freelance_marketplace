import React, { useState, useEffect } from "react";
import FavoriteService from "../../../services/favorite.service";
import { Link } from "react-router-dom";

interface Favorite {
  id: number;
  executer: {
    id: number;
    username: string;
    email: string;
    profile?: any;
  };
}

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await FavoriteService.getFavorites();
      setFavorites(res.data);
    } catch (error) {
      console.error("Ошибка загрузки избранного:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (executerId: number) => {
    try {
      await FavoriteService.removeFavorite(executerId);
      setFavorites(favorites.filter(f => f.executer.id !== executerId));
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
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
      <div className="max-w-5xl mx-auto text-white">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl mb-8">
          <h1 className="text-3xl font-semibold">Избранные исполнители</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
            <p className="text-center text-white-soft">Нет избранных исполнителей</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="panel-surface p-6 backdrop-blur-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{favorite.executer.username}</h3>
                    <p className="text-white-soft text-sm">{favorite.executer.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(favorite.executer.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                  >
                    Удалить
                  </button>
                </div>
                <Link
                  to={`/profile/${favorite.executer.id}`}
                  className="mt-4 inline-block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur-md transition-all hover:border-primary/35 hover:text-primary"
                >
                  Посмотреть профиль
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Favorites;

