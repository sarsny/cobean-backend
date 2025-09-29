const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testRoutesExist() {
  console.log('Testing if routes exist (checking for 404 vs other errors)...\n');

  const routes = [
    'POST /chats/with-thought',
    'POST /chats/with-action', 
    'GET /chats/with-thought',
    'GET /chats/with-action'
  ];

  for (const route of routes) {
    const [method, path] = route.split(' ');
    console.log(`Testing ${route}`);
    
    try {
      let response;
      if (method === 'POST') {
        response = await axios.post(`${BASE_URL}${path}`, {});
      } else {
        response = await axios.get(`${BASE_URL}${path}`);
      }
      console.log(`✅ Route exists (status: ${response.status})`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Route NOT FOUND (404)');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Route exists but requires authentication');
      } else {
        console.log(`✅ Route exists (error: ${error.response?.status || 'unknown'})`);
      }
    }
    console.log('');
  }
}

testRoutesExist();
