import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };
  }
}
