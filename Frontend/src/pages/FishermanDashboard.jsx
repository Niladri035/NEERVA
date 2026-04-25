import React, { useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Anchor, Navigation, Wind, Thermometer, AlertTriangle, ShieldCheck, Activity, Target, Compass, Bell, Users, Waves, Loader2 } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';

// Icons
const boatIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="font-size: 24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">🚤</div>`,
  iconSize: [24, 24]
});

const dangerIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="width:16px; height:16px; background:#ff006e; border-radius:50%; border:3px solid white; box-shadow: 0 0 15px rgba(255,0,110,0.8);"></div>`,
  iconSize: [16, 16]
});

// Component to auto-center map
function MapRefresher({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 12, { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function FishermanDashboard() {
  const { user } = useAuth();
  
  // Dashboard State
  const [safetyStatus, setSafetyStatus] = useState('SAFE'); // SAFE, CAUTION, HIGH_RISK
  const [location, setLocation] = useState([15.34, 73.89]);
  
  // Dynamic Fishing Zones based on user location
  const [fishingZones, setFishingZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);

  useEffect(() => {
    const fetchZones = async (lat, lng) => {
      try {
        const token = localStorage.getItem('neerva_token');
        const res = await axios.get(`/api/fisheries?lat=${lat}&lng=${lng}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data.success) {
          setFishingZones(res.data.data.fishingZones);
        }
      } catch (err) {
        console.error('Failed to fetch fishing zones:', err);
      } finally {
        setLoadingZones(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation([latitude, longitude]);
        fetchZones(latitude, longitude);
      }, (err) => {
        console.warn('Location access denied, using default.');
        fetchZones(15.34, 73.89);
      });
    } else {
      fetchZones(15.34, 73.89);
    }
  }, []);
  
  // AI Predictions (Mocked for Demo as per spec)
  const aiPredictions = [
    {
      type: 'Fishing Success',
      icon: <Target size={24} color="#0d9488" />,
      text: 'High chance of catch in next 2 hours (78%)',
      desc: 'Based on current thermal fronts and low wind.'
    },
    {
      type: 'Risk Prediction',
      icon: <Activity size={24} color={safetyStatus === 'SAFE' ? '#0d9488' : '#f57c00'} />,
      text: safetyStatus === 'SAFE' ? 'Conditions stable for next 3 hours.' : 'Risk increasing in next 45 mins due to wind speed rise.',
      desc: 'AI wind pattern analysis.'
    },
    {
      type: 'Safe Route Suggestion',
      icon: <Compass size={24} color="#00c8e0" />,
      text: 'Recommended path: Move 2km North to stay in safe zone.',
      desc: 'Avoiding localized high-current area.'
    }
  ];

  // Live Alerts
  const alerts = [
    { id: 1, type: 'warning', msg: 'High wind alert (30km/h) expected at 18:00', time: '10 mins ago' },
    { id: 2, type: 'info', msg: 'Fish density peak detected 5km North', time: '25 mins ago' },
  ];

  useGSAP(() => {
    // Initial reveal
    gsap.from('.stagger-fade', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out'
    });
  });

  return (
    <main className="page-wrapper" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      
      {/* 1. SAFETY STATUS BAR */}
      <div 
        className="stagger-fade"
        style={{ 
          width: '100%', 
          padding: '24px', 
          background: safetyStatus === 'SAFE' ? 'rgba(13, 148, 136, 0.15)' : safetyStatus === 'CAUTION' ? 'rgba(245, 124, 0, 0.15)' : 'rgba(255, 0, 110, 0.15)',
          borderBottom: `2px solid ${safetyStatus === 'SAFE' ? '#0d9488' : safetyStatus === 'CAUTION' ? '#f57c00' : '#ff006e'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: '80px',
          zIndex: 40
        }}
      >
        {safetyStatus === 'SAFE' && <ShieldCheck size={32} color="#0d9488" />}
        {safetyStatus !== 'SAFE' && <AlertTriangle size={32} color={safetyStatus === 'CAUTION' ? '#f57c00' : '#ff006e'} />}
        
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            STATUS: {safetyStatus}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Wave: 1.2m | Wind: 14 km/h | Weather: Clear | AI Risk: Low
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <h1 className="section-title stagger-fade" style={{ marginBottom: '32px' }}>Welcome, {user?.name || 'Fisherman'}</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 2. LIVE OCEAN MAP */}
            <div className="glass stagger-fade" style={{ height: '500px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Navigation size={20} color="var(--primary)" /> Tactical Ocean Map
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0d9488' }}>🟢 HIGH</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>🟠 MEDIUM</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#3b82f6' }}>🔵 LOW</span>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#ff006e' }}>🔴 DANGER</span>
                </div>
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative' }}>
                {loadingZones && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" color="var(--primary)" size={48} />
                  </div>
                )}
                <MapContainer center={location} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <MapRefresher center={location} />
                  
                  {/* Current User */}
                  <Marker position={location} icon={boatIcon}>
                    <Popup><strong>You</strong><br/>Status: Active</Popup>
                  </Marker>
                  
                  {/* Dynamic Fishing Zones */}
                  {fishingZones.map(zone => (zone.pos && (
                    <Circle 
                      key={zone.id} 
                      center={zone.pos} 
                      radius={zone.radius || 2000} 
                      pathOptions={{ color: zone.color || '#0d9488', fillColor: zone.color || '#0d9488', fillOpacity: 0.2, weight: 1 }}
                    >
                      <Popup>
                        <div style={{ minWidth: '150px' }}>
                          <strong style={{ color: zone.color, fontSize: '14px' }}>{zone.type} ACTIVITY</strong><br/>
                          <div style={{ margin: '4px 0', fontSize: '12px', fontWeight: 'bold' }}>{zone.label}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>AI Confidence: {(zone.confidence ? zone.confidence * 100 : 0).toFixed(0)}%</div>
                        </div>
                      </Popup>
                    </Circle>
                  )))}

                  {/* Danger Zone Heatmap (Red) */}
                  {location[0] && location[1] && (
                    <Circle center={[location[0] - 0.1, location[1] - 0.1]} radius={2000} pathOptions={{ color: '#ff006e', fillColor: '#ff006e', fillOpacity: 0.4 }}>
                      <Popup>Danger: Strong Currents</Popup>
                    </Circle>
                  )}

                  {/* Nearby Fisherman */}
                  <Marker position={[15.36, 73.91]} icon={boatIcon}>
                    <Popup><strong>Boat F-42</strong><br/>Distance: 2.5km</Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            {/* 5. AI PREDICTION SYSTEM */}
            <div className="glass stagger-fade" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Waves size={20} color="var(--primary)" /> Smart AI Predictions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {aiPredictions.map((ai, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '16px', padding: '20px', border: '1px solid var(--glass-border)', transition: 'transform 0.3s ease' }} className="feature-card">
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      {ai.icon}
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ai.type}</h4>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>{ai.text}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ai.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 7. TRIP STATUS CARD */}
            <div className="glass stagger-fade" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trip Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Live Coordinates</span>
                  <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                    {location[0].toFixed(4)}°N, {location[1].toFixed(4)}°E
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Zone Status</span>
                  <span style={{ fontWeight: '800', color: '#0d9488' }}>IN PRIME ZONE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>Time at sea</span>
                  <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>4h 22m</span>
                </div>
              </div>
            </div>

            {/* 6. FISH DENSITY INSIGHT */}
            <div className="glass stagger-fade" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(0, 200, 224, 0.05))' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} /> Fish Activity
              </h3>
              <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                High fish activity 5km North.
              </p>
            </div>

            {/* 4. LIVE ALERT PANEL */}
            <div className="glass stagger-fade" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} /> Live Alerts
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: a.type === 'warning' ? 'rgba(255,0,110,0.05)' : 'rgba(13, 148, 136, 0.05)',
                    borderLeft: `4px solid ${a.type === 'warning' ? '#ff006e' : '#0d9488'}`
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.msg}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
