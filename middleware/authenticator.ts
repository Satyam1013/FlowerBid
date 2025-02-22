import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: "admin" | "user" };
}

interface MyJwtPayload extends JwtPayload {
  id: string;
  role: "admin" | "user";
}

export const authenticator = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!) as MyJwtPayload;
    req.user = { _id: user.id, role: user.role };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Invalid token. Please login again." });
  }
};
