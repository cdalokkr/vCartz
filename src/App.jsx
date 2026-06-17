import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';
import CardView from './components/CardView.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vcardz_token') || '');
  const [loading, setLoading] = useState(true);
  
  // Basic Hash/Path Router State
  const [path, setPath] = useState(getPathName());

  function getPathName() {
    // Check path first. If path is just "/" or empty, check hash for static routing fallbacks.
    const pathname = window.location.pathname.substring(1);
    if (pathname && pathname !== 'index.html') {
      return pathname;
    }
    
    // Hash routing fallback: e.g. #/sarah or #sarah
    const hash = window.location.hash;
    if (hash) {
      return hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
    }
    return '';
  }

  // Handle URL navigation changes
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(getPathName());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Validate Token & Load Session
  useEffect(() => {
    async function checkSession() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('vcardz_token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [token]);

  // Navigate utility
  const navigate = (newPath) => {
    if (newPath.startsWith('#')) {
      window.location.hash = newPath;
    } else {
      window.history.pushState(null, '', newPath);
      setPath(newPath.substring(1));
    }
  };

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('vcardz_token', newToken);
    setToken(newToken);
    setUser(newUser);
    navigate('/');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      localStorage.removeItem('vcardz_token');
      setToken('');
      setUser(null);
      navigate('/');
    }
  };

  // SEO Updates Engine
  const updatePageSEO = (meta) => {
    const defaultTitle = 'vCardz | Premium Multi-Tenant Digital Business Cards';
    const defaultDesc = 'Create, customize, and share professional digital visiting cards. Fully white-labeled SaaS platform.';
    
    const title = meta.title || defaultTitle;
    const desc = meta.description || defaultDesc;
    const image = meta.image || '/favicon.svg';

    document.title = title;
    
    // Update basic meta descriptions
    const descTag = document.getElementById('seo-desc');
    if (descTag) descTag.setAttribute('content', desc);

    // Update OpenGraph
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.getElementById('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    const ogImage = document.getElementById('og-image');
    if (ogImage) ogImage.setAttribute('content', image);

    const ogType = document.getElementById('og-type');
    if (ogType) ogType.setAttribute('content', meta.type || 'website');

    // Update Twitter
    const twTitle = document.getElementById('twitter-title');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.getElementById('twitter-desc');
    if (twDesc) twDesc.setAttribute('content', desc);

    // Update JSON-LD structured schema
    const schemaTag = document.getElementById('jsonld-schema');
    if (schemaTag) {
      schemaTag.textContent = JSON.stringify(meta.schema || {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "vCardz",
        "url": window.location.origin
      }, null, 2);
    }
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

  // --- ROUTING RENDERER ---

  // Check if viewing a specific slug profile (e.g. /sarah or #/sarah)
  const isSlug = path && !['login', 'register', 'dashboard'].includes(path.toLowerCase());

  if (isSlug) {
    return (
      <CardView 
        slug={path} 
        updateSEO={updatePageSEO} 
        onGoHome={() => navigate('/')} 
      />
    );
  }

  // Auth pages (explicit)
  if (path === 'login' || path === 'register') {
    if (user) {
      navigate('/');
      return null;
    }
    if (path === 'register') {
      navigate('/login');
      return null;
    }
    return (
      <Auth 
        mode="login" 
        onAuthSuccess={handleLogin} 
        onNavigate={navigate} 
      />
    );
  }

  // If user is logged in, show the SaaS Admin Dashboard
  if (user) {
    return (
      <Dashboard 
        user={user} 
        token={token} 
        onLogout={handleLogout} 
        updateSEO={updatePageSEO} 
        onUpdateUser={setUser}
      />
    );
  }

  // Custom domain detection helper (White-labeled domains/subdomains)
  const isCustomDomain = () => {
    const hostname = window.location.hostname;
    const mainDomains = [
      'localhost',
      '127.0.0.1',
      'vcartz.com',
      'vcardz.com',
      'vcartz.vercel.app',
      'vcardz.vercel.app'
    ];
    const isMain = mainDomains.some(d => hostname === d || hostname.endsWith('.' + d));
    return !isMain;
  };

  // Default Landing Page for unauthenticated visitors
  if (isCustomDomain()) {
    return (
      <Auth 
        mode="login" 
        onAuthSuccess={handleLogin} 
        onNavigate={navigate} 
      />
    );
  }

  return (
    <LandingPage 
      onNavigate={navigate} 
      updateSEO={updatePageSEO} 
    />
  );
}
