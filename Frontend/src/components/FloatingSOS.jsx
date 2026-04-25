import { Radio, AlertTriangle, Ship } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import React, { useState, useEffect } from 'react';

export default function FloatingSOS() {
  const { user, token } = useAuth();
  const [status, setStatus] = useState('idle'); // idle, selecting, sending, sent, rescue_enroute
  const [error, setError] = useState('');
  const [rescueMsg, setRescueMsg] = useState('');
  const [selectedType, setSelectedType] = useState('Immediate Assistance');

  const helpTypes = [
    { id: 'Medical', label: 'Medical Emergency', icon: '🚑' },
    { id: 'Mechanical', label: 'Engine/Mechanical', icon: '⚙️' },
    { id: 'Sinking', label: 'Taking Water/Sinking', icon: '🌊' },
    { id: 'Fuel', label: 'Out of Fuel', icon: '⛽' },
    { id: 'Other', label: 'Other/Unknown', icon: '❓' },
  ];

  useEffect(() => {
    if (!user) return;
    const socket = io('/', { transports: ['websocket'] }); // Use proxy for cleaner connection
    
    socket.on('rescue_status', (data) => {
      if (data.boatId === `User-${user.username}`) {
        setRescueMsg(data.message);
        setStatus('rescue_enroute');
      }
    });

    return () => socket.disconnect();
  }, [user]);

  // Only show for logged in users
  if (!user) return null;

  useGSAP(() => {
    if (status === 'idle') {
      gsap.to('.global-sos-glow', {
        scale: 1.2,
        opacity: 0,
        duration: 1.5,
        repeat: -1,
        ease: 'power2.out'
      });
    }
  }, [status]);

  const handleSOSClick = () => {
    if (status === 'idle') {
      setStatus('selecting');
    }
  };

  const confirmSOS = (type) => {
    setSelectedType(type.label);
    dispatchSOS(type.label);
  };

  const dispatchSOS = async (typeLabel) => {
    setStatus('sending');
    setError('');
    
    // Get Real GPS coordinates from browser
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      setStatus('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      try {
        const payload = {
          boatId: `User-${user.username}`,
          fishermanName: user.name,
          emergency: typeLabel || 'Immediate Assistance Required',
          lat: latitude,
          lng: longitude,
          triggerType: 'manual',
          temperature: 29,
          windSpeed: 25,
          pressure: 1005
        };

        const res = await axios.post('/api/sos', payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('✅ SOS Server Response:', res.data);
        setStatus('sent');
        
        // Reset after 30 seconds (longer for real emergency)
        setTimeout(() => setStatus('idle'), 30000);

      } catch (err) {
        console.error('❌ SOS Dispatch Error:', err.response?.data || err.message);
        setError('Dispatch failed. Check connection.');
        setStatus('idle');
      }
    }, (err) => {
      console.error('❌ Geolocation Error:', err);
      setError(`Location access denied: ${err.message}`);
      setStatus('idle');
    }, { enableHighAccuracy: true });
  };

  return (
    <div style={{ position: 'fixed', bottom: '40px', right: '40px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
      
      {/* Help Selection Canvas */}
      {status === 'selecting' && (
        <div className="glass" style={{ 
          padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.95)', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '300px',
          animation: 'slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: '#ff006e' }}>WHAT HELP IS NEEDED?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {helpTypes.map(type => (
              <button 
                key={type.id}
                onClick={() => confirmSOS(type)}
                style={{ 
                  padding: '12px 16px', borderRadius: '12px', border: '1px solid #eee',
                  background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  fontWeight: '700', fontSize: '14px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#fff0f5'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <span style={{ fontSize: '20px' }}>{type.icon}</span> {type.label}
              </button>
            ))}
            <button 
              onClick={() => setStatus('idle')}
              style={{ marginTop: '8px', padding: '8px', border: 'none', background: 'none', color: '#666', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {status === 'sent' && (
        <div className="glass" style={{ padding: '16px 24px', borderRadius: '12px', background: '#00796b', color: 'white', fontWeight: 'bold', animation: 'slideUp 0.3s ease' }}>
          Safety Beacon Active. Command Center Notified.
        </div>
      )}

      {status === 'rescue_enroute' && (
        <div className="glass" style={{ padding: '16px 24px', borderRadius: '12px', background: '#0d9488', color: 'white', fontWeight: 'bold', animation: 'slideUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Ship className="animate-bounce" /> {rescueMsg}
        </div>
      )}
      
      {error && (
        <div className="glass" style={{ padding: '12px 20px', borderRadius: '8px', background: '#c62828', color: 'white', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* SOS Button */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <div className="global-sos-glow" style={{ position: 'absolute', inset: 0, background: '#ff006e', borderRadius: '50%', zIndex: 0 }}></div>
        <button 
          onClick={handleSOSClick}
          disabled={status === 'sending' || status === 'sent'}
          style={{ 
            position: 'absolute', inset: 0, zIndex: 1,
            borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)',
            background: (status === 'sent' || status === 'rescue_enroute') ? '#00796b' : 'linear-gradient(135deg, #ff006e, #c62828)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (status === 'sending' || status === 'sent') ? 'default' : 'pointer',
            boxShadow: '0 10px 20px rgba(255,0,110,0.4)',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: status === 'selecting' ? 'scale(1.1)' : 'scale(1)'
          }}
          aria-label="SOS Emergency Button"
        >
          {status === 'idle' && <span style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.5px' }}>SAFE</span>}
          {status === 'selecting' && <AlertTriangle size={32} color="white" />}
          {status === 'sending' && <Radio size={32} style={{ animation: 'pulse 1s infinite' }} />}
          {status === 'sent' && <span style={{ fontWeight: '900', fontSize: '14px' }}>WAIT</span>}
          {status === 'rescue_enroute' && <Ship size={32} color="white" />}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
