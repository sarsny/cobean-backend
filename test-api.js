const jwt = require('jsonwebtoken');

// Generate a test JWT token
const testToken = jwt.sign(
  { id: 'test-user-123', email: 'test@example.com' },
  'your_super_secret_jwt_key_for_development_only',
  { expiresIn: '1h' }
);

console.log('Generated JWT Token:', testToken);
console.log('\n=== API Testing Commands ===\n');

// Health check
console.log('1. Health Check:');
console.log('curl -X GET http://localhost:3000/api/v1/health\n');

// Test thoughts endpoints
console.log('2. Create Thought:');
console.log(`curl -X POST http://localhost:3000/api/v1/thoughts \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${testToken}" \\
  -d '{
    "title": "Test Thought",
    "description": "This is a test thought to verify the API is working correctly."
  }'\n`);

console.log('3. Get All Thoughts:');
console.log(`curl -X GET http://localhost:3000/api/v1/thoughts \\
  -H "Authorization: Bearer ${testToken}"\n`);

console.log('4. Get Thought by ID (replace THOUGHT_ID):');
console.log(`curl -X GET http://localhost:3000/api/v1/thoughts/THOUGHT_ID \\
  -H "Authorization: Bearer ${testToken}"\n`);

console.log('5. Get Thought Context (replace THOUGHT_ID):');
console.log(`curl -X GET http://localhost:3000/api/v1/thoughts/THOUGHT_ID/context \\
  -H "Authorization: Bearer ${testToken}"\n`);

// Test actions endpoints
console.log('6. Generate Action (replace THOUGHT_ID):');
console.log(`curl -X POST http://localhost:3000/api/v1/actions/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${testToken}" \\
  -d '{
    "thought_id": "THOUGHT_ID",
    "context": "Generate a creative action",
    "preferences": ["creative", "practical"]
  }'\n`);

console.log('7. Get Actions by Thought (replace THOUGHT_ID):');
console.log(`curl -X GET http://localhost:3000/api/v1/actions/thought/THOUGHT_ID \\
  -H "Authorization: Bearer ${testToken}"\n`);

// Test choices endpoints
console.log('8. Create Choice (replace ACTION_ID and THOUGHT_ID):');
console.log(`curl -X POST http://localhost:3000/api/v1/choices \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${testToken}" \\
  -d '{
    "action_id": "ACTION_ID",
    "thought_id": "THOUGHT_ID",
    "choice_type": "action_selection",
    "selected_option": "Option A",
    "available_options": ["Option A", "Option B", "Option C"],
    "context": "Choosing the best approach"
  }'\n`);

console.log('9. Get User Choices:');
console.log(`curl -X GET http://localhost:3000/api/v1/choices/user \\
  -H "Authorization: Bearer ${testToken}"\n`);

console.log('=== Testing Notes ===');
console.log('- Make sure the development server is running: npm run dev');
console.log('- Replace THOUGHT_ID, ACTION_ID with actual IDs from previous responses');
console.log('- The API currently uses mock Supabase configuration');
console.log('- For production, configure real Supabase credentials in .env file');