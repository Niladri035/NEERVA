require('dotenv').config();
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  console.log('--- NEERVA Model Discovery ---');
  try {
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    console.log('✅ Success! Available models:');
    res.data.models.forEach(m => {
      console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.error('❌ Failed to list models');
    console.error(err.response?.data || err.message);
  }
}

listModels();
