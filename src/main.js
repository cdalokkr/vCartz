import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const customizerForm = document.getElementById('customizerForm');
  const visitingCard = document.getElementById('visitingCard');
  
  // Customizer Inputs
  const themeSelect = document.getElementById('themeSelect');
  const accentColorInput = document.getElementById('accentColor');
  const accentColorText = document.querySelector('.color-value');
  const inputName = document.getElementById('inputName');
  const inputJobTitle = document.getElementById('inputJobTitle');
  const inputOfficeName = document.getElementById('inputOfficeName');
  const inputBio = document.getElementById('inputBio');
  const inputPhone = document.getElementById('inputPhone');
  const inputEmail = document.getElementById('inputEmail');
  const inputGMap = document.getElementById('inputGMap');
  
  const socialLinkedIn = document.getElementById('socialLinkedIn');
  const socialTwitter = document.getElementById('socialTwitter');
  const socialWhatsApp = document.getElementById('socialWhatsApp');
  const socialFacebook = document.getElementById('socialFacebook');
  const socialInstagram = document.getElementById('socialInstagram');
  
  const avatarUpload = document.getElementById('avatarUpload');
  const customAvatarBtn = document.getElementById('customAvatarBtn');
  const avatarPresetBtns = document.querySelectorAll('.avatar-preset-btn');
  
  // Card Preview Elements
  const cardAvatar = document.getElementById('cardAvatar');
  const cardName = document.getElementById('cardName');
  const cardJobTitle = document.getElementById('cardJobTitle');
  const cardOfficeName = document.getElementById('cardOfficeName');
  const cardBio = document.getElementById('cardBio');
  
  const linkPhone = document.getElementById('linkPhone');
  const linkEmail = document.getElementById('linkEmail');
  const linkGMap = document.getElementById('linkGMap');
  
  const linkLinkedIn = document.getElementById('linkLinkedIn');
  const linkTwitter = document.getElementById('linkTwitter');
  const linkWhatsApp = document.getElementById('linkWhatsApp');
  const linkFacebook = document.getElementById('linkFacebook');
  const linkInstagram = document.getElementById('linkInstagram');
  
  // Containers & Shells
  const themeAmbientGlow = document.getElementById('themeAmbientGlow');
  const vcardAppView = document.getElementById('vcardAppView');
  const customizerPanel = document.getElementById('customizerPanel');
  
  // Buttons & Modals
  const mobileEditToggle = document.getElementById('mobileEditToggle');
  const btnShareLink = document.getElementById('btnShareLink');
  const btnMyQR = document.getElementById('btnMyQR');
  const btnSaveContact = document.getElementById('btnSaveContact');
  
  const qrModal = document.getElementById('qrModal');
  const qrModalClose = document.getElementById('qrModalClose');
  const qrCodeImage = document.getElementById('qrCodeImage');
  const qrSpinner = document.getElementById('qrSpinner');
  const qrModalCopyLink = document.getElementById('qrModalCopyLink');
  const toastContainer = document.getElementById('toastContainer');

  // App State variables
  let activeAvatarUrl = cardAvatar.src;
  let isCustomAvatar = false;
  let customAvatarBase64 = "";

  // Initialize Lucide Icons
  lucide.createIcons();

  // --- 3D TILT EFFECT ---
  const cardPerspective = document.querySelector('.vcard-card-perspective');
  
  if (cardPerspective && visitingCard) {
    const handleMove = (e) => {
      const cardRect = visitingCard.getBoundingClientRect();
      
      // Calculate mouse coordinates relative to card center
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;
      const cardCenterX = cardRect.left + cardWidth / 2;
      const cardCenterY = cardRect.top + cardHeight / 2;
      
      const mouseX = e.clientX - cardCenterX;
      const mouseY = e.clientY - cardCenterY;
      
      // Calculate rotation angles (max 15 degrees tilt)
      const rotateX = -15 * (mouseY / (cardHeight / 2));
      const rotateY = 15 * (mouseX / (cardWidth / 2));
      
      // Apply transforms
      visitingCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
      
      // Calculate shine reflection
      const shineAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
      visitingCard.style.backgroundImage = `linear-gradient(${shineAngle}deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 60%), var(--card-bg)`;
    };
    
    const handleLeave = () => {
      // Return to original flat position smoothly
      visitingCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      visitingCard.style.backgroundImage = 'none';
      visitingCard.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-image 0.6s ease';
    };

    const handleEnter = () => {
      visitingCard.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease';
    };
    
    cardPerspective.addEventListener('mousemove', handleMove);
    cardPerspective.addEventListener('mouseleave', handleLeave);
    cardPerspective.addEventListener('mouseenter', handleEnter);

    // Touch tilt for mobile swipe/drags
    cardPerspective.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const cardRect = visitingCard.getBoundingClientRect();
        const cardWidth = cardRect.width;
        const cardHeight = cardRect.height;
        const cardCenterX = cardRect.left + cardWidth / 2;
        const cardCenterY = cardRect.top + cardHeight / 2;
        
        const touchX = touch.clientX - cardCenterX;
        const touchY = touch.clientY - cardCenterY;
        
        const rotateX = -10 * (touchY / (cardHeight / 2));
        const rotateY = 10 * (touchX / (cardWidth / 2));
        
        visitingCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      }
    }, { passive: true });

    cardPerspective.addEventListener('touchend', handleLeave);
  }

  // --- DYNAMIC CARD SYNCHRONIZER ---
  const updateCard = () => {
    // 1. Text Fields
    cardName.textContent = inputName.value || 'Your Name';
    cardJobTitle.textContent = inputJobTitle.value || 'Professional Details';
    cardOfficeName.textContent = inputOfficeName.value || 'Office / Company';
    cardBio.textContent = inputBio.value || '';

    // Hide office name if empty
    if (!inputOfficeName.value) {
      cardOfficeName.style.display = 'none';
    } else {
      cardOfficeName.style.display = 'block';
    }

    // Hide bio if empty
    if (!inputBio.value) {
      cardBio.style.display = 'none';
    } else {
      cardBio.style.display = 'block';
    }

    // 2. Quick Actions Row (Call, Email, Map)
    // Phone
    if (inputPhone.value) {
      linkPhone.href = `tel:${inputPhone.value.replace(/\s+/g, '')}`;
      linkPhone.style.pointerEvents = 'auto';
      linkPhone.style.opacity = '1';
    } else {
      linkPhone.removeAttribute('href');
      linkPhone.style.pointerEvents = 'none';
      linkPhone.style.opacity = '0.4';
    }

    // Email
    if (inputEmail.value) {
      linkEmail.href = `mailto:${inputEmail.value}`;
      linkEmail.style.pointerEvents = 'auto';
      linkEmail.style.opacity = '1';
    } else {
      linkEmail.removeAttribute('href');
      linkEmail.style.pointerEvents = 'none';
      linkEmail.style.opacity = '0.4';
    }

    // Google Maps Link
    if (inputGMap.value) {
      linkGMap.href = inputGMap.value;
      linkGMap.style.pointerEvents = 'auto';
      linkGMap.style.opacity = '1';
    } else {
      linkGMap.removeAttribute('href');
      linkGMap.style.pointerEvents = 'none';
      linkGMap.style.opacity = '0.4';
    }

    // 3. Social media row visibility & links
    toggleSocialLink(linkLinkedIn, socialLinkedIn.value);
    toggleSocialLink(linkTwitter, socialTwitter.value);
    toggleSocialLink(linkFacebook, socialFacebook.value);
    toggleSocialLink(linkInstagram, socialInstagram.value);

    // WhatsApp requires wa.me formatting
    if (socialWhatsApp.value) {
      const sanitizedPhone = socialWhatsApp.value.replace(/[^\d]/g, '');
      linkWhatsApp.href = `https://wa.me/${sanitizedPhone}`;
      linkWhatsApp.style.display = 'flex';
    } else {
      linkWhatsApp.style.display = 'none';
    }

    // Hide entire social grid if all socials are empty
    const anySocial = socialLinkedIn.value || socialTwitter.value || socialWhatsApp.value || socialFacebook.value || socialInstagram.value;
    const socialsContainer = document.querySelector('.card-socials');
    if (socialsContainer) {
      socialsContainer.style.display = anySocial ? 'flex' : 'none';
    }
  };

  const toggleSocialLink = (elem, value) => {
    if (value) {
      elem.href = value;
      elem.style.display = 'flex';
    } else {
      elem.style.display = 'none';
    }
  };

  // Attach Event Listeners to Form Controls
  const formInputs = [
    inputName, inputJobTitle, inputOfficeName, inputBio, 
    inputPhone, inputEmail, inputGMap,
    socialLinkedIn, socialTwitter, socialWhatsApp, socialFacebook, socialInstagram
  ];

  formInputs.forEach(input => {
    input.addEventListener('input', updateCard);
  });

  // --- THEME & ACCENT SELECTOR ---
  const applyThemeAndColor = () => {
    const selectedTheme = themeSelect.value;
    const accentColor = accentColorInput.value;
    
    // Update color label text
    accentColorText.textContent = accentColor.toUpperCase();

    // Remove old theme classes from vCard View & Body
    document.body.className = '';
    vcardAppView.className = 'vcard-app-view';
    
    // Apply selected theme class
    const themeClass = `theme-${selectedTheme}`;
    document.body.classList.add(themeClass);
    vcardAppView.classList.add(themeClass);

    // Apply color values to CSS custom properties dynamically
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Extract RGB from Hex for opacity variables
    const rgb = hexToRgb(accentColor);
    if (rgb) {
      document.documentElement.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    // Dynamic background grid overrides for matrix
    if (selectedTheme === 'matrix-cyber') {
      document.documentElement.style.setProperty('--accent-color', '#10b981');
      document.documentElement.style.setProperty('--accent-rgb', '16, 185, 129');
      accentColorInput.disabled = true; // Fix matrix colors
    } else {
      accentColorInput.disabled = false;
    }
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  themeSelect.addEventListener('change', applyThemeAndColor);
  accentColorInput.addEventListener('input', applyThemeAndColor);

  // --- AVATAR HANDLERS ---
  avatarPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      avatarPresetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const avatarType = btn.dataset.avatar;

      if (avatarType === 'custom') {
        // Trigger file input
        avatarUpload.click();
      } else {
        isCustomAvatar = false;
        const img = btn.querySelector('img');
        cardAvatar.src = img.src;
        activeAvatarUrl = img.src;
      }
    });
  });

  avatarUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (limit to 1.5MB to avoid breaking URL sizes)
    if (file.size > 1.5 * 1024 * 1024) {
      showToast('Photo is too large. Preset avatars are recommended for sharing.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      // Update preview card avatar
      cardAvatar.src = dataUrl;
      activeAvatarUrl = dataUrl;
      isCustomAvatar = true;
      customAvatarBase64 = dataUrl;
      
      // Set custom button image preview
      customAvatarBtn.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      customAvatarBtn.classList.add('active');
      
      // Remove active from others
      avatarPresetBtns.forEach(b => {
        if (b !== customAvatarBtn) b.classList.remove('active');
      });
    };
    reader.readAsDataURL(file);
  });

  // --- VCARD (.VCF) CONTACT GENERATOR ---
  const generateVCard = () => {
    const name = inputName.value.trim() || 'Digital Contact';
    const parts = name.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    
    const role = inputJobTitle.value.trim();
    const org = inputOfficeName.value.trim();
    const phone = inputPhone.value.trim();
    const email = inputEmail.value.trim();
    const mapUrl = inputGMap.value.trim();
    const bio = inputBio.value.trim();
    
    // Construct vCard file contents (vCard 3.0 Standard)
    let vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${lastName};${firstName};;;`,
      `FN:${name}`,
    ];

    if (org) vcard.push(`ORG:${org}`);
    if (role) vcard.push(`TITLE:${role}`);
    if (phone) vcard.push(`TEL;TYPE=CELL,VOICE:${phone}`);
    if (email) vcard.push(`EMAIL;TYPE=PREF,INTERNET:${email}`);
    if (bio) vcard.push(`NOTE:${bio.replace(/\n/g, '\\n')}`);
    
    // Add custom links or map location in note
    if (mapUrl) vcard.push(`URL;TYPE=WORK:${mapUrl}`);

    // Social accounts
    if (socialLinkedIn.value) vcard.push(`X-SOCIALPROFILE;TYPE=linkedin:${socialLinkedIn.value}`);
    if (socialTwitter.value) vcard.push(`X-SOCIALPROFILE;TYPE=twitter:${socialTwitter.value}`);
    if (socialWhatsApp.value) vcard.push(`X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${socialWhatsApp.value.replace(/[^\d]/g, '')}`);
    if (socialFacebook.value) vcard.push(`X-SOCIALPROFILE;TYPE=facebook:${socialFacebook.value}`);
    if (socialInstagram.value) vcard.push(`X-SOCIALPROFILE;TYPE=instagram:${socialInstagram.value}`);

    vcard.push('END:VCARD');
    
    return vcard.join('\r\n');
  };

  btnSaveContact.addEventListener('click', () => {
    // Generate VCF content
    const vcardContent = generateVCard();
    const name = inputName.value.trim() || 'contact';
    const filename = `${name.toLowerCase().replace(/\s+/g, '_')}.vcf`;
    
    // Create blob and download link
    const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8;' });
    
    // Force standard browser download
    if (navigator.msSaveBlob) { // IE10+
      navigator.msSaveBlob(blob, filename);
    } else {
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Saving contact card to downloads...', 'success');
      }
    }
  });

  // --- URL STATE SHARING (HASH ENCODING) ---
  const generateShareableUrl = () => {
    // Compile current config state
    const state = {
      theme: themeSelect.value,
      color: accentColorInput.value,
      name: inputName.value,
      role: inputJobTitle.value,
      org: inputOfficeName.value,
      bio: inputBio.value,
      phone: inputPhone.value,
      email: inputEmail.value,
      gmap: inputGMap.value,
      lnkLinkedIn: socialLinkedIn.value,
      lnkTwitter: socialTwitter.value,
      lnkWa: socialWhatsApp.value,
      lnkFb: socialFacebook.value,
      lnkInsta: socialInstagram.value
    };

    // Include avatar selection
    if (isCustomAvatar && customAvatarBase64) {
      // If base64 is not excessively long, pack it. If too large, skip to avoid HTTP length error
      if (customAvatarBase64.length < 50000) {
        state.avatarData = customAvatarBase64;
      } else {
        showToast('Custom uploaded photo is too large to share in URL. Standard presets used instead.', 'warning');
      }
    } else {
      // Preset selection
      avatarPresetBtns.forEach(btn => {
        if (btn.classList.contains('active') && btn.dataset.avatar !== 'custom') {
          state.avatarPreset = btn.dataset.avatar;
        }
      });
    }

    try {
      const jsonString = JSON.stringify(state);
      // Safe Base64 conversion supporting unicode
      const base64String = btoa(unescape(encodeURIComponent(jsonString)));
      return `${window.location.origin}${window.location.pathname}#card=${base64String}`;
    } catch (e) {
      console.error('Error generating share URL:', e);
      return window.location.href;
    }
  };

  const loadStateFromUrl = () => {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#card=')) return;

    try {
      const base64String = hash.substring(6);
      const jsonString = decodeURIComponent(escape(atob(base64String)));
      const state = JSON.parse(jsonString);

      // Populate customizer panel input values
      if (state.theme) themeSelect.value = state.theme;
      if (state.color) accentColorInput.value = state.color;
      if (state.name) inputName.value = state.name;
      if (state.role) inputJobTitle.value = state.role;
      if (state.org) inputOfficeName.value = state.org;
      if (state.bio) inputBio.value = state.bio;
      if (state.phone) inputPhone.value = state.phone;
      if (state.email) inputEmail.value = state.email;
      if (state.gmap) inputGMap.value = state.gmap;
      
      if (state.lnkLinkedIn) socialLinkedIn.value = state.lnkLinkedIn;
      if (state.lnkTwitter) socialTwitter.value = state.lnkTwitter;
      if (state.lnkWa) socialWhatsApp.value = state.lnkWa;
      if (state.lnkFb) socialFacebook.value = state.lnkFb;
      if (state.lnkInsta) socialInstagram.value = state.lnkInsta;

      // Handle avatar restore
      if (state.avatarData) {
        cardAvatar.src = state.avatarData;
        activeAvatarUrl = state.avatarData;
        isCustomAvatar = true;
        customAvatarBase64 = state.avatarData;
        customAvatarBtn.innerHTML = `<img src="${state.avatarData}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        avatarPresetBtns.forEach(b => {
          if (b === customAvatarBtn) b.classList.add('active');
          else b.classList.remove('active');
        });
      } else if (state.avatarPreset) {
        avatarPresetBtns.forEach(btn => {
          if (btn.dataset.avatar === state.avatarPreset) {
            btn.classList.add('active');
            const img = btn.querySelector('img');
            cardAvatar.src = img.src;
            activeAvatarUrl = img.src;
            isCustomAvatar = false;
          } else {
            btn.classList.remove('active');
          }
        });
      }

      // Re-trigger layout syncs
      applyThemeAndColor();
      updateCard();

      // Launch Read-only View:
      // If another user opens the shared card link, hide the customizer by default so they only focus on the card
      if (window.innerWidth > 991) {
        // We can add a close button or let them open the customizer.
        // Let's add a clean entry transition showing the shared card.
        showToast('Viewing shared digital business card', 'success');
      }

    } catch (e) {
      console.error('Failed to parse shared card URL state:', e);
      showToast('Error loading shared card data.', 'error');
    }
  };

  // Click Copy Link
  btnShareLink.addEventListener('click', () => {
    const shareUrl = generateShareableUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Shareable card link copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Shareable card link copied to clipboard!', 'success');
    });
  });

  // --- MY QR CODE GENERATOR & DIALOG ---
  btnMyQR.addEventListener('click', () => {
    // Show spinner & clear image
    qrCodeImage.classList.remove('loaded');
    qrSpinner.style.display = 'block';
    
    // Generate URL
    const shareUrl = generateShareableUrl();

    // Use qrserver.com API to render the QR code pointing to our shareUrl
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(shareUrl)}`;
    
    qrCodeImage.src = qrApiUrl;
    qrModal.classList.add('active');
  });

  qrCodeImage.addEventListener('load', () => {
    // Hide spinner, show QR
    qrSpinner.style.display = 'none';
    qrCodeImage.classList.add('loaded');
  });

  qrModalClose.addEventListener('click', () => {
    qrModal.classList.remove('active');
  });

  // Close modal when clicking background overlay
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      qrModal.classList.remove('active');
    }
  });

  qrModalCopyLink.addEventListener('click', () => {
    const shareUrl = generateShareableUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Card link copied to clipboard!', 'success');
    });
  });

  // --- MOBILE VIEWS & PANEL DRAWER TOGGLING ---
  mobileEditToggle.addEventListener('click', () => {
    customizerPanel.classList.toggle('mobile-active');
    
    // Change edit button icon based on state
    const isOpen = customizerPanel.classList.contains('mobile-active');
    if (isOpen) {
      mobileEditToggle.innerHTML = '<i data-lucide="x"></i><span>Close Editor</span>';
    } else {
      mobileEditToggle.innerHTML = '<i data-lucide="edit-3"></i><span>Customize Card</span>';
    }
    lucide.createIcons();
  });

  // Auto-close customizer on click preview area (on Mobile)
  vcardAppView.addEventListener('click', () => {
    if (customizerPanel.classList.contains('mobile-active')) {
      customizerPanel.classList.remove('mobile-active');
      mobileEditToggle.innerHTML = '<i data-lucide="edit-3"></i><span>Customize Card</span>';
      lucide.createIcons();
    }
  });

  // --- FLOATING TOAST NOTIFICATION UTILITY ---
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Get icon based on type
    let iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'alert-circle';
    
    toast.innerHTML = `<i data-lucide="${iconName}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    lucide.createIcons();
    
    // Auto destroy
    setTimeout(() => {
      toast.remove();
    }, 2800);
  };

  // --- APP STARTUP INITIALIZATION ---
  applyThemeAndColor();
  updateCard();
  
  // Read hash on load to see if viewing a shared card
  loadStateFromUrl();
});
