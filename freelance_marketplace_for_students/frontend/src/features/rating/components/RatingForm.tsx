import React, { useState } from "react";
import { Star } from "lucide-react";
import RatingService from "../../../services/rating.service";

interface Props {
  toUserId: number;
  orderId?: number;
  serviceId?: number;
  onSuccess?: () => void;
}

const RatingForm: React.FC<Props> = ({ toUserId, orderId, serviceId, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await RatingService.createRating({
        toUserId,
        orderId,
        serviceId,
        rating,
        comment: comment || undefined
      });
      setComment("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || "Ошибка создания оценки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-panel space-y-4">
      <h3 className="text-xl font-semibold">Оценить</h3>
      
      <label className="flex flex-col gap-2 text-sm">
        Оценка
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="rounded-xl p-0.5 transition-all duration-300 ease-in-out hover:opacity-90"
              aria-label={`${star} из 5`}
            >
              <Star
                strokeWidth={1.5}
                size={26}
                className={
                  star <= rating
                    ? "fill-primary text-primary"
                    : "text-white-soft"
                }
              />
            </button>
          ))}
        </div>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        Комментарий
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="ui-textarea"
        />
      </label>

      {error && (
        <p className="msg-box msg-error">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="ui-btn-primary w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Отправка..." : "Оценить"}
      </button>
    </form>
  );
};

export default RatingForm;

