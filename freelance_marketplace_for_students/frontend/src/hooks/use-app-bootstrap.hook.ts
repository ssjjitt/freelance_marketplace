import { useEffect, useState } from "react";
import AuthService from "../services/auth.service";
import ProfileService from "../services/profile.service";
import websocketService from "../services/websocket.service";

export function useAppBootstrap() {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      websocketService.connect();

      ProfileService.getProfile().catch((error) => {
        if (
          error.response?.data?.message === "Ваш аккаунт заблокирован!" ||
          (error.response?.status === 403 &&
            error.response?.data?.message?.includes("заблокирован"))
        ) {
          setIsBlocked(true);
        }
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  return { isBlocked };
}
