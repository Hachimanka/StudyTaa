import mongoose from "mongoose";
import Users from "../models/Users.js";
import bcrypt from "bcryptjs";
import express from "express";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  
  if(!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  
  try {
    // Check if user already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new Users({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: { email: newUser.email } });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
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
