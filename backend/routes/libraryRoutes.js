import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import UploadedFile from '../models/UploadedFile.js';
import Folder from '../models/Folder.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// Helper function to convert file to base64 for small files
const fileToBase64 = (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting file to base64:', error);
    return null;
  }
};

// Helper function to read text file content
const readTextFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error('Error reading text file:', error);
    return null;
  }
};

// Upload file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    // Get user ID from authenticated request
    const userId = req.userId;
    const { folderId = 'root' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, size, mimetype, path: filePath } = req.file;
    
    // Determine file type
    const isImage = mimetype.startsWith('image/');
    const isText = mimetype === 'text/plain' || originalname.endsWith('.txt');
    
    // For small files (< 5MB), store base64 data
    let fileData = null;
    let textContent = null;
    
    if (size < 5 * 1024 * 1024) { // 5MB
      if (isImage || mimetype === 'application/pdf') {
        fileData = fileToBase64(filePath);
      }
    }
    
    if (isText) {
      textContent = readTextFile(filePath);
    }

    // Create new file record
    const uploadedFile = new UploadedFile({
      userId,
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      fileType: mimetype,
      filePath,
      folderId,
      fileData,
      isImage,
      isText,
      textContent,
    });

    await uploadedFile.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: uploadedFile._id,
        name: originalname,
        size,
        type: mimetype,
        uploadDate: uploadedFile.createdAt,
        dataUrl: fileData ? `data:${mimetype};base64,${fileData}` : null,
        content: textContent,
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get user's files and folders
router.get('/library/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all files for the user
    const files = await UploadedFile.find({ userId }).sort({ createdAt: -1 });
    
    // Get all folders for the user
    const folders = await Folder.find({ userId }).sort({ createdAt: -1 });
    
    // Build the folder structure
    const buildFolderStructure = (parentId = 'root') => {
      const folderFiles = files.filter(file => file.folderId === parentId).map(file => ({
        id: file._id,
        name: file.originalName,
        size: file.fileSize,
        type: file.fileType,
        uploadDate: file.createdAt,
        dataUrl: file.fileData ? `data:${file.fileType};base64,${file.fileData}` : null,
        content: file.textContent,
        blob: null, // Will be handled on frontend
      }));

      const subfolders = folders.filter(folder => folder.parentFolderId === parentId).map(folder => ({
        id: folder._id,
        name: folder.name,
        expanded: folder.expanded,
        files: [],
        folders: buildFolderStructure(folder._id.toString()),
      }));

      return subfolders.map(folder => ({
        ...folder,
        files: files.filter(file => file.folderId === folder.id.toString()).map(file => ({
          id: file._id,
          name: file.originalName,
          size: file.fileSize,
          type: file.fileType,
          uploadDate: file.createdAt,
          dataUrl: file.fileData ? `data:${file.fileType};base64,${file.fileData}` : null,
          content: file.textContent,
          blob: null,
        })),
      }));
    };

    const library = {
      id: 'root',
      name: 'My Library',
      files: files.filter(file => file.folderId === 'root').map(file => ({
        id: file._id,
        name: file.originalName,
        size: file.fileSize,
        type: file.fileType,
        uploadDate: file.createdAt,
        dataUrl: file.fileData ? `data:${file.fileType};base64,${file.fileData}` : null,
        content: file.textContent,
        blob: null,
      })),
      folders: buildFolderStructure(),
    };

    res.json(library);

  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ error: 'Failed to get library' });
  }
});

// Create folder
router.post('/folder', async (req, res) => {
  try {
    const { userId, name, parentFolderId = 'root' } = req.body;
    
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and folder name are required' });
    }

    // Calculate path and level
    let path = name;
    let level = 0;
    
    if (parentFolderId !== 'root') {
      const parentFolder = await Folder.findById(parentFolderId);
      if (parentFolder) {
        path = `${parentFolder.path}/${name}`;
        level = parentFolder.level + 1;
      }
    }

    const folder = new Folder({
      userId,
      name,
      parentFolderId,
      path,
      level,
      expanded: false,
    });

    await folder.save();

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        id: folder._id,
        name: folder.name,
        expanded: folder.expanded,
        files: [],
        folders: [],
      }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Delete file
router.delete('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const file = await UploadedFile.findOne({ _id: fileId, userId });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Remove physical file
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Remove from database
    await UploadedFile.findByIdAndDelete(fileId);

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Delete folder
router.delete('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Recursively delete all files and subfolders
    const deleteRecursive = async (folderIdToDelete) => {
      // Delete all files in this folder
      const files = await UploadedFile.find({ userId, folderId: folderIdToDelete });
      for (const file of files) {
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
        await UploadedFile.findByIdAndDelete(file._id);
      }

      // Delete all subfolders
      const subfolders = await Folder.find({ userId, parentFolderId: folderIdToDelete });
      for (const subfolder of subfolders) {
        await deleteRecursive(subfolder._id.toString());
        await Folder.findByIdAndDelete(subfolder._id);
      }
    };

    await deleteRecursive(folderId);
    await Folder.findByIdAndDelete(folderId);

    res.json({ message: 'Folder and all contents deleted successfully' });

  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Download file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const file = await UploadedFile.findOne({ _id: fileId, userId });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'Physical file not found' });
    }

    res.download(file.filePath, file.originalName);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// View file by ID (for PDFs and other viewable files)
router.get('/view/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await UploadedFile.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // TEMPORARY: Skip user authorization check for testing

    if (file.fileData) {
      // File is stored as base64, serve it directly
      const buffer = Buffer.from(file.fileData, 'base64');
      res.set({
        'Content-Type': file.fileType,
        'Content-Disposition': 'inline; filename="' + file.originalName + '"',
        'Content-Length': buffer.length
      });
      res.send(buffer);
    } else if (file.filePath && fs.existsSync(file.filePath)) {
      // File is stored on disk
      res.set({
        'Content-Type': file.fileType,
        'Content-Disposition': 'inline; filename="' + file.originalName + '"'
      });
      res.sendFile(path.resolve(file.filePath));
    } else {
      return res.status(404).json({ error: 'File content not found' });
    }

  } catch (error) {
    console.error('View file error:', error);
    res.status(500).json({ error: 'Failed to view file' });
  }
});

// Additional endpoints expected by frontend

// Get all files for authenticated user (frontend expects this)
router.get('/files', verifyToken, async (req, res) => {
  try {
    // Get files for the authenticated user
    const userId = req.userId;
    const files = await UploadedFile.find({ userId });
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get all folders for authenticated user (frontend expects this)
router.get('/folders', verifyToken, async (req, res) => {
  try {
    // Get folders for the authenticated user
    const userId = req.userId;
    const folders = await Folder.find({ userId });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder (frontend expects POST /folders)
router.post('/folders', verifyToken, async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Get user ID from authenticated request
    const userId = req.userId;

    // Calculate path and level
    let path = name;
    let level = 0;
    
    if (parentFolderId) {
      const parentFolder = await Folder.findById(parentFolderId);
      if (parentFolder) {
        path = `${parentFolder.path}/${name}`;
        level = parentFolder.level + 1;
      }
    }

    const newFolder = new Folder({
      userId,
      name,
      parentFolderId: parentFolderId || null,
      path,
      level,
      expanded: false
    });

    await newFolder.save();
    res.json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Delete file (frontend expects DELETE /files/:fileId)
router.delete('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.userId;
    const file = await UploadedFile.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify that the file belongs to the authenticated user
    if (file.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized: This file does not belong to you' });
    }

    // Delete file from filesystem if it exists
    if (file.filePath && fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    // Delete from database
    await UploadedFile.findByIdAndDelete(fileId);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Delete folder (frontend expects DELETE /folders/:folderId)
router.delete('/folders/:folderId', verifyToken, async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.userId;
    const folder = await Folder.findById(folderId);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Verify that the folder belongs to the authenticated user
    if (folder.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized: This folder does not belong to you' });
    }

    // Recursively delete all subfolders and files
    const deleteRecursively = async (currentFolderId) => {
      // Delete all files in this folder
      const files = await UploadedFile.find({ folderId: currentFolderId });
      for (const file of files) {
        if (file.filePath && fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
        await UploadedFile.findByIdAndDelete(file._id);
      }

      // Delete all subfolders
      const subfolders = await Folder.find({ parentFolderId: currentFolderId });
      for (const subfolder of subfolders) {
        await deleteRecursively(subfolder._id);
      }

      // Delete the folder itself
      await Folder.findByIdAndDelete(currentFolderId);
    };

    await deleteRecursively(folderId);
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Rename file (frontend expects PATCH /files/:fileId)
router.patch('/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;
    const userId = req.userId;

    console.log(`Rename request: userId=${userId}, fileId=${fileId}, newName=${newName}`);

    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ error: 'New file name is required' });
    }

    const file = await UploadedFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify ownership
    if (file.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized: This file does not belong to you' });
    }

    file.originalName = newName.trim();
    await file.save();

    res.json({ message: 'File renamed successfully', file: { id: file._id, name: file.originalName } });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

export default router;