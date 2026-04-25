/**
 * Fake SOS Trigger — for hackathon demo testing.
 * Sends a realistic SOS with various trigger types.
 *
 * Run: node scripts/triggerSOS.js [trigger-type]
 * Types: manual | voice | auto | no-movement
 */

const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const API = process.env.BACKEND_URL || 'http://localhost:3001';

const TRIGGER_SCENARIOS = {
  manual: {
    fishermanName: 'Demo Fisherman',
    boatName: 'Test Vessel MH-123',
    contact: '+91 98765 00000',
    latitude: '19.0760',
    longitude: '72.8777',
    crewSize: '4',
    emergency: 'Engine Failure',
    description: 'Engine completely failed during fishing. Boat drifting. Need immediate tow.',
  },
  voice: {
    fishermanName: 'Voice Trigger Demo',
    boatName: 'Deep Sea KL-456',
    contact: '+91 98765 11111',
    latitude: '18.5',
    longitude: '70.2',
    crewSize: '2',
    emergency: 'Voice SOS triggered — MAYDAY detected',
    description: 'Voice recognition detected distress call. Auto-alert activated.',
  },
  auto: {
    fishermanName: 'Auto SOS System',
    boatName: 'Storm Rider GJ-789',
    contact: '+91 98765 22222',
    latitude: '20.1',
    longitude: '69.5',
    crewSize: '5',
    emergency: 'Auto-SOS: DANGER conditions detected',
    description: 'AI system detected critical weather: Wind >65km/h, Pressure <985hPa. Automatic SOS triggered.',
  },
  'no-movement': {
    fishermanName: 'Inactivity Alert',
    boatName: 'Silent Drifter TN-321',
    contact: '+91 98765 33333',
    latitude: '12.5',
    longitude: '79.0',
    crewSize: '1',
    emergency: 'Auto-SOS: No movement detected for 45 minutes',
    description: 'Dead man\'s switch triggered. Fisherman has not responded to check-in for 45 minutes.',
  },
};

async function triggerSOS(type = 'manual') {
  const scenario = TRIGGER_SCENARIOS[type] || TRIGGER_SCENARIOS.manual;
  console.log(`\n🆘 Triggering ${type.toUpperCase()} SOS...`);
  console.log(`   Boat: ${scenario.boatName}`);
  console.log(`   Emergency: ${scenario.emergency}`);
  console.log(`   Location: ${scenario.latitude}°N, ${scenario.longitude}°E\n`);

  try {
    const { data } = await axios.post(`${API}/api/sos-alerts`, scenario, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    console.log('✅ SOS sent successfully:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ SOS trigger failed:', err.response?.data || err.message);
  }
}

async function triggerAll() {
  console.log('🧪 Triggering all SOS scenarios...\n');
  for (const type of Object.keys(TRIGGER_SCENARIOS)) {
    await triggerSOS(type);
    await new Promise(r => setTimeout(r, 1000));
  }
}

// CLI
const arg = process.argv[2];
if (arg === 'all') {
  triggerAll();
} else {
  triggerSOS(arg || 'manual');
}
