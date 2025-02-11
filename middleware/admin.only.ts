// src/middleware/adminOnly.ts
import { Request, Response, NextFunction } from "express";

// Assuming your authenticator has already set req.user
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore: Assuming req.user is attached by the authenticator middleware
  console.log("Admin middleware, req.user.role:", req.user);
  // @ts-ignore: Assuming req.user is attached by the authenticator middleware
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admins only." });
  }
};
