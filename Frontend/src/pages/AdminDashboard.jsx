import React, { useRef, useState, useEffect } from 'react';
import { Users, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import axios from 'axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function StatCard({ icon, value, label, delay }) {
  const numRef = useRef();
  
  useGSAP(() => {
    gsap.fromTo(numRef.current,
      { innerHTML: 0 },
      {
        innerHTML: value,
        duration: 2,
        delay: delay,
        ease: 'power2.out',
        snap: { innerHTML: 1 },
        onUpdate: function() {
          numRef.current.innerHTML = Math.round(this.targets()[0].innerHTML).toLocaleString();
        }
      }
    );
  }, [value, delay]);

  return (
    <div className="glass stat-card float-loop" style={{ animationDelay: `${delay}s` }}>
      <div style={{ color: 'var(--ocean-600)', marginBottom: '12px' }}>{icon}</div>
      <div ref={numRef} className="stat-value" style={{ fontSize: '32px' }}>0</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeFishermen: 0,
    sosToday: 0,
    compliance: 98,
    monitoredZones: 7
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const [boatsRes, sosRes] = await Promise.all([
          axios.get('/api/boats'),
          axios.get('/api/sos-alerts')
        ]);
        
        // Count SOS alerts from today
        const today = new Date().toDateString();
        const sosTodayCount = (sosRes.data.data || []).filter(
          alert => new Date(alert.createdAt).toDateString() === today
        ).length;

        setStats({
          activeFishermen: boatsRes.data.count || 0,
          sosToday: sosTodayCount,
          compliance: 98,
          monitoredZones: 7
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    }
    fetchStats();
  }, []);

  useGSAP(() => {
    // E. ADMIN STATS ANIMATION (Progress Bars)
    gsap.fromTo('.progress-fill',
      { width: '0%' },
      {
        width: (i, target) => target.dataset.target,
        duration: 1.5,
        ease: 'power3.out',
        stagger: 0.2,
        delay: 0.5
      }
    );
  });

  return (
    <main className="page-wrapper" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="section-badge"><ShieldCheck size={12} /> System Administration</div>
        <h1 className="section-title">Platform Analytics</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '40px' }}>
          <StatCard icon={<Users size={24} />} value={stats.activeFishermen} label="Active Fishermen" delay={0.1} />
          <StatCard icon={<AlertTriangle size={24} />} value={stats.sosToday} label="SOS Today" delay={0.2} />
          <StatCard icon={<ShieldCheck size={24} />} value={stats.compliance} label="Compliance %" delay={0.3} />
          <StatCard icon={<Activity size={24} />} value={stats.monitoredZones} label="Monitored Zones" delay={0.4} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>
          
          {/* SDG Progress */}
          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>SDG 14 Compliance Metrics</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Marine Protected Area Compliance', val: '92%' },
                { label: 'Sustainable Fishing Limits', val: '85%' },
                { label: 'eDNA Monitoring Coverage', val: '64%' }
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    <span>{m.label}</span>
                    <span>{m.val}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--ocean-100)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div className="progress-fill" data-target={m.val} style={{ height: '100%', background: 'var(--gradient-accent)', width: '0%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Policy Insight Panel */}
          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '32px', background: 'linear-gradient(135deg, rgba(38,198,218,0.1), rgba(0,172,193,0.05))' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>AI Policy Insights</h2>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Gemini AI analysis indicates a <strong>15% increase</strong> in Sardine populations in Zone B2. Recommendation: Relax quota by 5% for the upcoming season.
            </p>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
              Generate Full Report
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
