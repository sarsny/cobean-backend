require('dotenv').config();
const jwt = require('jsonwebtoken');

const payload = {
  id: 'test-user-123',  // 匹配 thought 的 user_id
  email: 'test@test.com'
};

const secret = process.env.JWT_SECRET || 'fallback-secret-key';
const token = jwt.sign(payload, secret, { expiresIn: '7d' });

console.log('JWT_SECRET:', secret);
console.log('Generated JWT Token:', token);
console.log('Payload:', payload);
