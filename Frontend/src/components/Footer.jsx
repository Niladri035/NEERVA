import React from 'react';
import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">🌊 NEERVA</div>
            <p className="footer-desc">
              AI-powered marine intelligence for the Indian Ocean. Empowering fishermen, scientists, and policymakers with real-time ocean data and predictive analytics.
            </p>
          </div>
          <div>
            <div className="footer-heading">Platform</div>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/map">Ocean Map</Link></li>
              <li><Link to="/scientist">Scientist Hub</Link></li>
              <li><Link to="/chat">AI Assistant</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Features</div>
            <ul className="footer-links">
              <li><a href="#features">eDNA Analysis</a></li>
              <li><a href="#features">Species ID</a></li>
              <li><a href="#features">SOS System</a></li>
              <li><a href="#features">Risk Alerts</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-heading">Compliance</div>
            <ul className="footer-links">
              <li><a href="#sdg">SDG 14</a></li>
              <li><a href="#sdg">Marine Policy</a></li>
              <li><a href="#sdg">IUCN Status</a></li>
              <li><a href="#sdg">Coast Guard API</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2025 NEERVA Marine Intelligence Platform. Built for the Indian Ocean.</span>
          <span className="footer-copy" style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Waves size={14} /> Protecting Life Below Water · SDG 14
          </span>
        </div>
      </div>
    </footer>
  );
}
