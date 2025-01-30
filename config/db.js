require('dotenv').config(); // โหลดค่าจาก .env
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // หยุดการทำงานหากเชื่อมต่อไม่ได้
  }
};

// การตั้งค่า Change Streams
const setupChangeStreams = () => {
  const roomChangeStream = mongoose.connection.collection('rooms').watch();

  // ฟังการเปลี่ยนแปลงใน Collection "rooms"
  roomChangeStream.on('change', (change) => {
    console.log('Change detected:', change);
    // Logic เพิ่มเติม เช่น อัปเดตสถานะในแอปพลิเคชัน
  });

  // จัดการข้อผิดพลาดใน Change Streams
  roomChangeStream.on('error', (err) => {
    console.error('Change Stream Error:', err);
  });
};

// จัดการการปิดการเชื่อมต่อ MongoDB เมื่อเซิร์ฟเวอร์หยุดทำงาน
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// ส่งออกฟังก์ชันทั้งสอง
module.exports = { connectDB, setupChangeStreams };
