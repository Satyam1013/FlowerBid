import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import * as yup from "yup";
import jwt from "jsonwebtoken";
import User from "../models/User";

const userValidationSchema = yup.object({
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .required("Username is required"),
  email: yup
    .string()
    .email("Invalid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  mobile: yup
    .string()
    .matches(/^\d{10}$/, "Mobile number must be exactly 10 digits")
    .required("Mobile number is required"),
});

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = await userValidationSchema.validate(req.body, {
      abortEarly: false,
    });
    const { username, email, password, mobile } = validatedData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "User with this email already exists." });
      return;
    }

    const newUser = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      mobile: parseInt(mobile, 10),
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      res.status(422).json({ errors: error.errors });
      return;
    }
    console.error("Signup error:", error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        role: user.role,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};