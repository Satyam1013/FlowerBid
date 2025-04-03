import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/user.types";

interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: UserRole };
}

export const sellerOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === UserRole.SELLER) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Seller only." });
  }
};
