import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Waves, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/',          label: 'Home',      roles: ['*'] },
  { to: '/map',       label: 'Ocean Map', roles: ['*'] },
  { to: '/chat',      label: 'AI Chat',   roles: ['*'] },
  { to: '/scientist', label: 'Scientist', roles: ['scientist', 'admin'] },
  { to: '/coastguard',label: 'Coast Guard', roles: ['coastguard', 'admin'] },
  { to: '/fisherman', label: 'Fisherman', roles: ['fisherman', 'admin'] },
  { to: '/admin',     label: 'Admin',     roles: ['admin'] },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <img 
              src="/NEERVA_Logo-removebg-preview.png" 
              alt="NEERVA Logo" 
              className="nav-logo-img"
            />
          </div>
          <span style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>NEERVA</span>
        </Link>

        {/* Links */}
        <ul className="nav-links" role="list">
          {NAV.map(n => {
            // Check role permissions
            const hasAccess = !user && n.roles.includes('*') 
              ? true 
              : user && (n.roles.includes('*') || n.roles.includes(user.role));
            
            if (!hasAccess) return null;
            
            return (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  {n.label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        <div className="nav-cta">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {user.role}
              </span>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
                <LogOut size={16} style={{ marginRight: '6px' }} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/chat" className="btn-ghost" style={{ padding: '9px 22px', fontSize: '13px', border: 'none' }}>
                🤖 Ask AI
              </Link>
              <Link to="/login" className="btn-primary" style={{ padding: '9px 22px', fontSize: '13px' }}>
                <UserIcon size={16} style={{ marginRight: '6px' }} /> Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
