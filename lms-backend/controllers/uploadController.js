const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure upload directories exist
const videosDir = path.join(__dirname, '../public/uploads/videos');
const subtitlesDir = path.join(__dirname, '../public/uploads/subtitles');
const documentsDir = path.join(__dirname, '../public/uploads/documents');
const imagesDir = path.join(__dirname, '../public/uploads/images');

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}
if (!fs.existsSync(subtitlesDir)) {
  fs.mkdirSync(subtitlesDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Storage engine for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e4)}-${cleanName}`;
    cb(null, uniqueName);
  },
});

// Storage engine for subtitles
const subtitleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, subtitlesDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e4)}-${cleanName}`;
    cb(null, uniqueName);
  },
});

// Video file filter
const videoFilter = (req, file, cb) => {
  const allowedExts = ['.mp4', '.webm', '.mkv', '.mov', '.m3u8', '.ts', '.mpd', '.ogg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video file format. Supported: MP4, WebM, MKV, MOV, M3U8, TS, MPD'), false);
  }
};

// Subtitle file filter
const subtitleFilter = (req, file, cb) => {
  const allowedExts = ['.vtt', '.srt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype === 'text/vtt' || file.mimetype === 'application/x-subrip' || file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Invalid subtitle format. Supported: .vtt, .srt'), false);
  }
};

const uploadVideoMiddleware = multer({
  storage: videoStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB limit
  fileFilter: videoFilter,
}).single('video');

const uploadSubtitleMiddleware = multer({
  storage: subtitleStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: subtitleFilter,
}).single('subtitle');

exports.uploadVideo = (req, res) => {
  uploadVideoMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol;
    const relativeUrl = `/uploads/videos/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    res.status(200).json({
      url: relativeUrl,
      fullUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
};

exports.uploadSubtitle = (req, res) => {
  uploadSubtitleMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No subtitle file provided' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol;
    const relativeUrl = `/uploads/subtitles/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    res.status(200).json({
      url: relativeUrl,
      fullUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
};

// Storage engine for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e4)}-${cleanName}`;
    cb(null, uniqueName);
  },
});

// Document file filter
const documentFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.zip', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('presentation') || file.mimetype.includes('text')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document format. Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, RTF, ZIP'), false);
  }
};

const uploadDocumentMiddleware = multer({
  storage: documentStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
  fileFilter: documentFilter,
}).single('document');

exports.uploadDocument = (req, res) => {
  uploadDocumentMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No document file provided' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol;
    const relativeUrl = `/uploads/documents/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '') || 'pdf';

    res.status(200).json({
      url: relativeUrl,
      fullUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      documentType: ext,
    });
  });
};

// Storage engine for images / thumbnails
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e4)}-${cleanName}`;
    cb(null, uniqueName);
  },
});

// Image file filter
const imageFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Supported: JPG, JPEG, PNG, WEBP, SVG, GIF'), false);
  }
};

const uploadImageMiddleware = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: imageFilter,
}).single('image');

exports.uploadImage = (req, res) => {
  uploadImageMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol;
    const relativeUrl = `/uploads/images/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    res.status(200).json({
      url: relativeUrl,
      fullUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  });
};
