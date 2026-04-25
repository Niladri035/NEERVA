import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Dna, Fish, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/* ── eDNA Analyzer ─────────────────────────────────── */
const SAMPLE_SEQS = [
  { label: 'Yellowfin Tuna', seq: 'GTTTGGTAACTGACTTGTCCCACTAATGATCGGAGCCCCAGACATAGCATTTCCTCGAATAAATAACATGAGCTTCTGACTTCTCCCCCCTTCC' },
  { label: 'Indian Mackerel', seq: 'CCTCTATCTAGTATTTGGTGCTTGAGCCGGAATAGTAGGCACTGCTCTAAGCCTCCTTATTCGAGCAGAACTAGGTCAACCAGGCACCCTACTA' },
  { label: 'Whale Shark', seq: 'ATCGGACATGAAATTCCTAGTTTAAATCCGCTCATCATCGGGGCTCCAGACATAGCCTTTCCCCGAATGAATAACATGAGCTTTTGACTCCTCC' },
];

function EdnaTab() {
  const [seq, setSeq] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const analyze = async () => {
    if (!seq.trim()) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const { data } = await axios.post('/api/chat/analyze-edna', { sequence: seq });
      setResult({ ...data.data, isMLVerified: data.isMLVerified });
    } catch (e) {
      setErr(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getConfColor = (c) => c > 0.8 ? '#00796b' : c > 0.6 ? '#f57c00' : '#c62828';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Input */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              🧬 eDNA Sequence Input
            </label>
            <textarea
              id="edna-input"
              className="edna-input"
              value={seq}
              onChange={e => setSeq(e.target.value)}
              placeholder="Paste environmental DNA sequence here (ATCG...), minimum 20 base pairs"
              rows={5}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Sample Sequences
            </p>
            {SAMPLE_SEQS.map((s, i) => (
              <button
                key={i}
                onClick={() => setSeq(s.seq)}
                className="btn-ghost"
                style={{ fontSize: '11px', padding: '5px 12px', marginRight: '6px', marginBottom: '6px', fontFamily: 'monospace' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            id="edna-analyze-btn"
            className="btn-primary"
            onClick={analyze}
            disabled={loading || !seq.trim()}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Dna size={15} /> Analyze Sequence</>}
          </button>

          {err && (
            <div style={{ marginTop: '12px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(239,83,80,0.08)', border: '1px solid rgba(239,83,80,0.2)', color: '#c62828', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}
        </div>
        {/* Result Column */}
        <div>
          {!result && !loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--ocean-200)', borderRadius: 'var(--radius-lg)' }}>
              <Dna size={40} strokeWidth={1.5} />
              <p style={{ fontSize: '14px', lineHeight: '1.6' }}>Enter a DNA sequence and click Analyze to identify marine species from the Indian Ocean.</p>
            </div>
          )}
          {loading && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--ocean-600)', padding: '40px' }}>
              <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '14px' }}>Processing k-mer signatures...</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['BLAST search', 'Taxonomy match', 'Confidence scoring'].map((s, i) => (
                  <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '50px', background: 'rgba(38,198,218,0.1)', color: 'var(--ocean-700)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {result && (
            <div className="species-card fade-in-up">
              {result.isMLVerified && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', background: 'var(--gradient-accent)', color: 'white', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 4px 12px rgba(38,198,218,0.3)' }}>
                    <CheckCircle size={10} /> ML Model Verified
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🪄 Powered by Cohere
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{result.commonName}</div>
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '2px' }}>{result.species}</div>
                </div>
                <Dna size={22} color="var(--ocean-400)" />
              </div>

              {/* Confidence */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Match Confidence</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: getConfColor(result.confidence) }}>
                    {Math.round((result.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="confidence-bar">
                  <div className="confidence-fill" style={{ width: `${(result.confidence || 0) * 100}%` }} />
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: result.density || 'High', prefix: '📊 Density:' },
                  { label: result.conservationStatus || 'Near Threatened', prefix: '🛡️' },
                  { label: result.habitat || 'Pelagic / Deep Sea', prefix: '🌊' },
                ].map((t, i) => (
                  <span key={i} style={{ padding: '6px 14px', borderRadius: '50px', background: 'rgba(38,198,218,0.1)', color: 'var(--ocean-700)', fontSize: '12px', fontWeight: '600' }}>
                    {t.prefix} {t.label}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>{result.description}</p>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--ocean-100)', paddingTop: '14px', display: 'flex', gap: '12px' }}>
                <span>🗺️ <strong>Zone:</strong> {result.oceanZone || 'Arabian Sea Central'}</span>
                {result.ecosystemRole && <span>🔬 <strong>Role:</strong> {result.ecosystemRole}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Species ID ─────────────────────────────────────── */
function SpeciesTab() {
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setResult(null); setErr('');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImageData(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const identify = async () => {
    if (!imageData) return;
    setLoading(true); setErr(''); setResult(null);
    try {
      const { data } = await axios.post('/api/chat/identify-species', { imageData });
      setResult(data.data);
    } catch (e) {
      setErr(e.response?.data?.error || 'Identification failed.');
    } finally {
      setLoading(false);
    }
  };

  const getConfColor = (c) => c > 0.8 ? '#00796b' : c > 0.6 ? '#f57c00' : '#c62828';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Upload */}
      <div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} id="species-file-input" onChange={e => handleFile(e.target.files[0])} />

        <div
          className={`upload-zone${drag ? ' dragover' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          id="upload-drop-zone"
          role="button"
          aria-label="Upload fish image"
          tabIndex={0}
        >
          {preview ? (
            <img src={preview} alt="Uploaded fish" className="upload-preview" />
          ) : (
            <>
              <Fish size={48} strokeWidth={1.5} color="var(--ocean-400)" style={{ marginBottom: '14px' }} />
              <p style={{ fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Drop fish image here</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>or click to browse · JPG, PNG, WEBP</p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button className="btn-ghost" onClick={() => { setPreview(null); setImageData(null); setResult(null); }} style={{ flex: 1, justifyContent: 'center', fontSize: '13px', padding: '10px' }}>
            Clear
          </button>
          <button
            id="species-identify-btn"
            className="btn-primary"
            onClick={identify}
            disabled={loading || !imageData}
            style={{ flex: 2, justifyContent: 'center' }}
          >
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Identifying...</> : <><Fish size={14} /> Identify Species</>}
          </button>
        </div>
        {err && (
          <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239,83,80,0.08)', color: '#c62828', fontSize: '13px' }}>
            ⚠️ {err}
          </div>
        )}
      </div>

      {/* Result Column */}
      <div style={{ position: 'relative' }}>
        {/* Scanning Overlay */}
        {loading && (
          <div className="scanning-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="scanning-line" style={{ background: 'linear-gradient(to right, transparent, var(--ocean-400), transparent)' }} />
            <div className="scanning-text" style={{ color: 'var(--ocean-700)', fontWeight: '700', marginTop: '20px' }}>Analyzing Morphology...</div>
          </div>
        )}

        {!result && !loading && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--ocean-200)', borderRadius: 'var(--radius-lg)' }}>
            <Upload size={40} strokeWidth={1.5} />
            <p style={{ fontSize: '14px' }}>Upload a fish photo and our Gemini Vision AI will identify the species instantly.</p>
          </div>
        )}

        {result && (
          <div className="edna-results-grid">
            <div className="glass species-result-card" style={{ padding: '24px', animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {result.isMarineSpecies === false ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  <AlertCircle size={32} style={{ marginBottom: '10px' }} />
                  <p>No marine species detected in this image.</p>
                </div>
              ) : (
                <>
                  <div className="card-header">
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div className="badge-ml">👁️ Vision Verified</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '50px', background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Powered by Gemini
                      </div>
                    </div>
                    <div className="species-titles">
                      <h2>{result.commonName}</h2>
                      <p className="scientific-name">{result.species}</p>
                    </div>
                  </div>

                  <div className="confidence-meter">
                    <div className="meter-header">
                      <span>Identification Confidence</span>
                      <span className="percent">{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${result.confidence * 100}%` }} />
                    </div>
                  </div>

                  <div className="metrics-grid">
                    <div className="metric-pill">
                      <span className="label">Conservation Status</span>
                      <span className="value" style={{ color: result.conservationStatus === 'Endangered' ? '#ff3d00' : 'inherit' }}>
                        {result.conservationStatus}
                      </span>
                    </div>
                    <div className="metric-pill">
                      <span className="label">Habitat</span>
                      <span className="value">{result.habitat || 'Pelagic'}</span>
                    </div>
                    <div className="metric-pill">
                      <span className="label">Avg Length</span>
                      <span className="value">{result.averageLength || '–'}</span>
                    </div>
                    <div className="metric-pill">
                      <span className="label">Primary Diet</span>
                      <span className="value">{result.diet || 'Varies'}</span>
                    </div>
                  </div>

                  <div className="genetic-summary">
                    <h3>Biologist's Fun Fact</h3>
                    <p>{result.fun_fact || result.description}</p>
                  </div>

                  {result.identificationFeatures?.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <p style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Key Features</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {result.identificationFeatures.map((f, i) => (
                          <span key={i} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '50px', background: 'rgba(0,172,193,0.08)', color: 'var(--ocean-700)', fontWeight: '600' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────── */
export default function ScientistPage() {
  const [tab, setTab] = useState('edna');

  return (
    <main className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <div className="section-badge"><Dna size={12} /> Marine Science Hub</div>
          <h1 className="section-title">Scientist Workbench</h1>
          <p className="section-sub" style={{ margin: '0 auto' }}>AI-powered eDNA metabarcoding and real-time species identification for marine research.</p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div className="tabs" style={{ maxWidth: '420px' }}>
            <button id="tab-edna" className={`tab-btn${tab === 'edna' ? ' active' : ''}`} onClick={() => setTab('edna')}>
              🧬 eDNA Analysis
            </button>
            <button id="tab-species" className={`tab-btn${tab === 'species' ? ' active' : ''}`} onClick={() => setTab('species')}>
              🐠 Species ID
            </button>
          </div>

          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '36px' }}>
            {tab === 'edna' ? <EdnaTab /> : <SpeciesTab />}
          </div>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', marginTop: '32px' }}>
            {[
              { icon: '🔬', title: 'Metabarcoding', desc: 'AI matches k-mer signatures against reference databases of 10,000+ marine species from the Indian Ocean.' },
              { icon: '👁️', title: 'Vision AI', desc: 'Gemini 1.5 Flash multimodal model analyzes morphological features for instant species recognition.' },
              { icon: '📊', title: 'IUCN Aligned', desc: 'All identification results include IUCN conservation status and ecosystem role classification.' },
            ].map((c, i) => (
              <div key={i} className="glass feature-card">
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{c.icon}</div>
                <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '8px', color: 'var(--text-primary)' }}>{c.title}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
