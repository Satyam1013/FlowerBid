import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/user.types";

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore: Assuming req.user is attached by the authenticator middleware
  if (req.user && req.user.role === UserRole.ADMIN) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};
