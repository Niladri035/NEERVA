require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

async function testKey() {
  console.log('--- NEERVA API Key Diagnostic ---');
  console.log(`Key Found: ${GEMINI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`Key Prefix: ${GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 4) : 'N/A'}`);
  
  if (!GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY is missing from .env');
    return;
  }

  if (!GEMINI_API_KEY.startsWith('AIza')) {
    console.warn('⚠️  Warning: This does not look like a standard Google Gemini key (should start with "AIza").');
  }

  try {
    console.log('📡 Attempting to contact Google Gemini API...');
    const res = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: 'Hello' }] }]
    });
    console.log('✅ SUCCESS! API is working perfectly.');
    console.log('AI Response:', res.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error('❌ API TEST FAILED');
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error('Error Detail:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

testKey();
