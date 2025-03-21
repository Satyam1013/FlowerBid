import { Request, Response, NextFunction } from "express";

export const sellerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  // @ts-ignore: Assuming req.user is attached by the authenticator middleware
  if (req.user && req.user.role === "seller") {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Seller only." });
  }
};
