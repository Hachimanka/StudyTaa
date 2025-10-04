import mongoose from "mongoose";

const uploadedFileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        fileType: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        folderId: {
            type: String,
            default: 'root',
        },
        folderPath: {
            type: String,
            default: '',
        },
        fileData: {
            type: String, // Base64 encoded file data for small files
        },
        isImage: {
            type: Boolean,
            default: false,
        },
        isText: {
            type: Boolean,
            default: false,
        },
        textContent: {
            type: String, // For text files
        },
        tags: [{
            type: String,
        }],
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

// Index for faster queries
uploadedFileSchema.index({ userId: 1, folderId: 1 });
uploadedFileSchema.index({ userId: 1, fileName: 1 });

export default mongoose.model("UploadedFile", uploadedFileSchema);