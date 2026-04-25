import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { Map as MapIcon, Fish, ThermometerSun, Wind } from 'lucide-react';

/* Fish density zones — Indian Ocean */
const ZONES = [
  { id: 1, name: 'Zone A1 — Arabian Sea NW', lat: 19.0, lng: 72.0, density: 'High', fish: 'Tuna, Mackerel', temp: 28.4, wind: 18, status: 'Optimal' },
  { id: 2, name: 'Zone B2 — Arabian Sea SW', lat: 15.0, lng: 74.0, density: 'Medium', fish: 'Sardine, Pomfret', temp: 29.1, wind: 22, status: 'Good' },
  { id: 3, name: 'Zone C3 — Lakshadweep', lat: 10.5, lng: 73.5, density: 'High', fish: 'Tuna, Reef Fish', temp: 27.8, wind: 14, status: 'Optimal' },
  { id: 4, name: 'Zone D4 — Gulf of Kutch', lat: 22.5, lng: 70.0, density: 'Low', fish: 'Pomfret, Shrimp', temp: 31.2, wind: 28, status: 'Poor' },
  { id: 5, name: 'Zone E5 — Bay of Bengal', lat: 13.0, lng: 82.0, density: 'High', fish: 'Hilsa, Mackerel', temp: 28.9, wind: 20, status: 'Optimal' },
  { id: 6, name: 'Zone F6 — Andaman Sea', lat: 11.0, lng: 93.0, density: 'Medium', fish: 'Grouper, Snapper', temp: 29.5, wind: 16, status: 'Good' },
  { id: 7, name: 'Zone G7 — Palk Strait', lat: 9.5, lng: 79.5, density: 'Medium', fish: 'Prawn, Cuttlefish', temp: 30.1, wind: 19, status: 'Good' },
  { id: 8, name: 'Zone H8 — Kerala Coast', lat: 9.0, lng: 76.5, density: 'High', fish: 'Sardine, Tuna', temp: 27.5, wind: 15, status: 'Optimal' },
  { id: 9, name: 'Zone I9 — Malabar Coast', lat: 11.5, lng: 75.2, density: 'High', fish: 'Mackerel, Anchovy', temp: 27.9, wind: 17, status: 'Optimal' },
  { id: 10, name: 'Zone J10 — Odisha Coast', lat: 20.0, lng: 87.5, density: 'Low', fish: 'Prawn, Ribbonfish', temp: 30.8, wind: 25, status: 'Poor' },
];

const getDensityColor = (d) => ({
  High: '#00796b', Medium: '#f57c00', Low: '#c62828'
}[d] || '#26c6da');

const getDensityRadius = (d) => ({ High: 28, Medium: 20, Low: 14 }[d] || 18);

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? ZONES : ZONES.filter(z => z.density === filter);

  return (
    <main className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <div className="section-badge"><MapIcon size={12} /> Live Ocean Intelligence</div>
          <h1 className="section-title">High-Density Fish Map</h1>
          <p className="section-sub" style={{ margin: '0 auto' }}>Real-time fish density visualization across Indian Ocean zones with temperature and risk overlays.</p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container">
          {/* Filter + legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="tabs" style={{ margin: 0, maxWidth: '400px' }}>
              {['All', 'High', 'Medium', 'Low'].map(f => (
                <button key={f} className={`tab-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)} id={`filter-${f.toLowerCase()}`}>
                  {f === 'All' ? '🗺️ All Zones' : f === 'High' ? '🟢 High' : f === 'Medium' ? '🟡 Medium' : '🔴 Low'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[['#00796b', 'High Density'], ['#f57c00', 'Medium Density'], ['#c62828', 'Low Density']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, display: 'inline-block', opacity: 0.8 }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            {/* Map */}
            <div className="map-container glass" style={{ height: '520px' }}>
              <MapContainer
                center={[15, 78]}
                zoom={5}
                style={{ height: '100%', width: '100%', borderRadius: '24px' }}
                zoomControl={false}
              >
                <ZoomControl position="bottomright" />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  opacity={0.7}
                />
                {filtered.map(zone => (
                  <CircleMarker
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={getDensityRadius(zone.density)}
                    pathOptions={{
                      fillColor: getDensityColor(zone.density),
                      color: getDensityColor(zone.density),
                      fillOpacity: 0.35,
                      weight: 2,
                      opacity: 0.8,
                    }}
                    eventHandlers={{ click: () => setSelected(zone) }}
                  >
                    <Popup>
                      <div style={{ fontFamily: 'Outfit, sans-serif', minWidth: '180px' }}>
                        <strong style={{ fontSize: '13px' }}>{zone.name}</strong><br />
                        <span style={{ color: getDensityColor(zone.density), fontWeight: '700' }}>{zone.density} Density</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>🐟 {zone.fish}</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>🌡️ {zone.temp}°C · 💨 {zone.wind} km/h</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Zone list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
              {filtered.map(zone => (
                <div
                  key={zone.id}
                  className={`glass`}
                  onClick={() => setSelected(zone === selected ? null : zone)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    border: selected?.id === zone.id ? '1.5px solid var(--ocean-400)' : '1px solid var(--glass-border)',
                    transform: selected?.id === zone.id ? 'translateX(-4px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3' }}>{zone.name}</div>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px',
                      background: `${getDensityColor(zone.density)}18`, color: getDensityColor(zone.density)
                    }}>{zone.density}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    🐟 {zone.fish}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>🌡️ {zone.temp}°C</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💨 {zone.wind} km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginTop: '24px' }}>
            {[
              { icon: <Fish size={18} />, value: `${ZONES.filter(z => z.density === 'High').length}`, label: 'High Density Zones', color: '#00796b' },
              { icon: <Fish size={18} />, value: `${ZONES.length}`, label: 'Total Monitored Zones', color: 'var(--ocean-600)' },
              { icon: <ThermometerSun size={18} />, value: `${(ZONES.reduce((a, z) => a + z.temp, 0) / ZONES.length).toFixed(1)}°C`, label: 'Avg Sea Temp', color: '#f57c00' },
              { icon: <Wind size={18} />, value: `${Math.round(ZONES.reduce((a, z) => a + z.wind, 0) / ZONES.length)} km/h`, label: 'Avg Wind Speed', color: 'var(--ocean-700)' },
            ].map((s, i) => (
              <div key={i} className="glass stat-card">
                <div style={{ color: s.color, marginBottom: '8px' }}>{s.icon}</div>
                <div className="stat-value" style={{ fontSize: '26px', color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
