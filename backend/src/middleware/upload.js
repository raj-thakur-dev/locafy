const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { formatError } = require('../utils/helpers');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `biz-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Only .jpg, .jpeg, .png, and .webp image files are allowed');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB max
  },
  fileFilter
});

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(formatError('FILE_TOO_LARGE', 'Image size exceeds maximum limit of 2 MB'));
      }
      return res.status(400).json(formatError(err.code || 'UPLOAD_ERROR', err.message || 'File upload failed'));
    }
    next();
  });
}

module.exports = {
  upload,
  handleUpload
};
