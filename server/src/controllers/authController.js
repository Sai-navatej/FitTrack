const User = require('../models/User');
const WeightMeasurement = require('../models/WeightMeasurement');
const { generateToken, getCookieOptions } = require('../config/jwt');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      age,
      height,
      currentWeight,
      weightUnit = 'kg',
      fitnessGoal = 'maintenance',
      preferredSplit = 'ppl',
      dailyCalorieTarget = 2200,
      dailyWaterTarget = 2500,
    } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !age || !height || !currentWeight) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, email, password, age, height, and currentWeight.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      age: Number(age),
      height: Number(height),
      currentWeight: Number(currentWeight),
      weightUnit,
      fitnessGoal,
      preferredSplit,
      dailyCalorieTarget: Number(dailyCalorieTarget),
      dailyWaterTarget: Number(dailyWaterTarget),
    });

    // Create initial weight entry in WeightMeasurement collection
    await WeightMeasurement.create({
      user: user._id,
      weight: Number(currentWeight),
      unit: weightUnit,
      date: new Date(),
      notes: 'Initial weight recorded during registration',
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password.',
      });
    }

    // Check for user and explicitly include password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
