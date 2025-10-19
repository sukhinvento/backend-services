import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    username: string;
    roles: string[];
    scopes: string[];
  };
}
