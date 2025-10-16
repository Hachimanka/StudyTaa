import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("❌ MongoDB connection failed:", error.message);
    
    if (error.message.includes('ETIMEOUT')) {
      console.log("🌐 DNS/Network timeout - possible causes:");
      console.log("1. Check your internet connection");
      console.log("2. Verify MongoDB Atlas Network Access settings");
      console.log("3. Try using a different network (mobile hotspot)");
      console.log("4. Check if your firewall is blocking the connection");
    }
    
    process.exit(1);
  }
};