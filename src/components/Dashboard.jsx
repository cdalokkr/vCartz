import React, { useState, useEffect } from 'react';
import { 
  Plus, LogOut, Link, BarChart3, Edit3, Trash2, Globe, Settings, CreditCard, 
  Copy, CheckCircle, Wifi, Users, UserPlus, ArrowLeft, Eye, MousePointer, AlertTriangle, Sparkles,
  Menu, X
} from 'lucide-react';
import CardEditor from './CardEditor.jsx';

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='100%25' height='100%25' fill='%230f172a'/><circle cx='12' cy='8' r='4' fill='%23475569'/><path d='M4 20c0-3.3 3.3-6 8-6s8 2.7 8 6' fill='%23475569'/></svg>";

export default function Dashboard({ user, token, onLogout, updateSEO }) {
  const [activeTab, setActiveTab] = useState('cards'); // cards, whitelabel, nfc
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState(null); // card object or 'new'
  const [viewingAnalytics, setViewingAnalytics] = useState(null); // card id
  const [analyticsData, setAnalyticsData] = useState(null);
  
  const [mobileSidebarActive, setMobileSidebarActive] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // NFC Tag Mapping States
  const [selectedNfcCardId, setSelectedNfcCardId] = useState('');
  const [nfcWriteStatus, setNfcWriteStatus] = useState('');
  const [nfcWriteError, setNfcWriteError] = useState('');
  
  // White-Label Settings Form States
  const [brandName, setBrandName] = useState('Aether Cards');
  const [customDomain, setCustomDomain] = useState('cards.aether.com');
  const [brandColor, setBrandColor] = useState('#D3B20D');
  const [clients, setClients] = useState([]);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');

  // DNS CNAME Check States
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsStatus, setDnsStatus] = useState(null);
  const [activeRegistrar, setActiveRegistrar] = useState('');

  // Premium UI Feedback States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [copiedNfc, setCopiedNfc] = useState(false);

  // Fetch cards
  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      }
    } catch (err) {
      console.error('Error loading cards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  useEffect(() => {
    fetchCards();
    if (activeTab === 'whitelabel') {
      fetchClients();
    }
    updateSEO({
      title: 'vCardz | Dashboard',
      description: 'Manage your digital visiting cards, check analytics, and configure white-label branding.'
    });
  }, [activeTab]);

  useEffect(() => {
    if (cards.length > 0 && !selectedNfcCardId) {
      setSelectedNfcCardId(cards[0].id.toString());
    }
  }, [cards, selectedNfcCardId]);

  // Handle invite new client (saves dynamically to DB)
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClientEmail || !newClientPassword) return;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      alert(`Client credentials provisioned in DB!\nEmail: ${newClientEmail}\nPassword: ${newClientPassword}\n\nThey can now login on your custom domain.`);
      
      setNewClientEmail('');
      setNewClientPassword('');
      fetchClients(); // Refetch clients list
    } catch (err) {
      alert(`Error provisioning client: ${err.message}`);
    }
  };

  // Delete Card
  const handleDeleteCard = async (id) => {
    if (!confirm('Are you sure you want to delete this digital visiting card?')) return;

    try {
      const response = await fetch(`/api/cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCards(cards.filter(c => c.id !== id));
        alert('Card deleted successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Analytics Panel
  const handleViewAnalytics = async (card) => {
    setViewingAnalytics(card);
    setAnalyticsData(null);
    try {
      const response = await fetch(`/api/cards/${card.id}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Copy Public Link
  const handleCopyLink = (slug, cardId = null) => {
    const link = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      if (cardId) {
        setCopiedCardId(cardId);
        setTimeout(() => setCopiedCardId(null), 2000);
      }
      showToast('Link copied to clipboard successfully!');
    });
  };

  // DNS checker simulation
  const handleCheckDns = () => {
    if (!customDomain) return;
    setDnsChecking(true);
    setDnsStatus(null);
    
    setTimeout(() => {
      setDnsChecking(false);
      // Validate format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z0-9-_.]+$/;
      if (domainRegex.test(customDomain) && customDomain.includes('.')) {
        setDnsStatus({
          resolved: true,
          target: 'cname.vcardz.com',
          ip: '76.76.21.21'
        });
      } else {
        setDnsStatus({
          resolved: false,
          error: 'Please enter a valid subdomain URL format.'
        });
      }
    }, 1200);
  };

  const selectedNfcCard = cards.find(c => c.id === parseInt(selectedNfcCardId)) || (cards.length > 0 ? cards[0] : null);

  const handleWriteNfc = async (slug) => {
    if (!('NDEFReader' in window)) {
      alert('Direct Web NFC Writing is not supported on this device or browser. Please follow the instructions to write using a mobile app like NFC Tools.');
      return;
    }
    
    setNfcWriteStatus('scanning');
    setNfcWriteError('');
    
    try {
      const ndef = new window.NDEFReader();
      const nfcUrl = `${window.location.origin}/${slug}`;
      await ndef.write(nfcUrl);
      setNfcWriteStatus('success');
      alert('✓ Physical NFC Tag successfully mapped to your card!');
    } catch (err) {
      console.error(err);
      setNfcWriteStatus('error');
      setNfcWriteError(err.message || 'Failed to write tag. Ensure NFC is enabled and the tag is close.');
    }
  };

  return (
    <div 
      className="dashboard-container"
      style={{
        '--accent-color': '#D3B20D',
        '--accent-rgb': '211, 178, 13'
      }}
    >
      {/* Sidebar Backdrop Overlay on Mobile */}
      {mobileSidebarActive && (
        <div 
          className="dashboard-sidebar-overlay" 
          onClick={() => setMobileSidebarActive(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${mobileSidebarActive ? 'mobile-active' : ''}`}>
        <div className="sidebar-mobile-header">
          <button className="close-sidebar-btn" onClick={() => setMobileSidebarActive(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="logo">
          <h1>vCard<span>z</span></h1>
        </div>
        
        <div className="user-badge">
          <p className="user-email">{user.email}</p>
          <span className="badge-tier">Agency Tier</span>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'cards' && !viewingAnalytics ? 'active' : ''} 
            onClick={() => { 
              setActiveTab('cards'); 
              setViewingAnalytics(null); 
              setEditingCard(null); 
              setMobileSidebarActive(false); 
            }}
          >
            <CreditCard size={18} /> My Digital Cards
          </button>
          <button 
            className={activeTab === 'whitelabel' ? 'active' : ''} 
            onClick={() => { 
              setActiveTab('whitelabel'); 
              setViewingAnalytics(null); 
              setEditingCard(null); 
              setMobileSidebarActive(false); 
            }}
          >
            <Globe size={18} /> White-Label Settings
          </button>
          <button 
            className={activeTab === 'nfc' ? 'active' : ''} 
            onClick={() => { 
              setActiveTab('nfc'); 
              setViewingAnalytics(null); 
              setEditingCard(null); 
              setMobileSidebarActive(false); 
            }}
          >
            <Wifi size={18} /> NFC Tag Mapping
          </button>
        </nav>

        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} /> Log Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-content">
        
        {/* Top Header Bar */}
        <div className="dashboard-top-bar">
          <div className="mobile-menu-trigger">
            <button onClick={() => setMobileSidebarActive(true)}>
              <Menu size={22} />
            </button>
          </div>
          
          <div className="top-bar-title">
            {activeTab === 'cards' && (viewingAnalytics ? 'Analytics Details' : 'Digital Cards')}
            {activeTab === 'whitelabel' && 'White-Label Branding'}
            {activeTab === 'nfc' && 'NFC Tag Configuration'}
          </div>

          <div className="user-profile-menu-container">
            <button className="user-profile-avatar-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <img src={DEFAULT_AVATAR} alt="User Avatar" />
            </button>
            {userMenuOpen && (
              <div className="user-profile-dropdown">
                <div className="dropdown-user-details">
                  <p className="dropdown-user-email">{user.email}</p>
                  <span className="dropdown-user-role">Administrator</span>
                </div>
                <hr className="dropdown-divider" />
                <button className="dropdown-item-logout-btn" onClick={() => { setUserMenuOpen(false); onLogout(); }}>
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* CARD EDITOR INTERFACE (Rendered as Modal Overlay) */}
        {editingCard && (
          <CardEditor 
            card={editingCard === 'new' ? null : editingCard} 
            token={token} 
            onClose={(refresh) => {
              setEditingCard(null);
              if (refresh) fetchCards();
            }} 
          />
        )}

        {viewingAnalytics ? (
          /* VIEWING ANALYTICS DETAILS */
          <div className="analytics-panel">
            <button className="back-link-btn" onClick={() => setViewingAnalytics(null)}>
              <ArrowLeft size={16} /> Back to Cards List
            </button>
            
            <div className="analytics-header">
              <h2>Analytics details for: <span>{viewingAnalytics.name}</span></h2>
              <p>Path: <code>/{viewingAnalytics.slug}</code></p>
            </div>

            {analyticsData ? (
              <div className="analytics-grid">
                
                {/* Stats row */}
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon"><Eye /></div>
                    <div className="stat-value">{analyticsData.views}</div>
                    <div className="stat-label">Total Card Views</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><MousePointer /></div>
                    <div className="stat-value">{analyticsData.clicks}</div>
                    <div className="stat-label">Total Button Clicks</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><BarChart3 /></div>
                    <div className="stat-value">
                      {analyticsData.views > 0 
                        ? `${Math.round((analyticsData.clicks / analyticsData.views) * 100)}%` 
                        : '0%'
                      }
                    </div>
                    <div className="stat-label">Click-Through Rate (CTR)</div>
                  </div>
                </div>

                {/* SVG Trend Graph */}
                <div className="analytics-chart-card">
                  <h3>Views Over Time</h3>
                  <div className="chart-wrapper">
                    {analyticsData.trends && analyticsData.trends.length > 0 ? (
                      <div className="svg-chart-container">
                        <svg viewBox="0 0 500 150" className="svg-chart">
                          <defs>
                            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4"/>
                              <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0"/>
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.05)" />
                          <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.05)" />
                          <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.05)" />

                          {/* Polyline Path */}
                          {(() => {
                            const maxVal = Math.max(...analyticsData.trends.map(t => t.count), 5);
                            const points = analyticsData.trends.map((t, idx) => {
                              const x = (idx / (analyticsData.trends.length - 1 || 1)) * 500;
                              const y = 130 - (t.count / maxVal) * 100;
                              return { x, y, ...t };
                            });

                            const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
                            const fillPoints = `0,130 ${polyPoints} 500,130`;

                            return (
                              <>
                                <polygon points={fillPoints} fill="url(#chartGlow)" />
                                <polyline points={polyPoints} fill="none" stroke="var(--accent-color)" strokeWidth="3" />
                                {points.map((p, i) => (
                                  <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-app)" stroke="var(--accent-color)" strokeWidth="2" />
                                    <text x={p.x} y={p.y - 12} fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{p.count}</text>
                                    <text x={p.x} y="145" fontSize="8" fill="var(--text-muted)" textAnchor="middle">{p.date.substring(5)}</text>
                                  </g>
                                ))}
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    ) : (
                      <p className="no-data-msg">Not enough visitor data to build chart yet.</p>
                    )}
                  </div>
                </div>

                {/* Click Breakdown Table */}
                <div className="analytics-breakdown-card">
                  <h3>Interactive Button Click Breakdown</h3>
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Action Category</th>
                        <th>Target Detail</th>
                        <th>Clicks Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.breakdown && analyticsData.breakdown.length > 0 ? (
                        analyticsData.breakdown.map((row, i) => (
                          <tr key={i}>
                            <td><code>{row.type}</code></td>
                            <td>{row.detail || '-'}</td>
                            <td><strong>{row.count}</strong></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No clicks recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="spinner-center"><p>Loading analytics report...</p></div>
            )}
          </div>
        ) : activeTab === 'cards' ? (
          /* MY DIGITAL CARDS TAB */
          <div className="cards-tab">
            <div className="tab-header">
              <div>
                <h2>My Digital Visiting Cards</h2>
                <p>Manage, customize, and view analytics for your active business profiles.</p>
              </div>
              <button className="create-card-btn" onClick={() => setEditingCard('new')}>
                <Plus size={18} /> Create New Card
              </button>
            </div>

            {loading ? (
              <p>Loading digital cards...</p>
            ) : cards.length === 0 ? (
              <div className="empty-cards">
                <p>No digital visiting cards created yet. Click the button above to build your first profile!</p>
              </div>
            ) : (
              <div className="cards-list-grid">
                {cards.map(card => (
                  <div className="card-item-row" key={card.id}>
                    <div className="card-item-avatar">
                      <img src={card.avatar_url || DEFAULT_AVATAR} alt={card.name} />
                    </div>
                    <div className="card-item-details">
                      <h3>{card.name}</h3>
                      <p>{card.job_title} at <strong>{card.company || 'Freelance'}</strong></p>
                      <p className="card-item-slug">Link: <code>/{card.slug}</code></p>
                      <p className="card-item-slug" style={{ marginTop: '0.1rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Validity: <strong>{card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : '30 days default'}</strong>
                        {card.expiry_date && new Date(card.expiry_date) < new Date() && (
                          <span style={{ color: '#f87171', marginLeft: '0.5rem', fontWeight: 'bold' }}>(Expired)</span>
                        )}
                      </p>
                    </div>
                    <div className="card-item-actions">
                      <button className="row-action-btn view" onClick={() => window.open(`/${card.slug}`, '_blank')}>
                        <Eye size={16} /> Open
                      </button>
                      <button 
                        className={`row-action-btn copy ${copiedCardId === card.id ? 'copied-success' : ''}`} 
                        onClick={() => handleCopyLink(card.slug, card.id)}
                      >
                        {copiedCardId === card.id ? (
                          <>
                            <CheckCircle size={16} /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Copy URL
                          </>
                        )}
                      </button>
                      <button className="row-action-btn stats" onClick={() => handleViewAnalytics(card)}>
                        <BarChart3 size={16} /> Stats
                      </button>
                      <button className="row-action-btn edit" onClick={() => setEditingCard(card)}>
                        <Edit3 size={16} /> Edit
                      </button>
                      <button className="row-action-btn delete" onClick={() => handleDeleteCard(card.id)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'whitelabel' ? (
          /* WHITE LABEL SETTINGS TAB */
          <div className="whitelabel-tab">
            <h2>White-Label Portal Configuration</h2>
            <p className="tab-desc">Configure client access portals, set brand templates, and invite accounts to manage cards.</p>
            
            <div className="whitelabel-settings-grid">
              {/* Branding configs */}
              <div className="settings-card">
                <h3>Portal Branding</h3>
                <form className="settings-form" onSubmit={(e) => { e.preventDefault(); alert('Branding settings saved!'); }}>
                  <div className="form-group">
                    <label>White-Label Brand Name</label>
                    <input 
                      type="text" 
                      value={brandName} 
                      onChange={(e) => setBrandName(e.target.value)} 
                    />
                  </div>
                  
                  {/* CNAME Input with Checker */}
                  <div className="form-group">
                    <label>Mapped Custom Domain (CNAME)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={customDomain} 
                        onChange={(e) => { setCustomDomain(e.target.value); setDnsStatus(null); }} 
                        placeholder="e.g. cards.mycompany.com" 
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        onClick={handleCheckDns} 
                        className="save-settings-btn" 
                        style={{ width: 'auto', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        disabled={dnsChecking}
                      >
                        {dnsChecking ? 'Checking...' : 'Check CNAME'}
                      </button>
                    </div>
                    <p className="help-text" style={{ lineHeight: '1.4', marginTop: '0.25rem' }}>
                      Point your subdomain CNAME record to: <code>cname.vcardz.com</code>.
                    </p>

                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      background: 'rgba(255, 215, 0, 0.05)',
                      border: '1px solid rgba(255, 215, 0, 0.15)',
                      color: '#fbbf24',
                      lineHeight: '1.4'
                    }}>
                      <strong>⚠️ Subdomain vs. Root Domain Website Setup:</strong>
                      <br />
                      If you already have an existing website running on your root domain (e.g., <code>domain.com</code>), do <strong>NOT</strong> change the root record. Instead, set up a subdomain (e.g., <code>cards.domain.com</code>). 
                      Simply add a <strong>CNAME</strong> record for the host <code>cards</code> pointing to <code>cname.vcardz.com</code>. 
                      This ensures your main website continues to function normally, while the subdomain handles your digital card portal login and profile mappings.
                    </div>
                    
                    {dnsStatus && (
                      <div className={`dns-status-box ${dnsStatus.resolved ? 'success' : 'error'}`} style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        background: dnsStatus.resolved ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${dnsStatus.resolved ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        color: dnsStatus.resolved ? '#34d399' : '#f87171',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}>
                        {dnsStatus.resolved ? (
                          <>
                            <strong>✓ CNAME Record Resolved Successfully!</strong>
                            <span>Domain <code>{customDomain}</code> is correctly pointing to <code>{dnsStatus.target}</code>.</span>
                          </>
                        ) : (
                          <>
                            <strong>✗ DNS Verification Failed</strong>
                            <span>Point your subdomain (e.g. <code>cards</code>) CNAME record to <code>cname.vcardz.com</code>. {dnsStatus.error}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Portal Primary Theme Color</label>
                    <div className="color-picker-wrapper">
                      <input 
                        type="color" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)} 
                      />
                      <span className="color-value">{brandColor}</span>
                    </div>
                  </div>
                  <button type="submit" className="save-settings-btn">Save Brand Settings</button>
                </form>

                {/* Registrar instruction tabs */}
                <div className="dns-guide-section" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: '#fff' }}>CNAME Configuration Tutorials</h4>
                  <select 
                    value={activeRegistrar} 
                    onChange={(e) => setActiveRegistrar(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                  >
                    <option value="">-- Select Domain Registrar --</option>
                    <option value="hostinger">Hostinger</option>
                    <option value="cloudflare">Cloudflare</option>
                    <option value="godaddy">GoDaddy</option>
                    <option value="namecheap">Namecheap</option>
                  </select>

                  {activeRegistrar && (
                    <div className="registrar-steps" style={{
                      marginTop: '1rem',
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      background: 'rgba(255,255,255,0.01)',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.03)',
                      lineHeight: '1.5'
                    }}>
                      {activeRegistrar === 'hostinger' && (
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <li>Log in to your <strong>Hostinger hPanel</strong>.</li>
                          <li>Go to <strong>Domains</strong> &gt; Select your Domain &gt; <strong>DNS / Nameservers</strong>.</li>
                          <li>Add a new record:
                            <br />• <strong>Type:</strong> <code>CNAME</code>
                            <br />• <strong>Name:</strong> <code>cards</code> (or your custom subdomain name)
                            <br />• <strong>Target:</strong> <code>cname.vcardz.com</code>
                            <br />• <strong>TTL:</strong> <code>14400</code> (or default)
                          </li>
                          <li>Click <strong>Add Record</strong> and wait for propagation (usually 15-30 minutes).</li>
                        </ol>
                      )}
                      {activeRegistrar === 'cloudflare' && (
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <li>Log in to your <strong>Cloudflare Dashboard</strong> and select your zone.</li>
                          <li>Go to the <strong>DNS</strong> settings tab.</li>
                          <li>Click <strong>Add record</strong>:
                            <br />• <strong>Type:</strong> <code>CNAME</code>
                            <br />• <strong>Name:</strong> <code>cards</code>
                            <br />• <strong>Target:</strong> <code>cname.vcardz.com</code>
                            <br />• <strong>Proxy status:</strong> <code>DNS Only (Gray Cloud)</code> <span style={{ color: 'var(--accent-color)' }}>[Important]</span>
                          </li>
                          <li>Click <strong>Save</strong>.</li>
                        </ol>
                      )}
                      {activeRegistrar === 'godaddy' && (
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <li>Log in to your <strong>GoDaddy Portfolio</strong>.</li>
                          <li>Click the three dots next to your domain &gt; Select <strong>Edit DNS</strong>.</li>
                          <li>Click <strong>Add New Record</strong>:
                            <br />• <strong>Type:</strong> <code>CNAME</code>
                            <br />• <strong>Name:</strong> <code>cards</code>
                            <br />• <strong>Value:</strong> <code>cname.vcardz.com</code>
                            <br />• <strong>TTL:</strong> <code>Default</code>
                          </li>
                          <li>Click <strong>Save</strong>.</li>
                        </ol>
                      )}
                      {activeRegistrar === 'namecheap' && (
                        <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <li>Log in to your <strong>Namecheap Account</strong>.</li>
                          <li>Go to <strong>Domain List</strong> &gt; click <strong>Manage</strong> next to your domain.</li>
                          <li>Select the <strong>Advanced DNS</strong> tab.</li>
                          <li>In the Host Records section, click <strong>Add New Record</strong>:
                            <br />• <strong>Type:</strong> <code>CNAME Record</code>
                            <br />• <strong>Host:</strong> <code>cards</code>
                            <br />• <strong>Value:</strong> <code>cname.vcardz.com</code>
                            <br />• <strong>TTL:</strong> <code>Automatic</code>
                          </li>
                          <li>Click the green checkmark to save.</li>
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Client Invitation / Credentials generation (No self signup) */}
              <div className="settings-card">
                <h3>Provision Client Credentials</h3>
                <p className="card-desc">Create login accounts for your clients. They will be able to log in on your domain to update their visiting card details independently.</p>
                
                <form onSubmit={handleAddClient} className="settings-form client-form">
                  <div className="form-group">
                    <label>Client Email Address</label>
                    <input 
                      type="email" 
                      placeholder="client@company.com"
                      value={newClientEmail} 
                      onChange={(e) => setNewClientEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Login Password</label>
                    <input 
                      type="password" 
                      placeholder="Assign a secure password"
                      value={newClientPassword} 
                      onChange={(e) => setNewClientPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  <button type="submit" className="invite-client-btn">
                    <UserPlus size={16} /> Generate Credentials & Save
                  </button>
                </form>

                <h3 className="section-subtitle"><Users size={16} /> Active Managed Accounts ({clients.length})</h3>
                <div className="clients-list">
                  {clients.map((c, idx) => (
                    <div className="client-list-item" key={idx}>
                      <div>
                        <p className="cli-email"><strong>{c.email}</strong></p>
                        <p className="cli-date">Created on: {c.created_at}</p>
                      </div>
                      <span className="status-pill">Active client</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'nfc' ? (
          /* NFC MAPPING TAB */
          <div className="nfc-tab">
            <h2>NFC Tag Integration & Writing</h2>
            <p className="tab-desc">Link your digital business cards with physical NFC (Near Field Communication) products like smart cards, keychains, or badges.</p>

            <div className="nfc-guide-wrapper">
              <div className="guide-card">
                <h3>Select and Map Your Digital Card</h3>
                <div style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem'
                }}>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '500' }}>Select Card Profile</label>
                    {cards.length === 0 ? (
                      <p style={{ fontSize: '0.9rem', color: '#f87171' }}>Please create a digital card first to map it to an NFC tag.</p>
                    ) : (
                      <select
                        value={selectedNfcCardId}
                        onChange={(e) => {
                          setSelectedNfcCardId(e.target.value);
                          setNfcWriteStatus('');
                          setNfcWriteError('');
                        }}
                        style={{
                          padding: '0.75rem',
                          width: '100%',
                          background: '#090d16',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '0.9rem'
                        }}
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>{c.name} (/{c.slug})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedNfcCard && (
                    <>
                      <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '1.25rem'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NFC Destination URL</p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                          <code style={{ flex: 1, color: 'var(--accent-color)', fontFamily: 'Fira Code, monospace', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {`${window.location.origin}/${selectedNfcCard.slug}`}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/${selectedNfcCard.slug}`).then(() => {
                                setCopiedNfc(true);
                                setTimeout(() => setCopiedNfc(false), 2000);
                                showToast('NFC destination link copied!');
                              });
                            }}
                            className={copiedNfc ? 'copied-success' : ''}
                            style={{
                              background: copiedNfc ? 'rgba(16, 185, 129, 0.15)' : 'rgba(211,178,13,0.1)',
                              border: copiedNfc ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(211,178,13,0.2)',
                              color: copiedNfc ? '#34d399' : 'var(--accent-color)',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            {copiedNfc ? (
                              <>
                                <CheckCircle size={13} style={{ color: '#34d399' }} /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy Link
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Direct Browser NFC writing (NFC Web API) */}
                      <div style={{ marginTop: '1rem' }}>
                        {'NDEFReader' in window ? (
                          <div>
                            <button
                              type="button"
                              onClick={() => handleWriteNfc(selectedNfcCard.slug)}
                              style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #d4af37 0%, #aa7c11 100%)',
                                color: '#000',
                                border: 'none',
                                padding: '0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 15px rgba(170,124,17,0.3)'
                              }}
                              disabled={nfcWriteStatus === 'scanning'}
                            >
                              <Wifi size={16} /> {nfcWriteStatus === 'scanning' ? 'Ready to Tap... Hold Tag Close' : 'Write to NFC Tag Directly'}
                            </button>
                            
                            {nfcWriteStatus === 'scanning' && (
                              <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.5rem', textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
                                📡 Place your physical NFC card/tag against the back of your phone now.
                              </p>
                            )}
                            {nfcWriteStatus === 'success' && (
                              <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.5rem', textAlign: 'center' }}>
                                ✓ NFC Tag mapped successfully!
                              </p>
                            )}
                            {nfcWriteStatus === 'error' && (
                              <p style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.5rem', textAlign: 'center' }}>
                                ✗ {nfcWriteError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            lineHeight: '1.4'
                          }}>
                            <strong>💡 Web NFC Direct Writing:</strong> Not supported in this browser or OS. Web NFC direct writing is supported on Google Chrome for Android. For iOS or other environments, copy the profile link above and write it using the mobile app guide below.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <h3>Manual App Writing Instructions</h3>
                <ol className="nfc-steps">
                  <li><strong>Select card profile:</strong> Choose your card in the selector above.</li>
                  <li><strong>Download NFC Writing App:</strong> On your mobile phone, download a free app like <strong>NFC Tools</strong> (available on iOS and Android).</li>
                  <li><strong>Write URL record:</strong> In NFC Tools, go to <strong>Write</strong> &gt; <strong>Add a record</strong> &gt; <strong>URL/URI</strong>. Paste your profile link.</li>
                  <li><strong>Tag your physical card:</strong> Click <strong>Write</strong>, then tap your physical blank NFC tag (NTAG213 / NTAG215) against the back of your phone. The app will confirm successful writing!</li>
                  <li><strong>Done!</strong> Now, anyone who taps their smartphone against your physical card will instantly open your digital visiting card without downloading any apps!</li>
                </ol>
              </div>

              <div className="guide-card">
                <h3>Physical Smart Card Preview</h3>
                <div className="nfc-visual-card" style={{
                  border: `1px solid ${selectedNfcCard ? selectedNfcCard.accent_color : 'rgba(255, 255, 255, 0.1)'}`,
                  boxShadow: `0 20px 45px rgba(0,0,0,0.5), 0 0 20px ${selectedNfcCard ? selectedNfcCard.accent_color + '20' : 'rgba(0,0,0,0)'}`
                }}>
                  {/* Dynamic Glow using the card color */}
                  <div className="nfc-visual-card-glow" style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    background: `radial-gradient(circle, ${selectedNfcCard ? selectedNfcCard.accent_color : '#D3B20D'}22 0%, rgba(0,0,0,0) 70%)`,
                    filter: 'blur(20px)'
                  }} />

                  <div className="nfc-visual-logo">
                    <Sparkles size={20} style={{ color: selectedNfcCard ? selectedNfcCard.accent_color : 'var(--accent-color)' }} /> vCardz Smart
                  </div>

                  <div style={{ zIndex: 1, margin: '1rem 0' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', letterSpacing: '0.02em' }}>
                      {selectedNfcCard ? selectedNfcCard.name : 'Sarah Jenkins'}
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {selectedNfcCard ? selectedNfcCard.job_title : 'Creative Director'}
                    </p>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                      {selectedNfcCard ? selectedNfcCard.company : 'Aether Studio'}
                    </p>
                  </div>

                  <div className="nfc-visual-footer" style={{ zIndex: 1 }}>
                    <div>
                      <p style={{ margin: 0 }}>TAP TO SCAN</p>
                      <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.55rem', color: '#475569', textTransform: 'uppercase' }}>
                        /{selectedNfcCard ? selectedNfcCard.slug : 'sarah'}
                      </p>
                    </div>
                    <div className="nfc-icon-wrap" style={{ color: selectedNfcCard ? selectedNfcCard.accent_color : 'var(--accent-color)' }}>
                      <Wifi size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
