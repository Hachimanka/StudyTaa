
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendVerificationEmail.js";

import mongoose from "mongoose";
import Users from "../models/Users.js";
import Session from '../models/Session.js';
import bcrypt from "bcryptjs";
import express from "express";
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
// Temporary store for pending verifications (use DB for production)
const pendingVerifications = {};
// Helper to send a simple 2FA code via email
async function sendTwoFactorEmail(email, code) {
  try {
    // Reuse sendVerificationEmail util to deliver the code, or a simple mail
    await sendVerificationEmail(email, `2fa:${code}`);
  } catch (err) {
    console.error('Failed to send 2FA email:', err);
  }
}

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

    // Note: Two-Factor Authentication enforcement removed — login will succeed
    // even if `user.twoFactorEnabled` is true. This prevents the app from
    // asking for verification codes when existing users log in.

    res.status(200).json({ message: "Login successful", user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify 2FA code
router.post('/verify-2fa', async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) return res.status(400).json({ message: 'Missing params' });
  try {
    const user = await Users.findById(userId);
    if (!user) return res.status(400).json({ message: 'Invalid user' });
    if (!user.twoFactorCode || !user.twoFactorCodeExpires) return res.status(400).json({ message: 'No 2FA pending' });
    if (new Date() > user.twoFactorCodeExpires) return res.status(400).json({ message: 'Code expired' });
    if (user.twoFactorCode !== code) return res.status(400).json({ message: 'Invalid code' });
    // Clear 2FA code and confirm
    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save();
    return res.status(200).json({ message: '2FA verified', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('2FA verify error', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle 2FA for current user (authenticated endpoint expected)
router.post('/toggle-2fa', async (req, res) => {
  const { userId, enable } = req.body;
  if (!userId) return res.status(400).json({ message: 'Missing user' });
  try {
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.twoFactorEnabled = !!enable;
    await user.save();
    res.status(200).json({ message: '2FA updated', twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    console.error('Error toggling 2FA', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user display name (and mirror into UserInfo)
router.put('/update-name', async (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) return res.status(400).json({ message: 'Missing params' });
  try {
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    await user.save();

    // Update or create UserInfo fullName to keep display consistent
    const UserInfo = (await import('../models/UserInfo.js')).default;
    await UserInfo.findOneAndUpdate(
      { userId: user._id },
      { fullName: name },
      { upsert: true }
    );

    res.status(200).json({ message: 'Name updated', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Error updating name', err);
    res.status(500).json({ message: 'Internal server error' });
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

// Change password for a user: verify current password and update to new one
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !currentPassword || !newPassword) return res.status(400).json({ message: 'Missing params' });
  try {
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    // Validate new password (basic server-side checks)
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    console.error('Error changing password', err);
    res.status(500).json({ message: 'Internal server error' });
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

// Persist a study session for the authenticated user
router.post('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { ts, minutes, meta } = req.body;
    const timestamp = Number(ts) || Date.now();
    const mins = Number(minutes) || 0;

    const session = new Session({ userId, ts: timestamp, minutes: mins, meta: meta || {} });
    await session.save();

    res.status(201).json({ message: 'Session saved', session });
  } catch (err) {
    console.error('Error saving session:', err);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Get sessions for authenticated user (most recent first)
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const sessions = await Session.find({ userId }).sort({ ts: -1 }).limit(1000);
    res.json(sessions);
  } catch (err) {
    console.error('Error fetching sessions:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;


