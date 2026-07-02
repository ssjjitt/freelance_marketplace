import { io, Socket } from "socket.io-client";
import AuthService from "./auth.service";
import { API_WS_URL } from "../config/api.config";

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  /**
   * Подключение к Socket.IO с JWT из текущего пользователя.
   */
  connect() {
    try {
      const currentUser = AuthService.getCurrentUser();
      const token = currentUser?.accessToken;

      if (!token) {
        return;
      }

      if (this.socket?.connected || this.isConnecting) {
        return;
      }

      if (this.socket && !this.socket.connected) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.isConnecting = true;

      this.socket = io(API_WS_URL, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        forceNew: false,
      });

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
        this.isConnecting = false;

        if (
          reason === "io client disconnect" ||
          reason === "io server disconnect"
        ) {
          this.socket = null;
        }
      });

      this.socket.on("connect_error", (error) => {
        if (this.reconnectAttempts === 0) {
          console.warn("WebSocket connection error:", error.message);
        }

        this.isConnecting = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn(
            "Max reconnection attempts reached. WebSocket will not reconnect automatically."
          );
        }
      });
    } catch (e) {
      console.error("WebSocket connect error", e);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  subscribeToChat(chatId: number) {
    if (this.socket) {
      this.socket.emit("subscribe_chat", chatId);
    }
  }

  unsubscribeFromChat(chatId: number) {
    if (this.socket) {
      this.socket.emit("unsubscribe_chat", chatId);
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  offNewMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("new_message", callback);
      } else {
        this.socket.off("new_message");
      }
    }
  }

  onChatsUpdated(callback: () => void) {
    if (this.socket) {
      this.socket.on("chats_list_updated", callback);
    }
  }

  offChatsUpdated(callback?: () => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("chats_list_updated", callback);
      } else {
        this.socket.off("chats_list_updated");
      }
    }
  }

  onChatUpdated(callback: (data: { chatId: number }) => void) {
    if (this.socket) {
      this.socket.on("chat_updated", callback);
    }
  }

  offChatUpdated(callback?: (data: { chatId: number }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("chat_updated", callback);
      } else {
        this.socket.off("chat_updated");
      }
    }
  }

  onNotification(callback: (notification: any) => void) {
    if (this.socket) {
      this.socket.on("new_notification", callback);
    }
  }

  offNotification(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("new_notification", callback);
      } else {
        this.socket.off("new_notification");
      }
    }
  }

  onNotificationsUpdated(callback: () => void) {
    if (this.socket) {
      this.socket.on("notifications_updated", callback);
    }
  }

  offNotificationsUpdated(callback?: () => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("notifications_updated", callback);
      } else {
        this.socket.off("notifications_updated");
      }
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
