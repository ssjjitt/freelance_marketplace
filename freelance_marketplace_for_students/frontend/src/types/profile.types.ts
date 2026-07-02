export type ContactPayload = {
  type: "messenger" | "social" | "other";
  platform: string;
  username?: string | null;
  url?: string | null;
  phone?: string | null;
  email?: string | null;
};
