import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        parentFolderId: {
            type: String,
            default: 'root',
        },
        path: {
            type: String,
            required: true,
        },
        level: {
            type: Number,
            default: 0,
        },
        expanded: {
            type: Boolean,
            default: false,
        },
        description: {
            type: String,
        },
        color: {
            type: String,
            default: 'blue',
        },
    },
    { timestamps: true }
);

// Index for faster queries
folderSchema.index({ userId: 1, parentFolderId: 1 });
folderSchema.index({ userId: 1, name: 1 });

export default mongoose.model("Folder", folderSchema);