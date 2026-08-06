export type SessionResult = {
  success: boolean;
  message: string;
};

export type SessionInfo = {
  sessionId: string;
  userId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
};