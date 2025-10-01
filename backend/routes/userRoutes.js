
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";

import mongoose from "mongoose";
import Users from "../models/Users.js";
import bcrypt from "bcryptjs";
import express from "express";

const router = express.Router();
// Temporary store for pending verifications (use DB for production)
const pendingVerifications = {};

// Get user info by userId
router.get("/userinfo/:userId", async (req, res) => {
  try {
    const UserInfo = (await import("../models/UserInfo.js")).default;
    const info = await UserInfo.findOne({ userId: req.params.userId });
    if (!info) return res.status(404).json({ message: "User info not found" });
    res.json(info);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user info" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
  res.status(200).json({ message: "Login successful", user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Forgot password route (mock, does not send email)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }
  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If this email exists, a reset link was sent" });
    }
    // Here you would send a real email with a reset link
    res.status(200).json({ message: "If this email exists, a reset link was sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Registration with email verification
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    // Hash password for later
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Store pending verification
    pendingVerifications[token] = { name, email, password: hashedPassword };
    // Send verification email
    await sendVerificationEmail(email, token);
    res.status(200).json({ message: "Verification email sent. Please check your inbox." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Email verification endpoint
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const pending = pendingVerifications[token];
  if (!pending) {
    return res.status(400).send("Invalid or expired verification link.");
  }
    try {
      // Create user in DB
      const newUser = new Users({ name: pending.name, email: pending.email, password: pending.password });
      await newUser.save();

      // Store user info in UserInfo collection
      const UserInfo = (await import("../models/UserInfo.js")).default;
      await UserInfo.create({ userId: newUser._id, fullName: pending.name });

      delete pendingVerifications[token];
      res.send("Email verified! You can now log in.");
    } catch (error) {
      res.status(500).send("Error verifying email.");
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await Users.find().select("-password"); // Exclude passwords 
    res.status(200).json(users);  
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
