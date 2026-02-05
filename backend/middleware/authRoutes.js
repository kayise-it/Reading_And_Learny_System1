// middleware/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

const router = express.Router();

/**
 * REGISTER
 * name, email, password, role (optional)
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide name, email, and password" 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Force student role for registration
    // Admin users should be created manually in database
    const userRole = 'student';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - always as student
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      grade: req.body.grade || 'Grade 4',
      maxAttempts: 3,
      attemptsUsed: 0
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`✅ New student registered: ${email}`);
    
    res.status(201).json({ 
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        maxAttempts: user.maxAttempts,
        attemptsUsed: user.attemptsUsed
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "Email already exists" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error during registration",
      error: err.message 
    });
  }
});

/**
 * LOGIN
 * email + password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide email and password" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`✅ User logged in: ${email}`);
    
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade,
        maxAttempts: user.maxAttempts,
        attemptsUsed: user.attemptsUsed
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during login",
      error: err.message 
    });
  }
});

/**
 * GET USER PROFILE
 * Requires token in Authorization header
 */
router.get("/profile", async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      user 
    });
  } catch (err) {
    console.error("Profile error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
});

/**
 * CHANGE PASSWORD
 * Requires token in header
 */
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Current password and new password are required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 6 characters" 
      });
    }
    
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`✅ Password changed for user: ${user.email}`);
    
    res.json({ 
      success: true,
      message: "Password changed successfully" 
    });
  } catch (err) {
    console.error("Change password error:", err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
});

/**
 * CHECK IF EMAIL EXISTS
 */
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }
    
    const user = await User.findOne({ email });
    
    res.json({
      success: true,
      exists: !!user,
      message: user ? "Email already registered" : "Email available"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: err.message 
    });
  }
});

module.exports = router;