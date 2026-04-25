/**
 * Multi-Layer Communication Service
 * Priority: Internet API → SMS (Twilio/simulated) → LoRa (simulated broadcast)
 *
 * In production:
 *   - Replace smsSimulate() with real Twilio SDK call
 *   - Replace loraSimulate() with actual LoRa gateway HTTP call
 */

const axios = require('axios');

const COAST_GUARD_WEBHOOK = process.env.COAST_GUARD_WEBHOOK_URL || null;
const TWILIO_SID = process.env.TWILIO_SID || null;
const COAST_GUARD_SMS = process.env.COAST_GUARD_SMS_NUMBER || '+911554';

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1: Internet API alert
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaInternet(sosEvent) {
  if (!COAST_GUARD_WEBHOOK) {
    console.log('📡 [Internet] No webhook configured — logging alert:', sosEvent.boatId);
    return { layer: 'internet', status: 'logged', note: 'No webhook configured' };
  }

  const { data } = await axios.post(COAST_GUARD_WEBHOOK, {
    boatId: sosEvent.boatId,
    location: sosEvent.location,
    emergency: sosEvent.emergency,
    priority: sosEvent.priority,
    timestamp: new Date().toISOString(),
  }, { timeout: 6000 });

  return { layer: 'internet', status: 'sent', response: data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2: SMS fallback
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaSMS(sosEvent) {
  if (TWILIO_SID) {
    // Real Twilio call (uncomment when you have credentials):
    // const twilio = require('twilio')(TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: buildSMSMessage(sosEvent),
    //   from: process.env.TWILIO_FROM,
    //   to: COAST_GUARD_SMS,
    // });
    // return { layer: 'sms', status: 'sent', to: COAST_GUARD_SMS };
  }

  // Simulation
  const msg = buildSMSMessage(sosEvent);
  console.log(`📱 [SMS-SIM] To: ${COAST_GUARD_SMS}`);
  console.log(`   Message: ${msg}`);
  return { layer: 'sms', status: 'simulated', to: COAST_GUARD_SMS, message: msg };
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3: LoRa broadcast simulation
// ─────────────────────────────────────────────────────────────────────────────
async function sendViaLoRa(sosEvent) {
  const packet = {
    type: 'SOS',
    boatId: sosEvent.boatId,
    lat: sosEvent.location?.lat,
    lng: sosEvent.location?.lng,
    priority: sosEvent.priority,
    timestamp: Date.now(),
    ttl: 5, // hops before discard
  };

  // In production: POST to LoRa gateway API or serial port write
  console.log('📡 [LoRa-SIM] Broadcasting SOS packet:');
  console.log('  ', JSON.stringify(packet));

  return { layer: 'lora', status: 'broadcast-simulated', packet };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main dispatcher — tries each layer in priority order
// ─────────────────────────────────────────────────────────────────────────────
async function dispatchSOS(sosEvent, networkStatus = 'unknown') {
  const results = [];

  // Layer 1: Internet
  if (networkStatus !== 'offline') {
    try {
      const r = await sendViaInternet(sosEvent);
      results.push(r);
      if (r.status === 'sent') {
        console.log(`✅ [Comm] SOS dispatched via Internet for boat ${sosEvent.boatId}`);
        return { success: true, layer: 'internet', results };
      }
    } catch (err) {
      console.warn(`⚠️  [Comm] Internet layer failed: ${err.message}`);
      results.push({ layer: 'internet', status: 'failed', error: err.message });
    }
  }

  // Layer 2: SMS
  try {
    const r = await sendViaSMS(sosEvent);
    results.push(r);
    console.log(`✅ [Comm] SOS dispatched via SMS for boat ${sosEvent.boatId}`);
    return { success: true, layer: 'sms', results };
  } catch (err) {
    console.warn(`⚠️  [Comm] SMS layer failed: ${err.message}`);
    results.push({ layer: 'sms', status: 'failed', error: err.message });
  }

  // Layer 3: LoRa (always available — no network needed)
  try {
    const r = await sendViaLoRa(sosEvent);
    results.push(r);
    console.log(`✅ [Comm] SOS dispatched via LoRa for boat ${sosEvent.boatId}`);
    return { success: true, layer: 'lora', results };
  } catch (err) {
    console.error(`❌ [Comm] All layers failed for boat ${sosEvent.boatId}`);
    results.push({ layer: 'lora', status: 'failed', error: err.message });
    return { success: false, layer: null, results };
  }
}

function buildSMSMessage(sosEvent) {
  const { boatId, location, emergency, priority } = sosEvent;
  const lat = location?.lat?.toFixed(4) ?? '?';
  const lng = location?.lng?.toFixed(4) ?? '?';
  return `🆘 NEERVA SOS [${priority}] Boat:${boatId} | ${emergency} | GPS:${lat}N,${lng}E | Time:${new Date().toISOString()}`;
}

module.exports = { dispatchSOS };
