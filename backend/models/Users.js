import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorCode: {
            type: String,
        },
        twoFactorCodeExpires: {
            type: Date,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
