const jwt = require('jsonwebtoken');

// 使用与配置文件相同的默认 secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

const payload = {
  id: 'test-user-id',
  email: 'test@test.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

console.log('Generated JWT Token:');
console.log(token);
console.log('\nPayload:');
console.log(payload);
