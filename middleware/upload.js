// middleware/upload.js

const multer = require('multer');
const path = require('path');

// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // โฟลเดอร์จัดเก็บไฟล์
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // ชื่อไฟล์พร้อม Timestamp
  },
});

const upload = multer({ storage });

module.exports = upload;
