import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Palette, User, Image, Plus, Phone, Share2, 
  Eye, Save, X, Sparkles, MapPin, Mail, Globe, Calendar 
} from 'lucide-react';

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='100%25' height='100%25' fill='%230f172a'/><circle cx='12' cy='8' r='4' fill='%23475569'/><path d='M4 20c0-3.3 3.3-6 8-6s8 2.7 8 6' fill='%23475569'/></svg>";

export default function CardEditor({ card, token, onClose }) {
  const isNew = !card;
  
  // Card settings state
  const [slug, setSlug] = useState(card?.slug || '');
  const [name, setName] = useState(card?.name || '');
  const [jobTitle, setJobTitle] = useState(card?.job_title || '');
  const [company, setCompany] = useState(card?.company || '');
  const [bio, setBio] = useState(card?.bio || '');
  const [services, setServices] = useState(card?.services || '');
  const [phone, setPhone] = useState(card?.phone || '');
  const [email, setEmail] = useState(card?.email || '');
  const [gmap, setGmap] = useState(card?.gmap || '');
  const [theme, setTheme] = useState(card?.theme || 'aura-glass');
  const [accentColor, setAccentColor] = useState(card?.accent_color || '#D3B20D');
  const [avatarUrl, setAvatarUrl] = useState(card?.avatar_url || '');
  const [socials, setSocials] = useState(card?.socials || {
    lnkLinkedIn: '',
    lnkTwitter: '',
    lnkWa: '',
    lnkFb: '',
    lnkInsta: ''
  });

  const [expiryDate, setExpiryDate] = useState(() => {
    if (card?.expiry_date) {
      return card.expiry_date.substring(0, 10);
    }
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().substring(0, 10);
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // UI state for overlay previews
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null); // null, 'available', 'taken', 'invalid'

  // Date input ref to trigger calendar picker dialog on wrapper click
  const dateInputRef = useRef(null);

  const handleWrapperClick = (e) => {
    if (e.target !== dateInputRef.current && dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch (error) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  // Debounced/Realtime slug check
  const checkSlugAvailability = async (val) => {
    const cleanVal = val.toLowerCase().trim();
    if (!cleanVal) {
      setSlugStatus(null);
      return;
    }
    
    const slugRegex = /^[a-zA-Z0-9-_]+$/;
    if (!slugRegex.test(cleanVal)) {
      setSlugStatus('invalid');
      return;
    }
    
    setSlugChecking(true);
    try {
      const response = await fetch(`/api/public/cards/${cleanVal}`);
      if (response.status === 404) {
        setSlugStatus('available');
      } else {
        setSlugStatus('taken');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSlugChecking(false);
    }
  };

  // Handle name updates and auto slug suggestion
  const handleNameChange = (val) => {
    setName(val);
    if (isNew && !isSlugManual) {
      const baseSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (baseSlug) {
        const defaultSuggested = `${baseSlug}-pro`;
        setSlug(defaultSuggested);
        checkSlugAvailability(defaultSuggested);
      } else {
        setSlug('');
        setSlugStatus(null);
      }
    }
  };

  // Handle custom photo upload
  const handleCustomAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Photo is too large. Preset avatars or compressed files (< 1.5MB) are recommended.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Social input changes
  const handleSocialChange = (key, value) => {
    setSocials({
      ...socials,
      [key]: value
    });
  };

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    if (!slug || !name) {
      setError('Slug and Name are required');
      setSaving(false);
      return;
    }

    const payload = {
      slug: slug.toLowerCase().trim(),
      name,
      job_title: jobTitle,
      company,
      bio,
      phone,
      email,
      gmap,
      theme,
      accent_color: accentColor,
      avatar_url: avatarUrl,
      socials,
      services,
      expiry_date: new Date(expiryDate).toISOString()
    };

    const endpoint = isNew ? '/api/cards' : `/api/cards/${card.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save card');
      }

      onClose(true); // Close editor and refresh list
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Social authentic colors mapping helper
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

  // Hex to RGB parser helper for dynamic localized custom properties
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

  const accentRgb = getAccentRgb(accentColor);

  return (
    <div 
      className="editor-modal-overlay" 
      style={{
        '--accent-color': accentColor,
        '--accent-rgb': accentRgb
      }}
    >
      <div className="editor-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="editor-modal-header">
          <div>
            <h2>{isNew ? 'Create Digital Card' : 'Edit Digital Card'}</h2>
            <p>Customize themes, upload photo, and fill details.</p>
          </div>
          <button className="editor-modal-close-btn" onClick={() => onClose(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body Container */}
        <div className="editor-modal-body">
          {error && <div className="editor-error-banner">{error}</div>}

          <form id="card-editor-form" onSubmit={handleSave} className="customizer-form">
            
            {/* Section 0: Core Profile Information */}
            <div className="form-section">
              <h3><User size={16} /> Core Information</h3>
              
              {/* Row 1: Full Name & Custom Profile Slug */}
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => handleNameChange(e.target.value)} 
                    placeholder="Sarah Jenkins"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label style={{ whiteSpace: 'nowrap' }}>Profile Slug (domain.com/slug)</label>
                  <div className="slug-flex-row">
                    <div className="slug-input-wrapper" style={{ flex: 1 }}>
                      <span className="slug-prefix">/</span>
                      <input 
                        type="text" 
                        value={slug} 
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setIsSlugManual(true);
                          checkSlugAvailability(e.target.value);
                        }} 
                        placeholder="e.g. john-doe"
                        disabled={!isNew}
                        required 
                      />
                    </div>
                    {isNew && (
                      <button
                        type="button"
                        onClick={() => {
                          const baseSlug = name
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');
                          if (baseSlug) {
                            const styles = [
                              `${baseSlug}-pro`,
                              `${baseSlug}-vip`,
                              `${baseSlug}-card`,
                              `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`
                            ];
                            const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                            setSlug(randomStyle);
                            setIsSlugManual(true);
                            checkSlugAvailability(randomStyle);
                          } else {
                            alert('Please enter a name first to generate a slug.');
                          }
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: '#fff',
                          padding: '0 0.75rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Suggest Style
                      </button>
                    )}
                  </div>

                  {isNew && slug && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      {slugChecking ? (
                        <span style={{ color: '#94a3b8' }}>Checking availability...</span>
                      ) : slugStatus === 'available' ? (
                        <span style={{ color: '#34d399' }}>✓ Slug is unique and available!</span>
                      ) : slugStatus === 'taken' ? (
                        <span style={{ color: '#f87171' }}>✗ Slug already in use. Try another or click "Suggest Style"!</span>
                      ) : slugStatus === 'invalid' ? (
                        <span style={{ color: '#f87171' }}>✗ Slug contains invalid characters. Use letters, numbers, hyphens, and underscores only.</span>
                      ) : null}
                    </div>
                  )}
                  <p className="help-text">Letters, numbers, hyphens, underscores.</p>
                </div>
              </div>

              {/* Row 2: Phone Number & Email Address (moved from Quick Actions) */}
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="sarah@aetherstudio.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 1: Professional Details */}
            <div className="form-section">
              <h3><User size={16} /> Professional Details</h3>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Professional Title</label>
                  <input 
                    type="text" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                    placeholder="Creative Director"
                  />
                </div>
                <div className="form-group">
                  <label>Office / Company Name</label>
                  <input 
                    type="text" 
                    value={company} 
                    onChange={(e) => setCompany(e.target.value)} 
                    placeholder="Aether Studio"
                  />
                </div>
              </div>
              <div className="form-group full-width">
                <label>Bio / Description</label>
                <textarea 
                  rows="2"
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Briefly describe your services or profile..."
                />
              </div>
              <div className="form-group full-width">
                <label>Services (One per line)</label>
                <textarea 
                  rows="4"
                  value={services} 
                  onChange={(e) => setServices(e.target.value)} 
                  placeholder="Enter services offered, one per line..."
                />
              </div>
            </div>

            {/* Section 2: Validity & Profile Photo (moved to before Theme and Color) */}
            <div className="form-section">
              <h3><Calendar size={16} /> Validity & Profile Photo</h3>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Validity Expiry Date</label>
                  <div className="modern-date-input-wrapper" onClick={handleWrapperClick}>
                    <Calendar size={16} style={{ color: 'var(--accent-color)', marginLeft: '0.75rem', marginRight: '0.25rem', pointerEvents: 'none' }} />
                    <input 
                      ref={dateInputRef}
                      type="date" 
                      value={expiryDate} 
                      onChange={(e) => setExpiryDate(e.target.value)} 
                      required 
                    />
                  </div>
                  <p className="help-text">Digital card will expire after this date.</p>
                </div>

                <div className="form-group">
                  <label>Upload Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                    <div className="current-avatar-preview" style={{
                      width: '45px',
                      height: '45px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid var(--accent-color)',
                      background: 'rgba(0,0,0,0.2)',
                      flexShrink: 0
                    }}>
                      <img 
                        src={avatarUrl || DEFAULT_AVATAR} 
                        alt="Avatar Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <label className="upload-custom-avatar-btn" style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '0.5rem 1rem',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCustomAvatar}
                        style={{ display: 'none' }} 
                      />
                      Choose File
                    </label>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>Square format recommended.</p>
                </div>
              </div>
            </div>

            {/* Section 3: Template & Appearance */}
            <div className="form-section">
              <h3><Palette size={16} /> Design & Theme</h3>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Card Style Theme</label>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    <option value="aura-glass">Aura Glass (Glassmorphism)</option>
                    <option value="sunset-breeze">Sunset Breeze (Warm Minimalist)</option>
                    <option value="matrix-cyber">Matrix Cyber (Futuristic)</option>
                    <option value="neo-slate">Neo-Slate (Soft UI / Neomorphic)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Accent Glow Color</label>
                  <div className="color-picker-wrapper">
                    <input 
                      type="color" 
                      value={accentColor} 
                      onChange={(e) => setAccentColor(e.target.value)} 
                      disabled={theme === 'matrix-cyber'}
                    />
                    <span className="color-value">{accentColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Social Profiles */}
            <div className="form-section">
              <h3><Share2 size={16} /> Social Profiles</h3>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>
                    <i className="fa-brands fa-linkedin-in" style={{ color: '#0a66c2', marginRight: '0.4rem' }}></i> LinkedIn
                  </label>
                  <input 
                    type="url" 
                    value={socials.lnkLinkedIn || ''} 
                    onChange={(e) => handleSocialChange('lnkLinkedIn', e.target.value)} 
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fa-brands fa-x-twitter" style={{ color: '#fff', marginRight: '0.4rem' }}></i> X
                  </label>
                  <input 
                    type="url" 
                    value={socials.lnkTwitter || ''} 
                    onChange={(e) => handleSocialChange('lnkTwitter', e.target.value)} 
                    placeholder="https://x.com/..."
                  />
                </div>
              </div>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>
                    <i className="fa-brands fa-facebook-f" style={{ color: '#1877f2', marginRight: '0.4rem' }}></i> Facebook
                  </label>
                  <input 
                    type="url" 
                    value={socials.lnkFb || ''} 
                    onChange={(e) => handleSocialChange('lnkFb', e.target.value)} 
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fa-brands fa-instagram" style={{ color: '#e1306c', marginRight: '0.4rem' }}></i> Instagram
                  </label>
                  <input 
                    type="url" 
                    value={socials.lnkInsta || ''} 
                    onChange={(e) => handleSocialChange('lnkInsta', e.target.value)} 
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
              <div className="form-row-grid">
                <div className="form-group">
                  <label>
                    <i className="fa-brands fa-whatsapp" style={{ color: '#25d366', marginRight: '0.4rem' }}></i> WhatsApp
                  </label>
                  <input 
                    type="text" 
                    value={socials.lnkWa || ''} 
                    onChange={(e) => handleSocialChange('lnkWa', e.target.value)} 
                    placeholder="Country code + number"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fa-solid fa-map-pin" style={{ color: '#ea4335', marginRight: '0.4rem' }}></i> Google
                  </label>
                  <input 
                    type="url" 
                    value={gmap} 
                    onChange={(e) => setGmap(e.target.value)} 
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer (Cancel / Save) */}
        <div className="editor-modal-footer">
          <button type="button" className="cancel-editor-btn" onClick={() => onClose(false)}>
            Cancel
          </button>
          <button type="submit" form="card-editor-form" className="save-editor-btn" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Visiting Card'}
          </button>
        </div>

      </div>
    </div>
  );
}
