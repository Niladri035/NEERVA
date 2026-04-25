import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Shield, Map as MapIcon, AlertTriangle, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import gsap from 'gsap';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COAST_GUARD_STATIONS = [
  // West Coast
  { id: 'porbandar', name: 'Porbandar HQ (Gujarat)', pos: [21.64, 69.60] },
  { id: 'mumbai', name: 'Mumbai Western Base', pos: [18.94, 72.81] },
  { id: 'goa', name: 'Goa Central Base', pos: [15.40, 73.80] },
  { id: 'kochi', name: 'Kochi Southern Base', pos: [9.93, 76.26] },
  
  // East Coast
  { id: 'haldia', name: 'Haldia North-East HQ', pos: [22.02, 88.06] },
  { id: 'vizag', name: 'Visakhapatnam Eastern Base', pos: [17.68, 83.21] },
  { id: 'chennai', name: 'Chennai South-East Base', pos: [13.08, 80.27] },
];

const findNearestStation = (lat, lng) => {
  let nearest = COAST_GUARD_STATIONS[0];
  let minDistance = Infinity;
  COAST_GUARD_STATIONS.forEach(station => {
    const dist = Math.sqrt(Math.pow(station.pos[0] - lat, 2) + Math.pow(station.pos[1] - lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  });
  return nearest;
};

const findDistance = (lat1, lng1, pos2) => {
  return Math.sqrt(Math.pow(pos2[0] - lat1, 2) + Math.pow(pos2[1] - lng1, 2));
};

const sosIcon = L.divIcon({
  className: 'sos-icon-wrapper',
  html: `<div style="position:relative;">
           <div class="sos-pulse" style="position:absolute; top:-15px; left:-15px; width:40px; height:40px; background:#ff006e; border-radius:50%; z-index:1;"></div>
           <div style="position:absolute; top:-5px; left:-5px; width:20px; height:20px; background:#ff006e; border-radius:50%; border:3px solid white; z-index:2;"></div>
         </div>`,
  iconSize: [10, 10]
});

const boatIcon = L.divIcon({
  className: 'boat-icon-wrapper',
  html: `<div style="font-size: 24px; transform: translate(-50%, -50%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">🚤</div>`,
  iconSize: [24, 24]
});

const baseIcon = L.divIcon({
  className: 'base-icon-wrapper',
  html: `<div style="width:16px; height:16px; background:#00796b; border-radius:50%; border:3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [16, 16]
});

const pathOptions = { color: '#00796b', weight: 4, dashArray: '10, 10', opacity: 0.8 };

function AnimatedRescueSystem({ dispatchedAlert }) {
  const map = useMap();
  const [pos, setPos] = useState(COAST_GUARD_STATIONS[1].pos);
  const [base, setBase] = useState(null);
  const [target, setTarget] = useState(null);
  const [isEnRoute, setIsEnRoute] = useState(false);
  
  useEffect(() => {
    if (!dispatchedAlert) {
      setBase(null);
      setTarget(null);
      setIsEnRoute(false);
      return;
    }

    const tLat = parseFloat(dispatchedAlert.location?.lat);
    const tLng = parseFloat(dispatchedAlert.location?.lng);
    if (isNaN(tLat) || isNaN(tLng)) return;

    const nearestBase = findNearestStation(tLat, tLng);
    setBase(nearestBase.pos);
    
    // Create a "Water Line" path
    // We add an intermediate "Sea Waypoint" to ensure the boat stays in the ocean
    // offset towards the west (longitude 73.7 range)
    const midPoint = [
      (nearestBase.pos[0] + tLat) / 2,
      Math.min(nearestBase.pos[1], tLng) - 0.05 // Curve out to sea
    ];
    
    const fullPath = [nearestBase.pos, midPoint, [tLat, tLng]];
    setTarget(fullPath); // Store the whole path
    setPos(nearestBase.pos);
    setIsEnRoute(true);

    const bounds = L.latLngBounds(fullPath);
    map.flyToBounds(bounds, { padding: [100, 100], duration: 1.5 });
    
    // Animate along the 3-point path
    const timeline = gsap.timeline({ delay: 2 });
    
    // Segment 1: Base to MidPoint
    timeline.to(nearestBase.pos, {
      duration: 3,
      onUpdate: function() {
        const progress = this.progress();
        const lat = nearestBase.pos[0] + (midPoint[0] - nearestBase.pos[0]) * progress;
        const lng = nearestBase.pos[1] + (midPoint[1] - nearestBase.pos[1]) * progress;
        setPos([lat, lng]);
        map.panTo([lat, lng], { animate: true, duration: 0.1 });
      }
    });

    // Segment 2: MidPoint to Target
    timeline.to(midPoint, {
      duration: 3,
      onUpdate: function() {
        const progress = this.progress();
        const lat = midPoint[0] + (tLat - midPoint[0]) * progress;
        const lng = midPoint[1] + (tLng - midPoint[1]) * progress;
        setPos([lat, lng]);
        map.panTo([lat, lng], { animate: true, duration: 0.1 });
      },
      onComplete: () => {
        setIsEnRoute(false);
        map.flyTo([tLat, tLng], 14, { duration: 1.5 });
      }
    });

    return () => timeline.kill();
  }, [dispatchedAlert, map]);

  return (
    <>
      {COAST_GUARD_STATIONS.map(s => (
        <Marker key={s.id} position={s.pos} icon={baseIcon}>
          <Popup><strong>{s.name}</strong></Popup>
          <CircleMarker center={s.pos} radius={50} pathOptions={{ color: '#00796b', fillOpacity: 0.05, weight: 1 }} />
        </Marker>
      ))}
      {target && <Polyline positions={target} pathOptions={pathOptions} />}
      {isEnRoute && <Marker position={pos} icon={boatIcon} />}
    </>
  );
}

export default function CoastGuardDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [dispatchedId, setDispatchedId] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('neerva_token');
        const res = await axios.get('/api/sos?status=Active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data.success) setAlerts(res.data.data);
      } catch (err) { console.error('Fetch failed', err); }
    };
    fetchAlerts();

    const socket = io('http://127.0.0.1:3001', { transports: ['websocket'] }); // Direct connection to backend IP for reliability
    socket.on('connect', () => {
      console.log('📡 Coast Guard Socket Connected:', socket.id);
      socket.emit('join_role', 'coastguard');
    });

    socket.on('new_sos_alert', (alert) => {
      console.log('🚨 REAL-TIME SOS RECEIVED:', alert);
      setAlerts(prev => {
        const exists = prev.find(a => (a.eventId && a.eventId === alert.eventId) || (a.boatId === alert.boatId && a.emergency === alert.emergency));
        if (exists) return prev;
        return [alert, ...prev];
      });
    });

    socket.on('sos_status_updated', ({ eventId, status }) => {
      console.log('📝 Status Update:', eventId, status);
      setAlerts(prev => prev.map(a => a.eventId === eventId ? { ...a, status } : a));
    });

    socket.on('connect_error', (err) => console.error('🔌 Socket Error:', err));

    return () => {
      console.log('🔌 Disconnecting Coast Guard Socket');
      socket.disconnect();
    };
  }, []);

  const dismissAlert = async (eventId) => {
    try {
      const token = localStorage.getItem('neerva_token');
      // Update status in DB so it doesn't reappear on refresh
      await axios.patch(`/api/sos/${eventId}/status`, { status: 'Resolved' }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAlerts(prev => prev.filter(a => a.eventId !== eventId));
      if (dispatchedId === eventId) setDispatchedId(null);
    } catch (err) {
      console.error('Dismiss failed', err);
      // Fallback: still remove from UI if it was already resolved or not found
      setAlerts(prev => prev.filter(a => a.eventId !== eventId));
    }
  };

  const handleDispatch = async (alert) => {
    try {
      setDispatchedId(alert.boatId);
      const token = localStorage.getItem('neerva_token');
      const eid = alert.eventId || `SOS-${Date.now()}`;
      await axios.patch(`/api/sos/${eid}/status`, { status: 'Coast Guard Dispatched' }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) { console.error('Dispatch failed', err); }
  };

  return (
    <main style={{ paddingTop: '100px', minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00796b', fontWeight: 'bold', marginBottom: '10px' }}>
          <Shield size={20} /> NEERVA SAFETY COMMAND
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '30px' }}>Maritime Safety Command</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="glass" style={{ height: '600px', borderRadius: '24px', padding: '20px', overflow: 'hidden' }}>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ width: '100%', height: '100%', borderRadius: '16px' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <AnimatedRescueSystem dispatchedAlert={alerts.find(a => a.boatId === dispatchedId) || null} />
              {alerts.map((a, i) => a.location?.lat && (
                <Marker key={i} position={[a.location.lat, a.location.lng]} icon={sosIcon}>
                  <Popup><strong>{a.boatId}</strong><br/>{a.emergency}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="glass" style={{ borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px' }}>Active Emergencies</h2>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>No active emergencies.</p> : 
                alerts.map((a, i) => (
                  <div key={i} style={{ 
                    padding: '15px', 
                    background: 'rgba(255,0,110,0.05)', 
                    borderLeft: '4px solid #ff006e', 
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <button 
                      onClick={() => dismissAlert(a.eventId)}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                      title="Dismiss Alert"
                    >
                      <XCircle size={16} />
                    </button>

                    <strong style={{ color: '#ff006e' }}>{a.emergency}</strong><br/>
                    <small style={{ color: '#444', fontWeight: 'bold' }}>Vessel: {a.boatId}</small>
                    
                    <button 
                      onClick={() => handleDispatch(a)}
                      disabled={dispatchedId === a.boatId}
                      className="btn-primary" 
                      style={{ 
                        width: '100%', marginTop: '10px', padding: '8px', 
                        background: dispatchedId === a.boatId ? '#4caf50' : '#00796b',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      {dispatchedId === a.boatId ? (
                        <><CheckCircle2 size={16} /> Unit En Route</>
                      ) : (
                        <><Navigation size={16} /> Dispatch Unit</>
                      )}
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
