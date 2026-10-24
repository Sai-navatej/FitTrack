const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
    }
    // In test mode, fallback to dedicated test secret if not set
    if (process.env.NODE_ENV === 'test') {
      return 'fittrack_test_mode_jwt_secret_key_999888777';
    }
    throw new Error('JWT_SECRET environment variable is required in server/.env');
  }
  return secret;
};

const getExpiresIn = () => {
  return process.env.JWT_EXPIRES_IN || '7d';
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: getExpiresIn(),
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
};

module.exports = {
  getJwtSecret,
  generateToken,
  verifyToken,
  getCookieOptions,
};
