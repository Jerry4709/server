// server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer'); // สำหรับการจัดการอัปโหลดไฟล์
const { connectDB } = require('./config/db'); // เชื่อมต่อฐานข้อมูล
const WebSocket = require('ws');

const app = express();

// เชื่อมต่อกับฐานข้อมูล MongoDB
connectDB();

// Middleware
app.use(express.json()); // รองรับ JSON Request
app.use(cors()); // เปิดใช้งาน CORS
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // ให้บริการ Static files สำหรับโฟลเดอร์ uploads

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

// Route สำหรับอัปโหลดไฟล์
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  console.log(fileUrl); // Log URL ของไฟล์ที่อัปโหลด
  res.status(200).json({ url: fileUrl });
});

// Routes อื่น ๆ
app.use('/api/auth', require('./routes/auth')); // Route สำหรับการยืนยันตัวตน
app.use('/api/rooms', require('./routes/roomRoutes')); // Route สำหรับจัดการห้อง

// Default Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Handle 404 Error
app.use((req, res, next) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

const Room = require('./models/Room'); // Import Room Model

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  // ตั้งค่า Change Streams สำหรับ Room collection
  const changeStream = Room.watch();

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const newRoom = change.fullDocument;
      console.log('New Room Detected:', newRoom);
      ws.send(JSON.stringify(newRoom)); // ส่งข้อมูลห้องใหม่ให้ไคลเอนต์ผ่าน WebSocket
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    changeStream.close(); // ปิด Change Stream เมื่อไคลเอนต์ตัดการเชื่อมต่อ
  });
});

// Run Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on https://team-up.up.railway.app:${PORT}`);
  console.log('WebSocket running on wss://team-up.up.railway.app');

});
