// models/Room.js

const mongoose = require('mongoose');

// สร้าง Schema สำหรับห้อง
const roomSchema = new mongoose.Schema(
  {
    sportName: { type: String, required: true }, // ชื่อกีฬา
    fieldName: { type: String, required: true }, // ชื่อสนาม
    time: { type: String, required: true }, // เวลาที่เล่น
    totalPrice: { type: Number, required: true }, // ราคารวม
    pricePerPerson: { type: Number, required: true }, // ราคาต่อคน
    maxParticipants: { type: Number, required: true }, // จำนวนคนสูงสุด
    currentParticipants: { type: Number, default: 0 }, // จำนวนคนที่เข้าร่วมปัจจุบัน (ค่าเริ่มต้นคือ 0)
    province: { type: String, required: true }, // จังหวัด (สำหรับกรอง)
    imagePath: { type: String, required: true }, // URL รูปภาพ
     location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
      },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ต้องตรงกับโมเดล User
      required: true
    }, // ID ของผู้สร้างห้อง (หัวหน้าห้อง)
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // รายชื่อผู้เข้าร่วม
    ],
    isFull: { type: Boolean, default: false }, // สถานะห้องเต็มหรือไม่
  },
  {
    timestamps: true, // เพิ่ม createdAt และ updatedAt อัตโนมัติ
  }
);

// Middleware: ตรวจสอบสถานะห้องว่าเต็มหรือไม่ก่อนบันทึก
roomSchema.pre('save', function (next) {
  this.isFull = this.currentParticipants >= this.maxParticipants;
  next();
});

// สร้าง Model จาก Schema
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
