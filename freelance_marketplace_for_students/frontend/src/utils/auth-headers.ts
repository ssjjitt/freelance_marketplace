/**
 * Заголовок Authorization из localStorage (безопасный JSON.parse).
 * @returns объект заголовков или пустой объект
 */
export const getBearerAuthHeaders = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw?.trim()) return {};
    const userData = JSON.parse(raw) as { accessToken?: string };
    if (!userData?.accessToken) return {};
    return { Authorization: `Bearer ${userData.accessToken}` };
  } catch {
    return {};
  }
};

/**
 * Базовая конфигурация axios для запросов с cookie и Bearer.
 */
export const getAuthAxiosConfig = () => ({
  headers: getBearerAuthHeaders(),
  withCredentials: true as const,
});
