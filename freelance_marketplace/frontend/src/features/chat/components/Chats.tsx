import React, { useState, useEffect, useRef } from "react";
import ChatService from "../../../services/chat.service";
import AuthService from "../../../services/auth.service";
import websocketService from "../../../services/websocket.service";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { MessageCircle, Pencil, Send, Trash2 } from "lucide-react";
import { appDialog } from "../../../components/ui/app-dialog";

interface Chat {
  id: number;
  user1: { id: number; username: string; email: string };
  user2: { id: number; username: string; email: string };
  lastMessageAt: string | null;
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  sender: { id: number; username: string; email: string };
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

const Chats: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = AuthService.getCurrentUser() as { id: number } | null;
  const userId = currentUser?.id ?? null;

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const selectedChatIdRef = useRef<number | null>(null);
  selectedChatIdRef.current = selectedChatId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const selectedChat = chats.find((c) => c.id === selectedChatId) || null;

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadChats = async () => {
    try {
      const response = await ChatService.getChats();
      setChats(response.data);
    } catch (error) {
      console.error("Ошибка загрузки чатов:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await ChatService.getMessages(chatId);
      const messagesData = response.data || [];
      setMessages(messagesData);

      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, unreadCount: 0, lastMessageAt: messagesData.slice(-1)[0]?.createdAt || c.lastMessageAt } : c
        )
      );
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    }
  };

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить этот чат?", { danger: true }))) return;
    
    try {
      await ChatService.deleteChat(chatId);
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("chatId");
          return next;
        }, { replace: true });
      }
      await loadChats();
    } catch (error) {
      console.error("Ошибка удаления чата:", error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await ChatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      
      await loadChats();
    } catch (error: any) {
      console.error("Ошибка удаления сообщения:", error);
      void appDialog.alert(error.response?.data?.message || "Не удалось удалить сообщение", "error");
    }
  };

  const handleEditMessage = (message: Message) => {
    if (editingMessageId !== null) {
      setEditingMessageId(null);
      setEditContent("");
    }
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleSaveEdit = async (messageId: number) => {
    if (!editContent.trim()) {
      void appDialog.alert("Сообщение не может быть пустым", "error");
      return;
    }
    
    try {
      const response = await ChatService.updateMessage(messageId, editContent);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: response.data.content } : m))
      );
      setEditingMessageId(null);
      setEditContent("");
      
      await loadChats();
    } catch (error: any) {
      console.error("Ошибка редактирования сообщения:", error);
      void appDialog.alert(error.response?.data?.message || "Не удалось отредактировать сообщение", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  useEffect(() => {
    if (userId == null) {
      navigate("/login");
      return;
    }

    loadChats();

    const handleNewMessage = (message: Message & { chatId: number }) => {
      if (selectedChatIdRef.current === message.chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        scrollToBottom();
      }

      setChats((prev) => {
        const chatIndex = prev.findIndex((c) => c.id === message.chatId);
        if (chatIndex === -1) return prev; 
        const updatedChats = [...prev];
        const chat = updatedChats[chatIndex];
        updatedChats.splice(chatIndex, 1);
        updatedChats.unshift({
          ...chat,
          lastMessageAt: message.createdAt,
          lastMessage: message.content,
          unreadCount: message.senderId !== userId ? (chat.unreadCount || 0) + 1 : chat.unreadCount,
        });
        return updatedChats;
      });
    };

    const handleMessageDeleted = (data: { messageId: number; chatId: number }) => {
      if (selectedChatIdRef.current === data.chatId) {
        setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
      }
    };

    const handleMessageUpdated = (message: Message & { chatId: number }) => {
      if (selectedChatIdRef.current === message.chatId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    };

    const handleChatsListUpdated = () => {
      loadChats();
    };

    websocketService.onNewMessage(handleNewMessage);
    websocketService.on("message_deleted", handleMessageDeleted);
    websocketService.on("message_updated", handleMessageUpdated);
    websocketService.on("chats_list_updated", handleChatsListUpdated);

    return () => {
      const sid = selectedChatIdRef.current;
      if (sid != null) {
        websocketService.unsubscribeFromChat(sid);
      }
      websocketService.offNewMessage(handleNewMessage);
      websocketService.off("message_deleted", handleMessageDeleted);
      websocketService.off("message_updated", handleMessageUpdated);
      websocketService.off("chats_list_updated", handleChatsListUpdated);
    };
  }, [userId, navigate]);

  useEffect(() => {
    const raw = searchParams.get("chatId");
    if (!raw || chats.length === 0) return;
    const cid = Number(raw);
    if (!Number.isFinite(cid) || !chats.some((c) => c.id === cid)) return;
    if (selectedChatId === cid) return;
    setSelectedChatId(cid);
  }, [chats, searchParams, selectedChatId]);

  useEffect(() => {
    if (selectedChatId == null) {
      setMessages([]);
      return;
    }
    const chatId = selectedChatId;
    websocketService.subscribeToChat(chatId);
    void loadMessages(chatId);
    void ChatService.markAsRead(chatId).catch((error) => {
      console.error("Ошибка отметки сообщений как прочитанных:", error);
    });
    return () => {
      websocketService.unsubscribeFromChat(chatId);
    };
  }, [selectedChatId]);

  const handleSelectChat = (chatId: number) => {
    if (selectedChatId === chatId) return;
    setSelectedChatId(chatId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("chatId", String(chatId));
        return next;
      },
      { replace: true }
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || sending) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);
    
    try {
      const response = await ChatService.sendMessage(selectedChatId, messageContent);
      
      if (response.data) {
        const newMsg = response.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (chat: Chat) => currentUser?.id === chat.user1.id ? chat.user2 : chat.user1;
  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Вчера";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("ru-RU", { weekday: "short" });
    } else {
      return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    }
  };
  const getInitials = (username: string) => username.charAt(0).toUpperCase();

  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  useEffect(scrollToBottom, [messages]);

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto text-white">
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
            <p className="text-center">Загрузка чатов...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="chat-shell">
          <div className="chat-layout">
            <div className="chat-sidebar">
              <div className="chat-sidebar-header">
                <h1 className="text-xl font-semibold">Чаты</h1>
              </div>

              <div className="chat-list">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-white-soft">
                    <p>У вас пока нет чатов</p>
                  </div>
                ) : (
                  chats.map((chat) => {
                    const otherUser = getOtherUser(chat);
                    if (!otherUser) return null;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChat(chat.id)}
                        className={`chat-list-item group ${
                          selectedChat?.id === chat.id ? "chat-list-item-active" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 pr-8">
                          <Link
                            to={`/profile/${otherUser.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/35 bg-white/5 transition-colors hover:border-primary/50 hover:bg-white/10"
                          >
                            <span className="text-lg font-semibold text-primary">
                              {getInitials(otherUser.username)}
                            </span>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="truncate text-sm font-semibold">
                                {otherUser.username}
                              </h3>
                              {chat.lastMessageAt && (
                                <span className="text-xs text-white-soft whitespace-nowrap">
                                  {formatDateShort(chat.lastMessageAt)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              {chat.lastMessage ? (
                                <p className="truncate text-sm text-white-soft">
                                  {chat.lastMessage}
                                </p>
                              ) : (
                                <p className="text-sm text-white-soft italic">Нет сообщений</p>
                              )}
                              {(chat.unreadCount ?? 0) > 0 && (
                                <span className="min-w-[20px] flex-shrink-0 rounded-full border border-primary/35 bg-white/5 px-2 py-0.5 text-center text-xs font-semibold text-primary">
                                  {chat.unreadCount! > 99 ? "99+" : chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-xl border border-transparent p-2 text-white/60 opacity-0 transition-all hover:border-danger/50 hover:text-danger group-hover:opacity-100"
                          title="Удалить чат"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="chat-main">
              {selectedChat ? (
                <>
                  <div className="chat-main-header">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/profile/${getOtherUser(selectedChat)?.id}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/35 bg-white/5 transition-colors hover:border-primary/50 hover:bg-white/10"
                      >
                        <span className="text-base font-semibold text-primary">
                          {getInitials(getOtherUser(selectedChat)?.username || "")}
                        </span>
                      </Link>
                      <div>
                        <h2 className="text-sm font-semibold">
                          {getOtherUser(selectedChat)?.username}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {messages.length > 0 && (
                    <div className="chat-search-bar">
                      <input
                        type="text"
                        placeholder="Поиск по сообщениям..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ui-input text-sm"
                      />
                    </div>
                  )}

                  <div
                    ref={messagesContainerRef}
                    className="chat-messages-pane"
                  >
                    {filteredMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-white-soft">
                          {searchQuery ? (
                            <>
                              <p className="text-lg mb-2">Сообщения не найдены</p>
                              <p className="text-sm">Попробуйте другой запрос</p>
                            </>
                          ) : (
                            <>
                          <p className="text-lg mb-2">Начните переписку</p>
                          <p className="text-sm">Отправьте первое сообщение</p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {filteredMessages.map((message) => {
                          const isOwn = message.senderId === currentUser?.id;
                          const isEditing = editingMessageId === message.id;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"} group w-full`}
                            >
                              <div className="relative max-w-[70%]">
                                {isEditing ? (
                                  <div className={`chat-bubble-edit w-full ${isOwn ? "chat-bubble-own" : ""}`}>
                                    <textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="mb-2 min-h-[60px] w-full resize-none bg-transparent text-sm outline-none"
                                      style={{ color: "var(--chat-bubble-text)" }}
                                      autoFocus
                                      rows={Math.min(Math.max(editContent.split('\n').length, 2), 6)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && e.ctrlKey) {
                                          e.preventDefault();
                                          handleSaveEdit(message.id);
                                        } else if (e.key === "Escape") {
                                          handleCancelEdit();
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2 justify-end mt-2">
                                      <button
                                        onClick={() => handleSaveEdit(message.id)}
                                        className="ui-btn-primary px-4 py-2 text-xs font-medium"
                                      >
                                        Сохранить
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="rounded-xl bg-white/20 px-4 py-2 text-xs font-medium transition-colors hover:bg-white/30"
                                        style={{ color: "var(--chat-bubble-text)" }}
                                      >
                                        Отмена
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={`chat-bubble relative ${
                                      isOwn ? "chat-bubble-own" : "chat-bubble-other"
                                    }`}
                                  >
                                    <p className="mb-2 break-words whitespace-pre-wrap text-sm leading-relaxed">
                                      {message.content}
                                    </p>
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="chat-bubble-meta text-xs">
                                        {new Date(message.createdAt).toLocaleString("ru-RU", { 
                                          day: "numeric", 
                                          month: "short", 
                                          hour: "2-digit", 
                                          minute: "2-digit" 
                                        })}
                                </span>
                                    </div>
                                    
                                    {isOwn && (
                                      <div className="absolute -right-8 top-3 z-10 flex items-center gap-1 rounded-xl border border-white/20 bg-surface p-1 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={() => handleEditMessage(message)}
                                          className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-white/20"
                                          title="Редактировать"
                                        >
                                          <Pencil strokeWidth={1.5} size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMessage(message.id)}
                                          className="flex items-center justify-center rounded p-1.5 text-white/60 transition-colors hover:text-danger"
                                          title="Удалить"
                                        >
                                          <Trash2 strokeWidth={1.5} size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  <div className="chat-composer">
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                      <div className="ui-input flex-1 py-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Введите сообщение..."
                          className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-placeholder"
                          style={{ color: "var(--app-text)" }}
                          disabled={sending}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="ui-btn-primary flex h-10 w-10 shrink-0 items-center justify-center p-0 disabled:opacity-40"
                        title="Отправить"
                      >
                        <Send strokeWidth={1.5} size={18} className="text-primary" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="chat-empty-state">
                  <div className="text-center text-white-soft">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/20 bg-surface backdrop-blur-md">
                      <MessageCircle
                        strokeWidth={1.5}
                        size={48}
                        className="text-white-soft"
                      />
                    </div>
                    <p className="mb-2 text-lg font-semibold">Выберите чат</p>
                    <p className="text-sm">Выберите чат из списка для начала переписки</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chats;
