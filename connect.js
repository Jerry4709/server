require('dotenv').config(); // โหลดค่า .env
const express = require('express');
const connectDB = require('./config/db'); // นำเข้าไฟล์เชื่อมต่อ MongoDB
const app = express();

// เชื่อมต่อ MongoDB
connectDB();

// Middleware สำหรับจัดการ JSON
app.use(express.json());

// เส้นทาง (Routes)
app.use('/api/auth', require('./routes/auth')); // ตัวอย่าง Route สำหรับ Authentication

// กำหนด PORT
const PORT = process.env.PORT || 5000;

// เริ่มต้นเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
