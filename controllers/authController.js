require('dotenv').config(); // โหลด .env
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SECRET_KEY = process.env.SECRET_KEY;

// ---------------------------------
// (A) ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน
// ---------------------------------
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // ค้นหาผู้ใช้จาก Token (โดยใช้ ID จาก req.user)
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ตรวจสอบว่ารหัสผ่านเดิมถูกต้องหรือไม่
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านใหม่
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating password' });
  }
};

// ---------------------------------
// (B) ฟังก์ชันสำหรับสมัครสมาชิก
// ---------------------------------
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // สร้างผู้ใช้ใหม่
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // สร้าง JWT Token
    const token = jwt.sign({ id: newUser._id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      userId: newUser._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};

// ---------------------------------
// (C) ฟังก์ชันสำหรับเข้าสู่ระบบ
// ---------------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ค้นหาผู้ใช้ตามอีเมล
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // สร้าง JWT Token
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};

// ---------------------------------
// (D) ฟังก์ชันสำหรับตรวจสอบข้อมูลผู้ใช้ (Protected Route)
// ---------------------------------
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};

// export ฟังก์ชันทั้งหมดที่ใช้
module.exports = {
  changePassword, // (A)
  signup,         // (B)
  login,          // (C)
  getUser,        // (D)
};
