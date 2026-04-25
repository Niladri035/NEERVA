import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, UserPlus, Ship, FlaskConical, ShieldCheck, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('fisherman');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister 
        ? { ...formData, role } 
        : { username: formData.username, password: formData.password };
      
      const res = await axios.post(endpoint, payload);
      
      // Use AuthContext to log in
      login(res.data.user, res.data.token);
      
      // Success animation delay
      setTimeout(() => {
        const uRole = res.data.user.role;
        if (uRole === 'coastguard') navigate('/coastguard');
        else if (uRole === 'scientist') navigate('/scientist');
        else if (uRole === 'admin') navigate('/admin');
        else navigate('/fisherman');
      }, 500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'fisherman', label: 'Fisherman', icon: <Ship size={20} />, desc: 'Access tactical maps & catch analytics' },
    { id: 'scientist', label: 'Scientist', icon: <FlaskConical size={20} />, desc: 'eDNA analysis & genomic research' },
    { id: 'coastguard', label: 'Coast Guard', icon: <ShieldCheck size={20} />, desc: 'Vessel tracking & emergency command' }
  ];

  return (
    <main className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 20px' }}>
      <div className="glass glow-pulse" style={{ 
        padding: '50px', 
        borderRadius: 'var(--radius-xl)', 
        width: '100%', 
        maxWidth: '480px',
        position: 'relative',
        border: '1px solid var(--glass-border)',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* Toggle Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Join NEERVA' : 'System Access'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Oceanic Intelligence & Marine Governance Platform
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(255, 0, 110, 0.1)', 
            color: 'var(--accent-sos)', 
            padding: '12px', 
            borderRadius: '12px', 
            fontSize: '13px', 
            marginBottom: '24px',
            textAlign: 'center',
            border: '1px solid rgba(255, 0, 110, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  required
                  placeholder="Admiral Ackbar"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="chat-input" 
                  style={{ width: '100%', paddingLeft: '48px', height: '52px' }} 
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                placeholder="commander_7"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="chat-input" 
                style={{ width: '100%', paddingLeft: '48px', height: '52px' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="chat-input" 
                style={{ width: '100%', paddingLeft: '48px', height: '52px' }} 
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'block' }}>Select Your Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {roles.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      border: `2px solid ${role === r.id ? 'var(--primary)' : 'transparent'}`,
                      background: role === r.id ? 'rgba(13, 148, 136, 0.08)' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: role === r.id ? 'var(--primary)' : 'rgba(13, 148, 136, 0.1)',
                      color: role === r.id ? '#fff' : 'var(--primary)',
                      transition: 'all 0.3s ease'
                    }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{r.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary" 
            style={{ marginTop: '10px', justifyContent: 'center', height: '54px', fontSize: '16px' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegister ? 'Create Account' : 'Initialize Session')}
            {!loading && <ChevronRight size={18} style={{ marginLeft: '4px' }} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-secondary)', 
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}
          >
            {isRegister ? (
              <><User size={14} /> Already have an account? <span style={{ color: 'var(--primary)' }}>Login</span></>
            ) : (
              <><UserPlus size={14} /> Need access? <span style={{ color: 'var(--primary)' }}>Create Profile</span></>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
