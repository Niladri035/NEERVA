/**
 * Boat Simulator — generates realistic boat telemetry data.
 * Simulates 5 boats with movement, weather conditions, and risk escalation.
 *
 * Run: node scripts/simulateBoat.js
 * Requires backend running on localhost:3001
 */

const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const API = process.env.BACKEND_URL || 'http://localhost:3001';

const BOATS = [
  { boatId: 'BOAT-SIM-01', name: 'Sea Explorer',  lat: 19.2, lng: 72.8, deviceKey: 'demo-key-001' },
  { boatId: 'BOAT-SIM-02', name: 'Ocean Pride',   lat: 18.5, lng: 70.2, deviceKey: 'demo-key-002' },
  { boatId: 'BOAT-SIM-03', name: 'Marine Star',   lat: 16.8, lng: 73.1, deviceKey: 'demo-key-003' },
  { boatId: 'BOAT-SIM-04', name: 'Blue Horizon',  lat: 20.1, lng: 69.5, deviceKey: 'demo-key-004' },
  { boatId: 'BOAT-SIM-05', name: 'Deep Fisher',   lat: 12.5, lng: 79.0, deviceKey: 'demo-key-005' },
];

let tick = 0;

function randomBetween(min, max) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function getConditions(tickN) {
  // Simulate gradually worsening conditions over time
  const escalation = Math.min(tickN / 20, 1); // 0 → 1 over 20 ticks
  return {
    temperature: randomBetween(27 + escalation * 6, 29 + escalation * 6),
    windSpeed:   randomBetween(10 + escalation * 55, 20 + escalation * 55),
    pressure:    randomBetween(1020 - escalation * 30, 1015 - escalation * 30),
    movement:    randomBetween(Math.max(5, 90 - escalation * 85), 95 - escalation * 80),
  };
}

async function sendHeartbeat(boat, conditions) {
  const drift = () => (Math.random() - 0.5) * 0.05;
  try {
    await axios.post(`${API}/api/boats/heartbeat`, {
      boatId: boat.boatId,
      lat: boat.lat + drift(),
      lng: boat.lng + drift(),
      ...conditions,
    }, { timeout: 3000 });
    process.stdout.write('.');
  } catch {
    process.stdout.write('x');
  }
}

async function assessRisk(boat, conditions) {
  try {
    const { data } = await axios.post(`${API}/api/risk/assess`, {
      boatId: boat.boatId,
      ...conditions,
    }, { timeout: 3000 });

    if (data.risk !== 'SAFE') {
      console.log(`\n⚠️  [${boat.name}] Risk: ${data.risk} (${(data.confidence * 100).toFixed(0)}%) — ${data.recommendation}`);
    }
    return data.risk;
  } catch {
    return 'UNKNOWN';
  }
}

async function runTick() {
  tick++;
  console.log(`\n⏱  Tick ${tick} — simulating ${BOATS.length} boats`);

  const conditions = getConditions(tick);
  console.log(`   Conditions: temp=${conditions.temperature}°C | wind=${conditions.windSpeed}km/h | pressure=${conditions.pressure}hPa | movement=${conditions.movement}`);

  for (const boat of BOATS) {
    await sendHeartbeat(boat, conditions);
    const risk = await assessRisk(boat, conditions);

    // Auto-trigger SOS if DANGER and tick > 15 (simulate escalation scenario)
    if (risk === 'DANGER' && tick > 15) {
      console.log(`\n🆘 [${boat.name}] Auto-SOS triggered (DANGER threshold)`);
      try {
        await axios.post(`${API}/api/sos-alerts`, {
          fishermanName: `Sim: ${boat.name}`,
          boatName: boat.name,
          contact: '+91 90000 00000',
          latitude: boat.lat,
          longitude: boat.lng,
          crewSize: '3',
          emergency: 'Auto-SOS: DANGER conditions detected',
          description: `Wind ${conditions.windSpeed}km/h | Pressure ${conditions.pressure}hPa | Temp ${conditions.temperature}°C`,
        }, { timeout: 3000 });
      } catch {}
    }
  }
}

async function main() {
  console.log(`🚤 NEERVA Boat Simulator starting...`);
  console.log(`   Target: ${API}`);
  console.log(`   Simulating ${BOATS.length} boats, conditions escalate over 20 ticks\n`);

  // Run immediately, then every 10 seconds
  await runTick();
  const interval = setInterval(async () => {
    await runTick();
    if (tick >= 25) {
      console.log('\n✅ Simulation complete.');
      clearInterval(interval);
    }
  }, 10000);
}

main();
