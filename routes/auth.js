require('dotenv').config(); // โหลด .env
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { changePassword } = require('../controllers/authController');  // ฟังก์ชันเปลี่ยนรหัสผ่าน
const upload = require('../middleware/upload'); // Middleware สำหรับอัปโหลดไฟล์

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// ---------------------------------------
// (1) เปลี่ยนรหัสผ่าน
// ---------------------------------------
router.put('/profile/change-password', authMiddleware, changePassword);

// ---------------------------------------
// (2) สมัครสมาชิก
// ---------------------------------------
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: newUser._id
    });
  } catch (err) {
    console.error('Error during signup:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// (3) เข้าสู่ระบบ
// ---------------------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user._id
    });
  } catch (err) {
    console.error('Error during login:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// (4) ดึงข้อมูลโปรไฟล์
// ---------------------------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // req.user คือ userId ที่ได้จาก authMiddleware
    const user = await User.findById(req.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// (5) อัปเดตข้อมูลโปรไฟล์
// ---------------------------------------
router.put('/profile/update', authMiddleware, async (req, res) => {
  const { name, phone, email, province, age } = req.body;

  try {
    const updatedData = {};
    if (name) updatedData.name = name;
    if (phone) updatedData.phone = phone;
    if (email) updatedData.email = email;
    if (province) updatedData.province = province;

    if (age !== undefined) {
      if (age < 0 || age > 100) {
        return res.status(400).json({ message: 'Age must be between 0 and 100' });
      }
      updatedData.age = age;
    }

    const user = await User.findByIdAndUpdate(req.user, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user
    });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------
// (6) อัปโหลดรูปโปรไฟล์
// ---------------------------------------
router.post('/profile/upload', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // เก็บพาธรูป เช่น /uploads/xxxxx.jpg
    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user,
      { profileImage: imagePath },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile image updated successfully',
      user
    });
  } catch (err) {
    console.error('Error uploading profile image:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
