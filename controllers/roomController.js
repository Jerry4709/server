const mongoose = require('mongoose');
const Room = require('../models/Room');

// สร้างห้องใหม่
const createRoom = async (req, res) => {
  try {
    console.log('Request body:', req.body);

    let { ownerId } = req.body;

    // ตรวจสอบว่า ownerId เป็น String และแปลงเป็น ObjectId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.log('Invalid ownerId format');
      return res.status(400).json({ message: 'Invalid ownerId format' });
    }
    ownerId = new mongoose.Types.ObjectId(ownerId);

    const room = new Room({
      ...req.body,
      ownerId,
      participants: [ownerId],
      currentParticipants: 1,
    });

    await room.save();
    console.log('Room created successfully:', room);
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    console.error('Error creating room:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลห้องทั้งหมด
const getRooms = async (req, res) => {
  try {
    const { province } = req.query;
    const filter = province ? { province } : {};
    const rooms = await Room.find(filter)
      .populate('ownerId', 'name')
      .populate('participants', 'name age');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ดึงข้อมูลห้องที่ผู้ใช้เข้าร่วม
const getJoinedRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId format' });
    }

    const rooms = await Room.find({ participants: userId })
      .populate('ownerId', 'name')
      .populate('participants', 'name age');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching joined rooms', error: error.message });
  }
};

// เข้าร่วมห้อง
const joinRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid userId or roomId format' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.currentParticipants >= room.maxParticipants) {
      return res.status(400).json({ message: 'Room is full' });
    }

    if (room.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already joined the room' });
    }

    room.participants.push(new mongoose.Types.ObjectId(userId));
    room.currentParticipants += 1;
    await room.save();

    res.status(200).json({ message: 'Joined successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ออกจากห้อง
const leaveRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid Room ID format' });
    }

    const room = await Room.findById(roomId)
      .populate('ownerId', 'name')
      .populate('participants', 'name age');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isParticipant = room.participants.some(p => p._id.equals(userId));
    if (!isParticipant) {
      return res.status(400).json({ message: 'User is not in the room' });
    }

    room.participants = room.participants.filter(p => !p._id.equals(userId));
    room.currentParticipants = room.participants.length;
    await room.save();

    res.status(200).json({ message: 'Left room successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// อัปเดตห้อง
const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid roomId format' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to edit' });
    }

    const allowedUpdates = ['sportName', 'fieldName', 'time', 'totalPrice', 'pricePerPerson', 'maxParticipants', 'location', 'province', 'imagePath'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        room[field] = updates[field];
      }
    });

    await room.save();
    res.status(200).json({ message: 'Room updated successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

// ลบห้อง
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid roomId format' });
    }

    const room = await Room.findById(roomId)
      .populate('ownerId', 'name')
      .populate('participants', 'name age');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.ownerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete' });
    }

    await Room.deleteOne({ _id: roomId });

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getJoinedRooms,
  joinRoom,
  leaveRoom,
  updateRoom,
  deleteRoom,
};
