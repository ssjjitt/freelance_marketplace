/**
 * Выполняет асинхронный HTTP-вызов с перехватом ошибок и логированием.
 * @param label — имя операции (для логов)
 * @param fn — функция, возвращающая Promise
 * @returns результат успешного запроса
 * @throws пробрасывает исходную ошибку axios/сети
 */
export const withApiCall = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.error(`[API] ${label}`, error);
    throw error;
  }
};
