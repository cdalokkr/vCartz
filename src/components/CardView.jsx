import React, { useState, useEffect } from 'react';
import { 
  Home, Phone, Info, Mail, MapPin, Share2, QrCode, 
  UserPlus, Copy, X, Sparkles, Globe, Calendar, Building2, ArrowLeft, AlertTriangle, CreditCard, CheckCircle, Briefcase
} from 'lucide-react';

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='100%25' height='100%25' fill='%230f172a'/><circle cx='12' cy='8' r='4' fill='%23475569'/><path d='M4 20c0-3.3 3.3-6 8-6s8 2.7 8 6' fill='%23475569'/></svg>";

export default function CardView({ slug, updateSEO, onGoHome }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home, contacts, about
  const [qrOpen, setQrOpen] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1, backgroundImage: '' });

  // Renewal & Payment Mock States
  const [selectedPlan, setSelectedPlan] = useState('1_month');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [renewing, setRenewing] = useState(false);
  const [renewalSuccess, setRenewalSuccess] = useState(false);
  
  // Copy state feedback flags
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  // Load Card Details
  const fetchCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/cards/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Digital Visiting Card Not Found');
        }
        throw new Error('Failed to load card');
      }
      const data = await response.json();
      setCard(data);
      
      // Trigger SEO Engine Update
      if (!data.expired) {
        updateSEO({
          title: `${data.name} | ${data.job_title} - ${data.company || 'Digital Business Card'}`,
          description: data.bio || `Connect with ${data.name}. View contact details, phone, email, and social profiles.`,
          image: data.avatar_url,
          type: 'profile',
          schema: {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
              "@type": "Person",
              "name": data.name,
              "jobTitle": data.job_title,
              "worksFor": {
                "@type": "Organization",
                "name": data.company
              },
              "telephone": data.phone,
              "email": data.email,
              "image": data.avatar_url,
              "sameAs": Object.values(data.socials).filter(Boolean)
            }
          }
        });
      } else {
        updateSEO({
          title: `Expired Card Profile - ${data.name}`,
          description: 'This digital visiting card has expired.'
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [slug]);

  // Log Clicks Analytics
  const logClickAnalytics = async (type, detail = '') => {
    try {
      await fetch(`/api/public/analytics/${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ event_type: type, event_detail: detail })
      });
    } catch (err) {
      console.error('Failed to log click statistics:', err);
    }
  };

  // Mock checkout processor
  const handleRenewCard = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) {
      alert('Please fill out all credit card billing details.');
      return;
    }

    setRenewing(true);
    try {
      const response = await fetch(`/api/public/cards/${slug}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan: selectedPlan })
      });

      if (response.ok) {
        setRenewalSuccess(true);
        // Reload card profile details after showing success animation
        setTimeout(async () => {
          await fetchCard();
          setRenewalSuccess(false);
          setCardNumber('');
          setCardExpiry('');
          setCardCvc('');
        }, 2200);
      } else {
        alert('Renewal payment could not be processed. Please check card values.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the payment processor gateway.');
    } finally {
      setRenewing(false);
    }
  };

  // 3D Tilt Handlers
  const handleMouseMove = (e) => {
    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = -12 * (mouseY / (height / 2));
    const rotateY = 12 * (mouseX / (width / 2));
    const shineAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);

    setTilt({
      rotateX,
      rotateY,
      scale: 1.03,
      backgroundImage: `linear-gradient(${shineAngle}deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%)`
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1, backgroundImage: '' });
  };

  // Generate .vcf Download
  const handleSaveContact = () => {
    logClickAnalytics('save_contact');
    
    const parts = card.name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    let vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${card.name}`,
    ];

    if (card.company) vcard.push(`ORG:${card.company}`);
    if (card.job_title) vcard.push(`TITLE:${card.job_title}`);
    if (card.phone) vcard.push(`TEL;TYPE=CELL,VOICE:${card.phone}`);
    if (card.email) vcard.push(`EMAIL;TYPE=PREF,INTERNET:${card.email}`);
    if (card.bio) vcard.push(`NOTE:${card.bio.replace(/\n/g, '\\n')}`);
    if (card.gmap) vcard.push(`URL;TYPE=WORK:${card.gmap}`);

    // Social accounts
    if (card.socials.lnkLinkedIn) vcard.push(`X-SOCIALPROFILE;TYPE=linkedin:${card.socials.lnkLinkedIn}`);
    if (card.socials.lnkTwitter) vcard.push(`X-SOCIALPROFILE;TYPE=twitter:${card.socials.lnkTwitter}`);
    if (card.socials.lnkWa) vcard.push(`X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${card.socials.lnkWa}`);
    if (card.socials.lnkFb) vcard.push(`X-SOCIALPROFILE;TYPE=facebook:${card.socials.lnkFb}`);
    if (card.socials.lnkInsta) vcard.push(`X-SOCIALPROFILE;TYPE=instagram:${card.socials.lnkInsta}`);

    vcard.push('END:VCARD');
    
    const blob = new Blob([vcard.join('\r\n')], { type: 'text/vcard;charset=utf-8;' });
    const filename = `${card.name.toLowerCase().replace(/\s+/g, '_')}.vcf`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy share link (with premium tick notification)
  const handleShareLink = () => {
    logClickAnalytics('share_link');
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  // Social brand colors helper
  const getSocialStyle = (key) => {
    const colors = {
      lnkLinkedIn: '#0a66c2',
      lnkTwitter: '#000000',
      lnkWa: '#25d366',
      lnkFb: '#1877f2',
      lnkInsta: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
    };
    return colors[key] || 'var(--accent-color)';
  };

  const getSocialName = (key) => {
    const names = {
      lnkLinkedIn: 'LinkedIn',
      lnkTwitter: 'Twitter / X',
      lnkWa: 'WhatsApp',
      lnkFb: 'Facebook',
      lnkInsta: 'Instagram'
    };
    return names[key] || 'Social Profile';
  };

  const getSocialIcon = (key) => {
    const icons = {
      lnkLinkedIn: 'fa-linkedin-in',
      lnkTwitter: 'fa-x-twitter',
      lnkWa: 'fa-whatsapp',
      lnkFb: 'fa-facebook-f',
      lnkInsta: 'fa-instagram'
    };
    return icons[key] || 'fa-globe';
  };

  const getAccentRgb = (hexColor) => {
    const hex = (hexColor || '#D3B20D').replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `${r}, ${g}, ${b}`;
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `${r}, ${g}, ${b}`;
    }
    return '211, 178, 13'; // Default fallback
  };

  if (loading) {
    return (
      <div className="skeleton-loader-container">
        <div className="skeleton-loader-card">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-text short"></div>
          <div className="skeleton-text long"></div>
          <div className="skeleton-text long"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notfound-container">
        <div className="notfound-card">
          <h2>404</h2>
          <h3>Profile Not Found</h3>
          <p>{error}</p>
          <button className="notfound-btn" onClick={onGoHome}>
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER DYNAMICAL PAYWALL IF EXPIRED ---
  if (card && card.expired) {
    const paywallAccentRgb = getAccentRgb(card.accent_color || '#D3B20D');
    return (
      <div 
        className="notfound-container"
        style={{
          '--accent-color': card.accent_color || '#D3B20D',
          '--accent-rgb': paywallAccentRgb
        }}
      >
        <div className="notfound-card renewal-card" style={{ maxWidth: '440px', padding: '2.5rem 2rem' }}>
          {renewalSuccess ? (
            <div className="renewal-success-layout" style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <CheckCircle size={60} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#fff' }}>Validity Extended!</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Your payment was approved successfully. Bringing your digital business card profile back online...
              </p>
            </div>
          ) : (
            <>
              <div style={{ color: '#f59e0b', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={48} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem', textAlign: 'center' }}>Validity Period Expired</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.825rem', lineHeight: '1.5', textAlign: 'center', marginBottom: '1.5rem' }}>
                The profile link <strong>/{card.slug}</strong> for <strong>{card.name}</strong> expired on {new Date(card.expiry_date).toLocaleDateString()}. Select a validity package to renew and reactivate the card.
              </p>

              <form onSubmit={handleRenewCard} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                
                {/* Plan selector */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Validity Plan</label>
                  <select 
                    value={selectedPlan} 
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    style={{ padding: '0.65rem', background: '#090d16', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="1_month">1 Month validity Extension - $1.99</option>
                    <option value="6_months">6 Months validity Extension - $8.99 (Save 25%)</option>
                    <option value="12_months">12 Months validity Extension - $14.99 (Save 37%)</option>
                  </select>
                </div>

                {/* Card input mockup */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credit Card Details</label>
                  <div className="input-icon-wrapper" style={{ marginBottom: '0.5rem' }}>
                    <CreditCard className="input-icon" size={16} style={{ color: '#475569' }} />
                    <input 
                      type="text" 
                      placeholder="4111 2222 3333 4444" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ''))}
                      maxLength="19"
                      style={{ paddingLeft: '2.75rem !important' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      maxLength="5"
                      style={{ flex: 1 }}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="CVC" 
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/[^\d]/g, ''))}
                      maxLength="3"
                      style={{ flex: 1 }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="invite-client-btn" 
                  disabled={renewing}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  {renewing ? 'Processing Transaction...' : 'Pay & Reactivate Profile'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  const hasAnySocial = Object.values(card.socials).some(Boolean);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(window.location.href)}`;

  const accentRgb = getAccentRgb(card.accent_color || '#D3B20D');

  return (
    <div 
      className={`public-card-viewer theme-${card.theme} tab-${activeTab}`}
      style={{
        '--accent-color': card.accent_color || '#D3B20D',
        '--accent-rgb': accentRgb
      }}
    >
      <div className="ambient-glow"></div>

      {/* TOP STICKY HEADER (Shrinks on other tabs) */}
      <header 
        className={`card-sticky-header ${activeTab !== 'home' ? 'shrink' : ''}`}
        onClick={() => setActiveTab('home')}
        style={{ cursor: 'pointer' }}
      >
        <div className="header-avatar-container">
          <img src={card.avatar_url || DEFAULT_AVATAR} alt={card.name} />
        </div>
        <div className="header-user-info">
          <h2>{card.name}</h2>
          <p className="job">{card.job_title}</p>
          <p className="comp">{card.company}</p>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <main className="card-viewer-body">
        
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="viewer-tab-content tab-home-view">
            
            {/* Tilting card */}
            <div className="vcard-card-perspective">
              <div 
                className="vcard-card" 
                onMouseMove={handleMouseMove} 
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
                  backgroundImage: tilt.backgroundImage || 'none',
                  transition: tilt.rotateX === 0 ? 'transform 0.5s ease' : 'none'
                }}
              >
                <div className="card-inner">
                  <div className="card-glow-outline"></div>
                  
                  <div className="card-header-embedded">
                    <h3>vCard<span>z</span></h3>
                    <p>Digital Business Card</p>
                  </div>

                  <div className="card-divider"></div>

                  <div className="card-avatar-embedded">
                    <img src={card.avatar_url || DEFAULT_AVATAR} alt={card.name} />
                  </div>

                  <div className="card-profile-summary">
                    <p className="card-summary-name">{card.name}</p>
                    <p className="card-summary-title">{card.job_title} at {card.company || 'Freelance'}</p>
                  </div>

                  {card.bio && (
                    <div className="card-bio-wrap">
                      <p>{card.bio}</p>
                    </div>
                  )}

                  {/* Actions summary */}
                  <div className="card-quick-actions">
                    {card.phone && (
                      <a 
                        href={`tel:${card.phone.replace(/\s+/g, '')}`} 
                        className="action-btn"
                        onClick={() => logClickAnalytics('click_phone', card.phone)}
                      >
                        <Phone size={18} />
                        <span>Call</span>
                      </a>
                    )}
                    {card.email && (
                      <a 
                        href={`mailto:${card.email}`} 
                        className="action-btn"
                        onClick={() => logClickAnalytics('click_email', card.email)}
                      >
                        <Mail size={18} />
                        <span>Email</span>
                      </a>
                    )}
                    {card.gmap && (
                      <a 
                        href={card.gmap} 
                        target="_blank" 
                        rel="noreferrer"
                        className="action-btn"
                        onClick={() => logClickAnalytics('click_map', card.gmap)}
                      >
                        <MapPin size={18} />
                        <span>G Map</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Public Utility bar */}
            <div className="vcard-utilities">
              <button className={`util-btn ${copiedShare ? 'copied-success' : ''}`} onClick={handleShareLink}>
                {copiedShare ? (
                  <>
                    <CheckCircle size={16} style={{ color: '#34d399' }} />
                    <span style={{ color: '#34d399' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Share Link</span>
                  </>
                )}
              </button>
              <button className="util-btn" onClick={() => { setQrOpen(true); logClickAnalytics('view_qr'); }}>
                <QrCode size={16} />
                <span>My QR</span>
              </button>
              <button className="util-btn primary-util-btn" onClick={handleSaveContact}>
                <UserPlus size={16} />
                <span>Save Contact</span>
              </button>
            </div>

          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && card.services && card.services.trim() && (
          <div className="viewer-tab-content tab-services-view">
            <div className="services-card">
              <h3>Our Services</h3>
              <ul className="services-list">
                {card.services
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((service, idx) => (
                    <li key={idx} className="service-item">
                      <span className="service-icon">•</span>
                      <span className="service-text">{service}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="viewer-tab-content tab-contacts-view">
            <h3 className="section-title">Contact & Social Channels</h3>
            
            <div className="contacts-list-wrapper">
              
              {/* Phone */}
              {card.phone && (
                <div className="contact-item">
                  <a 
                    href={`tel:${card.phone.replace(/\s+/g, '')}`}
                    className="contact-item-icon"
                    style={{ textDecoration: 'none' }}
                    onClick={() => logClickAnalytics('click_phone', card.phone)}
                  >
                    <Phone size={18} />
                  </a>
                  <div className="contact-item-details">
                    <span className="label">Call Mobile</span>
                    <a 
                      href={`tel:${card.phone.replace(/\s+/g, '')}`} 
                      className="value"
                      onClick={() => logClickAnalytics('click_phone', card.phone)}
                    >
                      {card.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Email */}
              {card.email && (
                <div className="contact-item">
                  <a 
                    href={`mailto:${card.email}`}
                    className="contact-item-icon"
                    style={{ textDecoration: 'none' }}
                    onClick={() => logClickAnalytics('click_email', card.email)}
                  >
                    <Mail size={18} />
                  </a>
                  <div className="contact-item-details">
                    <span className="label">Send Email</span>
                    <a 
                      href={`mailto:${card.email}`} 
                      className="value"
                      onClick={() => logClickAnalytics('click_email', card.email)}
                    >
                      {card.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Maps */}
              {card.gmap && (
                <div className="contact-item">
                  <a 
                    href={card.gmap}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-item-icon"
                    style={{ textDecoration: 'none' }}
                    onClick={() => logClickAnalytics('click_map', card.gmap)}
                  >
                    <MapPin size={18} />
                  </a>
                  <div className="contact-item-details">
                    <span className="label">Visit Office</span>
                    <a 
                      href={card.gmap} 
                      target="_blank" 
                      rel="noreferrer"
                      className="value"
                      onClick={() => logClickAnalytics('click_map', card.gmap)}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}

              {/* Social Channels list (authentic colors in a single row) */}
              {hasAnySocial && (
                <div className="social-contacts-list">
                  <h4>Social Profiles</h4>
                  <div className="social-icons-row-wrapper" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {Object.entries(card.socials).map(([key, val]) => {
                      if (!val) return null;
                      const isInsta = key === 'lnkInsta';
                      const linkUrl = key === 'lnkWa' ? `https://wa.me/${val.replace(/[^\d]/g, '')}` : val;
                      
                      return (
                        <a 
                          key={key} 
                          href={linkUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="social-icon-circle-btn"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            background: isInsta ? getSocialStyle(key) : 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: isInsta ? '#fff' : getSocialStyle(key),
                            transition: 'all 0.2s',
                            flexShrink: 0
                          }}
                          onClick={() => logClickAnalytics('click_social', key)}
                        >
                          <i className={`fa-brands ${getSocialIcon(key)}`}></i>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ABOUT US TAB */}
        {activeTab === 'about' && (
          <div className="viewer-tab-content tab-about-view">
            <h3 className="section-title">About Me</h3>
            
            <div className="about-card-wrapper">
              <div className="about-bio-card">
                <p className="about-bio-text">{card.about_us || 'No about us details provided.'}</p>
              </div>

              {card.company && (
                <div className="about-info-row">
                  <div className="info-icon"><Building2 size={18} /></div>
                  <div className="info-details">
                    <span className="lbl">Company / Studio</span>
                    <span className="val">{card.company}</span>
                  </div>
                </div>
              )}

              <div className="about-info-row">
                <div className="info-icon"><Calendar size={18} /></div>
                <div className="info-details">
                  <span className="lbl">Card Active Since</span>
                  <span className="val">{new Date(card.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* BOTTOM STICKY NAVIGATION TAB BAR */}
      <nav className="bottom-nav">
        <button 
          className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Home size={20} />
          <span>Home</span>
        </button>
        {card.services && card.services.trim() && (
          <button 
            className={`nav-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <Briefcase size={20} />
            <span>Services</span>
          </button>
        )}
        <button 
          className={`nav-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <Phone size={20} />
          <span>Contacts</span>
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <Info size={20} />
          <span>About Us</span>
        </button>
      </nav>

      {/* MY QR CODE MODAL OVERLAY */}
      {qrOpen && (
        <div className="qr-modal-overlay active" onClick={() => setQrOpen(false)}>
          <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setQrOpen(false)}>
              <X size={18} />
            </button>
            <h3>My QR Code</h3>
            <p>Scan this QR code with another mobile phone to open and save this visiting card directly.</p>
            
            <div className="qr-code-container">
              <img src={qrCodeUrl} alt="Card QR Code" />
            </div>
            
            <div className="qr-actions">
              <button 
                className={`qr-copy-btn ${copiedQr ? 'copied-success' : ''}`} 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedQr(true);
                  setTimeout(() => setCopiedQr(false), 2000);
                }}
              >
                {copiedQr ? (
                  <>
                    <CheckCircle size={16} style={{ color: '#34d399' }} /> Copied Link!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy URL Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
