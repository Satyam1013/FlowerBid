import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import { Socket } from "socket.io";
import { UserRole } from "../models/User";

export interface AuthenticatedRequest extends Request {
  user?: { _id: string; role: UserRole };
}

interface MyJwtPayload extends JwtPayload {
  id: string;
  role: UserRole;
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

interface DecodedToken {
  _id: string;
}

export const socketAuthenticator = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  jwt.verify(
    token,
    process.env.JWT_SECRET as string,
    (err: VerifyErrors | null, decoded: unknown) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.data.user = decoded as DecodedToken;
      next();
    }
  );
};
