// routes/roomRoutes.js

const express = require('express');
const {
  createRoom,
  getRooms,
  joinRoom,
  leaveRoom,
  getJoinedRooms,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// เส้นทางสำหรับสร้างห้อง (เฉพาะผู้ที่ล็อกอิน)
router.post('/', authMiddleware, createRoom);

// เส้นทางสำหรับดึงข้อมูลห้องทั้งหมดพร้อมชื่อเจ้าของห้อง
router.get('/', getRooms);

// เส้นทางสำหรับจอยห้อง (เฉพาะผู้ที่ล็อกอิน)
router.post('/join/:roomId', authMiddleware, joinRoom);

// เส้นทางสำหรับยกเลิกการจอยห้อง (เฉพาะผู้ที่ล็อกอิน)
router.delete('/leave/:roomId', authMiddleware, leaveRoom);

// เส้นทางสำหรับดึงข้อมูลห้องที่ผู้ใช้เข้าร่วม (เพิ่ม authMiddleware)
router.get('/joined/:userId', authMiddleware, getJoinedRooms);

// เส้นทางสำหรับแก้ไขห้อง (เฉพาะผู้ที่ล็อกอินและเป็นเจ้าของห้อง)
router.put('/:roomId/update', authMiddleware, updateRoom); // แก้รูปแบบ URL ให้ชัดเจน

// เส้นทางสำหรับลบห้อง (เฉพาะผู้ที่ล็อกอินและเป็นเจ้าของห้อง)
router.delete('/:roomId', authMiddleware, deleteRoom);

module.exports = router;