import type { SessionInfo } from "../modules/session/session.types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: {
          id: string;
          name: string;
          email: string;
          isEmailVerified: boolean;
          createdAt: Date;
          updatedAt: Date;
        };
        session: SessionInfo;
      };
    }
  }
}

export {};