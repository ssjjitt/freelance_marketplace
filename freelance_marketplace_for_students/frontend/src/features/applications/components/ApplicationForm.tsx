import React, { useState } from "react";
import ApplicationService from "../../../services/application.service";

interface Props {
  orderId?: number;
  serviceId?: number;
  onSuccess?: () => void;
}

const ApplicationForm: React.FC<Props> = ({ orderId, serviceId, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await ApplicationService.createApplication({
        orderId,
        serviceId,
        message: message || undefined,
        proposedPrice: proposedPrice ? Number(proposedPrice) : undefined
      });
      setMessage("");
      setProposedPrice("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || "Ошибка создания отклика");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-panel space-y-4">
      <h3 className="text-xl font-semibold">Откликнуться</h3>
      
      <label className="flex flex-col gap-2 text-sm">
        Сообщение
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="ui-textarea"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        Предложенная цена (BYN)
        <input
          type="number"
          min="0"
          value={proposedPrice}
          onChange={(e) => setProposedPrice(e.target.value)}
          className="ui-input"
        />
      </label>

      {error && (
        <p className="message-box error">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="ui-btn-primary w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Отправка..." : "Откликнуться"}
      </button>
    </form>
  );
};

export default ApplicationForm;

