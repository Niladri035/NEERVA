import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Waves, Map, MessageSquare, Dna, Activity } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Counter({ target, suffix = '' }) {
  const ref = useRef(null);
  
  useGSAP(() => {
    gsap.fromTo(ref.current, 
      { innerHTML: 0 },
      {
        innerHTML: target,
        duration: 2.5,
        ease: 'power3.out',
        snap: { innerHTML: 1 },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 90%',
        },
        onUpdate: function() {
          ref.current.innerHTML = Math.round(this.targets()[0].innerHTML).toLocaleString() + suffix;
        }
      }
    );
  }, [target, suffix]);
  
  return <span ref={ref}>0{suffix}</span>;
}

const splitText = (text) => text.split('').map((char, i) => (
  <span key={i} className="hero-char" style={{ display: 'inline-block', opacity: 0 }}>
    {char === ' ' ? '\u00A0' : char}
  </span>
));

const FEATURES = [
  { icon: '🧬', title: 'eDNA Analysis', desc: 'Identify marine species from environmental DNA sequences using AI-powered metabarcoding.', to: '/scientist', color: '#0d9488' },
  { icon: '🐠', title: 'Species Identification', desc: 'Upload fish photos for instant AI-powered species recognition with confidence scores.', to: '/scientist', color: '#00c8e0' },
  { icon: '🗺️', title: 'Density Mapping', desc: 'High-resolution fish density heat maps with real-time zone updates for optimal fishing.', to: '/map', color: '#0d9488' },
  { icon: '🤖', title: 'NEERVA AI Chat', desc: 'Conversational AI assistant for ocean conditions, safety protocols and fishing guidance.', to: '/chat', color: '#00c8e0' },
  { icon: '🆘', title: 'SOS System', desc: 'Multi-layer emergency dispatch with AI risk validation and coast guard integration.', to: '/fisherman', color: '#0d9488' },
  { icon: '📡', title: 'Real-Time Alerts', desc: 'Weather-linked risk alerts, seasonal predictions and regulatory compliance checks.', to: '/coastguard', color: '#00c8e0' },
];

const STATS = [
  { value: 1247, suffix: '+', label: 'Active Vessels' },
  { value: 2450, suffix: 't', label: 'Monthly Catch' },
  { value: 98,   suffix: '%', label: 'SOS Success Rate' },
  { value: 47,   suffix: '',  label: 'Ocean Zones' },
];

export default function HomePage() {
  const heroRef = useRef();
  const waveRef = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Letter-by-letter reveal
    tl.fromTo('.hero-eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 })
      .to('.hero-char', { 
        opacity: 1, 
        y: 0, 
        stagger: 0.02, 
        duration: 0.8, 
        ease: 'back.out(1.5)',
        startAt: { y: 20 }
      }, '-=0.4')
      .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .fromTo('.hero-actions a', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' }, '-=0.6');

    // 2. AI Core scales in
    tl.fromTo('.hero-orb-container', 
      { scale: 0.8, opacity: 0, filter: 'blur(20px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'elastic.out(1, 0.75)' },
      '-=1.5'
    );

    // 3. Badges slide in
    tl.fromTo('.hero-badge', 
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, stagger: 0.2, duration: 0.8, ease: 'power3.out' },
      '-=1'
    );

    // SVG Wave Divider
    gsap.fromTo(waveRef.current, 
      { strokeDashoffset: 1440 },
      {
        strokeDashoffset: 0,
        duration: 3,
        ease: 'sine.inOut',
        scrollTrigger: { trigger: '.wave-divider', start: 'top 80%' }
      }
    );

    // Circular Data Rings
    gsap.to('.data-ring', { rotation: 360, transformOrigin: 'center center', duration: 20, repeat: -1, ease: 'linear' });
    gsap.to('.data-ring-reverse', { rotation: -360, transformOrigin: 'center center', duration: 25, repeat: -1, ease: 'linear' });

  }, { scope: heroRef });

  return (
    <main className="page-wrapper" ref={heroRef}>
      <section className="hero-section" id="home" aria-label="Hero" style={{ paddingTop: '160px' }}>
        <div className="container">
          <div className="hero-grid">
            <div style={{ zIndex: 2 }}>
              <div className="hero-eyebrow">
                <Waves size={13} /> Marine Intelligence Platform
              </div>
              <h1 className="hero-title" style={{ overflow: 'hidden', display: 'flex', flexWrap: 'wrap', rowGap: '8px', columnGap: '12px' }}>
                <div style={{ whiteSpace: 'nowrap' }}>{splitText('Ocean')}</div>
                <div style={{ whiteSpace: 'nowrap' }}>{splitText('Intelligence,')}</div>
                <div style={{ width: '100%' }}></div>
                <div style={{ whiteSpace: 'nowrap' }}>{splitText('Powered')}</div>
                <div style={{ whiteSpace: 'nowrap' }}>{splitText('by')}</div>
                <div style={{ 
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'nowrap'
                }}>
                  {splitText('AI')}
                </div>
              </h1>
              <p className="hero-desc">
                NEERVA integrates real-time ocean data, environmental DNA analysis, species identification, and AI risk assessment to protect fishermen and preserve marine ecosystems.
              </p>
              <div className="hero-actions">
                <Link to="/chat" className="btn-primary"><MessageSquare size={16} /> Ask NEERVA AI</Link>
                <Link to="/map" className="btn-ghost"><Map size={16} /> Explore Ocean Map</Link>
              </div>
            </div>

            <div className="hero-visual hero-orb-container">
              <svg style={{ position: 'absolute', width: '130%', height: '130%', zIndex: 0, overflow: 'visible' }} viewBox="0 0 500 500">
                <circle className="data-ring" cx="250" cy="250" r="220" fill="none" stroke="rgba(13, 148, 136, 0.2)" strokeWidth="1" strokeDasharray="10 15" />
                <circle className="data-ring-reverse" cx="250" cy="250" r="240" fill="none" stroke="rgba(0, 200, 224, 0.15)" strokeWidth="2" strokeDasharray="30 20" />
                <circle className="data-ring" cx="250" cy="250" r="200" fill="none" stroke="rgba(13, 148, 136, 0.3)" strokeWidth="0.5" />
              </svg>

              <div className="hero-orb float-loop" style={{ zIndex: 1 }}>
                <div className="hero-orb-inner">
                  <div className="hero-orb-text glow-pulse">🌊</div>
                  <div className="hero-orb-label">NEERVA AI</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>System Active</div>
                </div>
              </div>

              {[
                { top: '10%', right: '-10%', icon: '🐟', label: '47 Species' },
                { bottom: '10%', left: '-8%', icon: '📡', label: 'Live Monitoring' },
                { top: '50%', right: '-14%', icon: '🆘', label: 'SOS Ready' },
              ].map((b, i) => (
                <div key={i} className="glass hero-badge float-loop" style={{
                  position: 'absolute', top: b.top, bottom: b.bottom, left: b.left, right: b.right, zIndex: 2,
                  padding: '12px 20px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px',
                  animationDelay: `${i * 0.5}s`, fontSize: '14px', fontWeight: '700', color: 'var(--primary)', whiteSpace: 'nowrap'
                }}>
                  <span>{b.icon}</span>{b.label}
                </div>
              ))}
            </div>
          </div>

          <div className="stats-grid section" style={{ marginTop: '40px', padding: '0' }}>
            {STATS.map((s, i) => (
              <div key={i} className="glass stat-card float-loop" style={{ animationDelay: `${0.2 * i}s` }}>
                <div className="stat-value"><Counter target={s.value} suffix={s.suffix} /></div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="wave-divider" style={{ marginTop: '80px' }}>
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            ref={waveRef}
            d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30" 
            stroke="rgba(13, 148, 136, 0.4)" strokeWidth="3" fill="none" 
            strokeDasharray="1440" strokeDashoffset="1440"
          />
          <path d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z" fill="rgba(13, 148, 136, 0.08)" />
        </svg>
      </div>

      <section className="section" id="features">
        <div className="container">
          <div style={{ marginBottom: '60px', textAlign: 'center' }}>
            <div className="section-badge"><Dna size={12} /> Capabilities</div>
            <h2 className="section-title">Marine Intelligence Ecosystem</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>From eDNA sequencing to real-time SOS dispatch — NEERVA provides a complete suite of ocean monitoring tools.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <Link key={i} to={f.to} style={{ textDecoration: 'none' }}>
                <div className="glass feature-card float-loop" style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className="feature-icon">
                    <span style={{ fontSize: '24px' }}>{f.icon}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="sdg" style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05), rgba(0, 200, 224, 0.05))', borderTop: '1px solid rgba(255,255,255,0.5)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-badge"><Activity size={12} /> SDG 14 · Life Below Water</div>
          <h2 className="section-title" style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
            Committed to Sustainable Ocean Management
          </h2>
          <p className="section-sub" style={{ margin: '0 auto 40px' }}>
            NEERVA aligns with the United Nations' Sustainable Development Goal 14, protecting marine biodiversity while supporting the livelihoods of coastal fishing communities.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {['🐋 Marine Biodiversity', '🌊 Ecosystem Health', '⚖️ Fishery Regulation', '🔬 Scientific Research'].map((t, i) => (
              <div key={i} className="glass float-loop" style={{ padding: '14px 24px', borderRadius: '50px', fontSize: '15px', fontWeight: '600', color: 'var(--primary)', animationDelay: `${0.1 * i}s` }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
