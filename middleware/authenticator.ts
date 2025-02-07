import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend your request interface if needed
export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    [key: string]: any;
  };
  body: { userID?: string; [key: string]: any };
}

// Define a custom interface for your JWT payload that includes an 'id' property
interface JwtPayloadWithId extends JwtPayload {
  id: string;
}

export const authenticator = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ warning: "Please Login First!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // Check that 'decoded' is an object and has an 'id' property
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      // Cast to JwtPayloadWithId so TypeScript knows there's an 'id' property
      const payload = decoded as JwtPayloadWithId;
      req.body.userID = payload.id;
      next();
    } else {
      res.status(401).json({ warning: "Invalid token payload. Please login." });
    }
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ warning: "Invalid token. Please login again." });
  }
};
