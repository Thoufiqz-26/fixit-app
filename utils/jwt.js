const jwt = require('jsonwebtoken');

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return s || 'fixit_dev_secret_CHANGE_IN_PROD';
};

const signToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, secret(), { expiresIn });

const verifyToken = (token) =>
  jwt.verify(token, secret());

module.exports = { signToken, verifyToken };
