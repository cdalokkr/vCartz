import React, { useEffect } from 'react';
import { Sparkles, CheckCircle, Smartphone, ArrowRight, ShieldCheck, Mail, BarChart3, Database } from 'lucide-react';

export default function LandingPage({ onNavigate, updateSEO }) {
  useEffect(() => {
    updateSEO({
      title: 'vCardz | Multi-Tenant Digital Business Cards SaaS Platform',
      description: 'Create, share, and manage professional digital visiting cards under custom slugs. White-label digital business card platform for teams and agencies.',
      type: 'website'
    });
  }, []);

  return (
    <div className="landing-container">
      {/* Navbar */}
      <header className="landing-header">
        <div className="logo">
          <Sparkles className="logo-icon" />
          <h1>vCard<span>z</span></h1>
        </div>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#monetization">White-Label Plan</a>
          <a href="#pricing">Pricing</a>
          <button className="nav-login-btn" onClick={() => onNavigate('/login')}>
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <span className="badge"><Sparkles size={14} /> Next-Gen Business Cards</span>
          <h2>The Premium Multi-Tenant Digital Business Card Platform</h2>
          <p>
            Create multiple stunning profiles, share them via custom domain paths or slugs, and white-label the entire experience for your brand and clients.
          </p>
          <div className="hero-actions">
            <button className="primary-hero-btn" onClick={() => onNavigate('/register')}>
              Get Started Free <ArrowRight size={16} />
            </button>
            <button className="secondary-hero-btn" onClick={() => onNavigate('/sarah')}>
              View Demo Card
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-title">
          <h2>Product Capabilities</h2>
          <p>Designed for professionals, customized for agencies, and scalable for enterprises.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><Smartphone /></div>
            <h3>Dynamic Mobile Viewports</h3>
            <p>Sticky top headers, shrinking avatars on scroll/tab switch, and bottom navigation bar (Home, Contacts, About Us) optimized for mobile taps.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><Database /></div>
            <h3>Hybrid Relational DB</h3>
            <p>Unified database adapter supporting lightning-fast SQLite on Hostinger VPS and PostgreSQL/Supabase serverless queries on Vercel.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon"><BarChart3 /></div>
            <h3>Visitor Analytics</h3>
            <p>Real-time tracking of profile views, call-to-actions, and social link clicks. Displayed in high-quality visual dashboards.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon"><ShieldCheck /></div>
            <h3>Tenant Administration</h3>
            <p>No messy self-signups. Administrators create and invite clients, who receive dedicated credentials to self-manage their cards.</p>
          </div>
        </div>
      </section>

      {/* White Label Plan details */}
      <section id="monetization" className="landing-section dark-bg">
        <div className="white-label-wrapper">
          <div className="white-label-text">
            <span className="badge-purple">Monetization & White-Labeling Blueprint</span>
            <h2>Run Your Own Digital Business Card Agency</h2>
            <p>
              Under our White-Label tier, you can map your custom domain (e.g. <code>cards.myagency.com</code>), inject your own logos, color palettes, and invoice your own clients directly.
            </p>
            <ul className="wl-bullets">
              <li><CheckCircle size={16} className="bullet-icon" /> <strong>Custom Domain CNAMEs:</strong> Point any domain to the server.</li>
              <li><CheckCircle size={16} className="bullet-icon" /> <strong>Independent Client Login:</strong> Clients manage their details in a portal with your branding.</li>
              <li><CheckCircle size={16} className="bullet-icon" /> <strong>NFC Integration Ready:</strong> Map custom card URLs to physical NTAG213 cards in seconds.</li>
            </ul>
          </div>
          <div className="white-label-graphic">
            <div className="spec-display">
              <div className="spec-header">
                <div className="dot red"></div>
                <div className="dot yellow"></div>
                <div className="dot green"></div>
                <span className="spec-title">portal-settings.config</span>
              </div>
              <pre className="spec-code">
{`{
  "brandName": "Aether Cards",
  "domain": "cards.aether.com",
  "tenantId": "tenant_aether_9832",
  "theme": {
    "primary": "#1e1b4b",
    "accent": "#D3B20D"
  },
  "clientAccounts": 14,
  "billingTier": "Agency Enterprise"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="landing-section">
        <div className="section-title">
          <h2>Monetization Pricing Tiers</h2>
          <p>Choose the model that fits your professional needs or business scale.</p>
        </div>
        
        <div className="pricing-grid">
          <div className="pricing-card">
            <h4>Free Plan</h4>
            <div className="price">$0<span>/mo</span></div>
            <p>For individuals starting out.</p>
            <ul>
              <li>1 Digital Card Profile</li>
              <li>vCardz Footer Branding</li>
              <li>Standard Aura Glass Theme</li>
              <li>Local SQLite Storage</li>
            </ul>
            <button className="pricing-btn" onClick={() => onNavigate('/register')}>Get Started</button>
          </div>
          
          <div className="pricing-card active">
            <div className="popular-badge">SaaS Best Value</div>
            <h4>Professional Plan</h4>
            <div className="price">$5<span>/mo</span></div>
            <p>For independent professionals & freelancers.</p>
            <ul>
              <li>Up to 5 Digital Cards</li>
              <li>Remove vCardz Branding</li>
              <li>All Themes & Accent Tints</li>
              <li>Advanced Visitor Stats & Analytics</li>
            </ul>
            <button className="pricing-btn" onClick={() => onNavigate('/register')}>Start Free Trial</button>
          </div>
          
          <div className="pricing-card">
            <h4>White-Label Agency</h4>
            <div className="price">$49<span>/mo</span></div>
            <p>For business teams and marketing agencies.</p>
            <ul>
              <li>Custom Domain Mapping (CNAME)</li>
              <li>100% Custom Portal Branding</li>
              <li>Client Invitation Portal (Admin Invites)</li>
              <li>NFC Setup Wizard</li>
            </ul>
            <button className="pricing-btn" onClick={() => onNavigate('/register')}>Buy Agency Tier</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} vCardz SaaS. Built for developers and agencies.</p>
      </footer>
    </div>
  );
}
