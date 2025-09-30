require('dotenv').config();
const jwt = require('jsonwebtoken');

// 使用环境变量中的 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;

console.log('JWT_SECRET from .env:', JWT_SECRET);

const payload = {
  id: 'test-user-id',
  email: 'test@test.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

console.log('\nGenerated JWT Token:');
console.log(token);
console.log('\nPayload:');
console.log(payload);
