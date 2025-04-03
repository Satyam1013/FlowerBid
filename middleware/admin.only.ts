import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/user.types";

export interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: UserRole };
}

export const adminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};
