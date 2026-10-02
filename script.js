/* ==========================================================================
   Pizza Web - PRODUCTION JAVASCRIPT ENGINE
   Features:
   - Instant Dynamic Logo Upload & Live Preview Engine
   - Automatic SEO & Schema.org JSON-LD Generation System
   - Dynamic Auto-Generated Delivery Notes based on Store Settings
   - Admin Reviews Moderation (Filter by Branch & Delete/Bulk Delete)
   - Realtime Delivery Rate Calculation & Dynamic Cart Fee Logic
   - Supabase Realtime & LocalStorage Sync
   - Dynamic Category Add & Remove System
   - Complete Admin Panel CRUD with In-Page Notifications & Staged Unsaved Changes
   ========================================================================== */

// --- Global Footprint & Year Initialization ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.innerText = new Date().getFullYear();

// --- Supabase Credentials & Client Setup ---
let SUPABASE_URL = localStorage.getItem('sb_url') || "https://mjlexamazzlswgulbklc.supabase.co";
let SUPABASE_PUBLISHABLE_KEY = localStorage.getItem('sb_key') || "sb_publishable_SLUf4t7mJ6xgGmzk7AwCcw_t8vAkt-G";
let _supabase = null;

function initSupabaseClient(url, key) {
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    try {
      _supabase = supabase.createClient(url || SUPABASE_URL, key || SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.error("Supabase client init failed:", e);
    }
  }
}
initSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// --- Default Configuration ---
const defaultConfig = {
  shopName: "Pizza Web",
  tagline: "Real Crust, Real Taste",
  heroTitle: "Hot & Fresh Artisan Pizza",
  heroDesc: "Hand-tossed dough, signature tomatoes, and 100% real mozzarella baked to perfection.",
  aboutTitle: "Why Choose Us?",
  aboutDesc: "Crafted with quality ingredients and love",
  aboutContent: "Welcome to our pizzeria! We take immense pride in crafting hot, fresh, artisan pizzas prepared with daily kneaded dough, rich tomato sauces, and 100% genuine mozzarella.",
  logo: "https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg",
  favicon: "https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg",
  footerLogo: "https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg",
  footerText: "Crafting artisan pizzas with perfection and local love.",
  primaryColor: "#e63946",
  accentColor: "#ffb703",
  heroBg: "https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/pexels-anhelina-vasylyk-734724285-33593003.jpg",
  currencySymbol: "Rs.",

  // Branches System
  branches: ["Main Branch - City Center", "Abbottabad Branch"],
  activeBranch: "Main Branch - City Center",

  // Branch Overrides Configuration
  branchOverrides: {
    "Main Branch - City Center": {
      bannerText: "🎉 FREE DELIVERY WITHIN 1 KM OR ORDERS OVER RS. 1500 AT MAIN BRANCH!",
      bannerMode: "show",
      mapEmbed: "https://maps.google.com/maps?q=34.3313,73.1980&z=15&output=embed",
      directionsUrl: "https://maps.google.com/?q=34.3313,73.1980",
      shopLat: 34.3313,
      shopLng: 73.1980,
      timing: "11:30 AM To 02:00 AM",
      statusMode: "auto",
      phones: ["1234567890", "0987654321"]
    },
    "Abbottabad Branch": {
      bannerText: "🍕 ABBOTTABAD SPECIAL: 10% OFF ON ALL MEDIUM PIZZAS!",
      bannerMode: "show",
      mapEmbed: "https://maps.google.com/maps?q=34.1688,73.2215&z=15&output=embed",
      directionsUrl: "https://maps.google.com/?q=34.1688,73.2215",
      shopLat: 34.1688,
      shopLng: 73.2215,
      timing: "12:00 PM To 01:00 AM",
      statusMode: "auto",
      phones: ["03111111111", "03222222222"]
    }
  },

  // Dynamic Delivery Configurations
  deliveryMode: "realtime",
  deliveryFee: 100,
  tieredMaxKm: 5,
  tieredDeliveryFee: 100,
  perKmRate: 30,
  freeDeliveryRadius: 1,
  freeDeliveryMin: 1500,

  // Custom Categories
  customCategories: [
    { key: "pizza", label: "Pizzas" },
    { key: "side", label: "Sides, Burgers & Drinks" },
    { key: "deal", label: "Special Deals" }
  ],

  // Menu Items
  menu: [
    {
      id: 1,
      name: "Big Discount Deal 1",
      desc: "2 Medium Pizzas + 1 Litre Soft Drink",
      price: 1500,
      type: "deal",
      tag: "HOT DEAL",
      img: "",
      branches: ["all"]
    },
    {
      id: 2,
      name: "Chicken Tikka Pizza",
      desc: "Loaded with mozzarella cheese & smoked chicken tikka chunks",
      price: 950,
      type: "pizza",
      tag: "POPULAR",
      img: "",
      branches: ["Main Branch - City Center"]
    },
    {
      id: 3,
      name: "Abbottabad Crown Crust Pizza",
      desc: "Cheesy stuffed crust with olives, jalapeños & grilled chicken",
      price: 1100,
      type: "pizza",
      tag: "SPECIAL",
      img: "",
      branches: ["Abbottabad Branch"]
    }
  ],

  gallery: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
  ]
};

// Application State
let config = JSON.parse(JSON.stringify(defaultConfig));
let cart = {};
let orderType = 'delivery';
let currentCategory = 'all';
let editingItemId = null;
let lastCustomerLat = null;
let lastCustomerLng = null;
let calculatedDistanceKm = null;
let reviewsList = [];
let pendingDeletedReviewIds = [];
let adminHasUnsavedChanges = false;
let adminSelectedBranch = "all";
let realtimeSubscribed = false;

// --- Custom In-Page Confirmation Modal Helper ---
function showConfirmationModal(title, msg, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-msg');
  const okBtn = document.getElementById('confirm-modal-ok-btn');
  const cancelBtn = document.getElementById('confirm-modal-cancel-btn');

  if (!modal) {
    if (confirm(msg)) onConfirm();
    return;
  }

  if (titleEl) titleEl.innerText = title || "Confirm Action";
  if (msgEl) msgEl.innerText = msg || "Are you sure you want to proceed?";

  const closeModalFn = () => {
    modal.style.display = 'none';
    okBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  okBtn.onclick = () => {
    closeModalFn();
    onConfirm();
  };

  cancelBtn.onclick = () => {
    closeModalFn();
  };

  modal.style.display = 'flex';
}

// --- Helper Functions ---
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeUrl(url) {
  if (!url) return 'https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg';
  const trimmed = String(url).trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  return trimmed;
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.innerText = msg;
  toast.className = 'toast-msg' + (isError ? ' error' : '');
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'none';
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'flex';
}

function markAdminHasChanges() {
  adminHasUnsavedChanges = true;
  updateUnsavedAlertBanner();
}

function updateUnsavedAlertBanner() {
  const alertEl = document.getElementById('admin-unsaved-alert');
  if (alertEl) {
    alertEl.style.display = adminHasUnsavedChanges ? 'flex' : 'none';
  }
}

// Upload file to 'menu-images' bucket
async function uploadFileToSupabaseStorage(file, bucketName = 'menu-images') {
  if (!_supabase) throw new Error("Supabase client is not initialized.");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await _supabase.storage
    .from(bucketName)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: publicUrlData } = _supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

// Logo Direct File Upload Function (Instant Load Engine)
async function uploadAdminLogoFile(fileInputEl) {
  const file = fileInputEl.files && fileInputEl.files[0];
  if (!file) return;

  showToast("⏳ Uploading logo...");
  try {
    let imageUrl = "";
    if (_supabase) {
      try {
        imageUrl = await uploadFileToSupabaseStorage(file, 'menu-images');
      } catch (sbErr) {
        console.warn("Storage upload failed, using fallback:", sbErr);
      }
    }

    if (!imageUrl) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const targetInput = document.getElementById('adm-logo-url');
    if (targetInput) targetInput.value = imageUrl;

    config.logo = imageUrl;
    markAdminHasChanges();
    showToast("✓ Logo uploaded! Click 'Save All Changes' to make it live.");
  } catch (err) {
    console.error("Upload error:", err);
    showToast("❌ Logo upload failed!", true);
  }
}

function onAdminLogoChange(val) {
  if (val && val.trim()) {
    config.logo = val.trim();
    markAdminHasChanges();
  }
}

// Gallery File Upload
async function uploadImageFile(fileInputEl, targetInputId, callback) {
  const file = fileInputEl.files && fileInputEl.files[0];
  if (!file) return;

  showToast("⏳ Uploading image...");
  try {
    let imageUrl = "";
    if (_supabase) {
      try {
        imageUrl = await uploadFileToSupabaseStorage(file, 'menu-images');
      } catch (sbErr) {
        console.warn("Storage upload failed, using fallback:", sbErr);
      }
    }

    if (!imageUrl) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const targetInput = document.getElementById(targetInputId);
    if (targetInput) targetInput.value = imageUrl;

    showToast("✓ Image uploaded to field!");
    if (typeof callback === 'function') callback(imageUrl);
  } catch (err) {
    console.error("Upload error:", err);
    showToast("❌ Upload failed!", true);
  }
}

// Menu Food Item Upload
async function uploadFoodImageToSupabase(fileInputEl, targetInputId, statusElId) {
  const file = fileInputEl.files && fileInputEl.files[0];
  const statusEl = statusElId ? document.getElementById(statusElId) : null;
  if (!file) return;

  if (statusEl) {
    statusEl.innerText = "⏳ Uploading...";
    statusEl.style.color = "#0284c7";
  }

  try {
    let imageUrl = "";
    if (_supabase) {
      try {
        imageUrl = await uploadFileToSupabaseStorage(file, 'menu-images');
      } catch (sbErr) {
        console.warn("Storage upload failed, using fallback:", sbErr);
      }
    }

    if (!imageUrl) {
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    const targetInput = document.getElementById(targetInputId);
    if (targetInput) targetInput.value = imageUrl;

    if (statusEl) {
      statusEl.innerText = "✓ Uploaded!";
      statusEl.style.color = "#10b981";
    }
    showToast("✓ Food image uploaded to field!");
  } catch (err) {
    console.error("Upload error:", err);
    if (statusEl) {
      statusEl.innerText = "❌ Upload failed";
      statusEl.style.color = "#ef4444";
    }
    showToast("❌ Upload failed!", true);
  }
}

// --- Active Branch Resolver ---
function getActiveBranchConfig(branchName) {
  const bName = branchName || config.activeBranch;
  if (!config.branchOverrides) config.branchOverrides = {};
  if (!config.branchOverrides[bName]) {
    config.branchOverrides[bName] = {
      bannerText: "🎉 Welcome to " + bName,
      bannerMode: "show",
      mapEmbed: "https://maps.google.com/maps?q=34.3313,73.1980&z=15&output=embed",
      directionsUrl: "https://maps.google.com/?q=34.3313,73.1980",
      shopLat: 34.3313,
      shopLng: 73.1980,
      timing: "11:30 AM To 02:00 AM",
      statusMode: "auto",
      phones: ["1234567890"]
    };
  }
  return config.branchOverrides[bName];
}

// --- Supabase Data Load & Persistence ---
async function loadConfigFromSupabase() {
  try {
    const cached = localStorage.getItem('pizzeria_config_data');
    if (cached) {
      const parsed = JSON.parse(cached);
      config = deepMergeConfig(defaultConfig, parsed);
    }
  } catch (e) {
    console.warn("LocalStorage load error:", e);
  }

  if (_supabase) {
    try {
      const { data, error } = await _supabase
        .from('pizzeria_config')
        .select('config_json')
        .eq('id', 1)
        .single();

      if (!error && data && data.config_json) {
        config = deepMergeConfig(defaultConfig, data.config_json);
        localStorage.setItem('pizzeria_config_data', JSON.stringify(config));
      }
    } catch (e) {
      console.warn("Supabase config fetch exception:", e);
    }
  }

  const storedBranch = sessionStorage.getItem('selected_pizzeria_branch');
  if (storedBranch && config.branches.includes(storedBranch)) {
    config.activeBranch = storedBranch;
  }

  initRealtimeSubscription();
  loadReviewsFromSupabase();
  renderSiteUI();
}

function deepMergeConfig(def, src) {
  const merged = { ...def, ...src };
  merged.branchOverrides = { ...def.branchOverrides, ...(src.branchOverrides || {}) };
  merged.branches = Array.isArray(src.branches) && src.branches.length > 0 ? src.branches : def.branches;
  merged.menu = Array.isArray(src.menu) ? src.menu : def.menu;
  merged.customCategories = Array.isArray(src.customCategories) ? src.customCategories : def.customCategories;
  merged.gallery = Array.isArray(src.gallery) ? src.gallery : def.gallery;
  return merged;
}

async function saveConfigToSupabase() {
  collectAdminFormValues();
  localStorage.setItem('pizzeria_config_data', JSON.stringify(config));

  let savedCloud = false;
  if (_supabase) {
    try {
      const { error } = await _supabase
        .from('pizzeria_config')
        .upsert({ id: 1, config_json: config, updated_at: new Date().toISOString() });

      if (!error) {
        savedCloud = true;
      } else {
        console.warn("Supabase upsert error:", error.message);
      }
    } catch (err) {
      console.warn("Supabase save error:", err);
    }

    if (pendingDeletedReviewIds.length > 0) {
      try {
        await _supabase
          .from('pizzeria_reviews')
          .delete()
          .in('id', pendingDeletedReviewIds);
        pendingDeletedReviewIds = [];
      } catch (revErr) {
        console.warn("Review deletion error:", revErr);
      }
    }
  }

  adminHasUnsavedChanges = false;
  updateUnsavedAlertBanner();
  showToast(savedCloud ? "✓ Configuration saved to Supabase & local storage!" : "✓ Saved locally!");
  renderSiteUI();
}

function initRealtimeSubscription() {
  if (!_supabase || realtimeSubscribed) return;
  try {
    _supabase
      .channel('pizzeria-realtime-config')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pizzeria_config', filter: 'id=eq.1' }, payload => {
        if (payload.new && payload.new.config_json && !adminHasUnsavedChanges) {
          config = deepMergeConfig(defaultConfig, payload.new.config_json);
          localStorage.setItem('pizzeria_config_data', JSON.stringify(config));
          renderSiteUI();
        }
      })
      .subscribe();
    realtimeSubscribed = true;
  } catch (e) {
    console.warn("Realtime subscription failed:", e);
  }
}

// --- Real-Time Branch Switching & UI Rendering ---
function renderSiteUI() {
  renderLogo();
  renderBanner();
  renderUserBranchDropdown();
  renderStoreStatusAndTiming();
  renderMapSectionAndDirections();
  renderMenu();
  renderGallery();
  renderReviewsList();
  updateCart();
  cleanAdminPanelUI();
  renderSEO();
}

// AUTOMATIC SEO ENGINE (Dynamic Title, Meta, Canonical, Open Graph, Twitter & Schema.org JSON-LD)
function renderSEO() {
  try {
    const shopName = config.shopName || "Pizza Web";
    const tagline = config.tagline || "Real Crust, Real Taste";
    const heroTitle = config.heroTitle || "Hot & Fresh Artisan Pizza";
    const heroDesc = config.heroDesc || config.aboutDesc || "Hand-tossed dough, signature tomatoes, and 100% real mozzarella baked to perfection.";
    const logoUrl = sanitizeUrl(config.logo || 'https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg');
    
    let fullLogoUrl = logoUrl;
    if (!fullLogoUrl.startsWith('http') && typeof window !== 'undefined' && window.location) {
      fullLogoUrl = (window.location.origin || '') + (fullLogoUrl.startsWith('/') ? '' : '/') + fullLogoUrl;
    }

    // 1. Dynamic Page Title
    const titleText = `${shopName} | ${tagline}`;
    document.title = titleText;
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.innerText = titleText;

    // Helper functions for safely targeting or creating tags
    const setMetaTag = (selector, attrName, attrVal, contentVal) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal || '');
    };

    const setLinkTag = (id, relVal, hrefVal) => {
      let el = document.getElementById(id) || document.querySelector(`link[rel="${relVal}"]`);
      if (!el) {
        el = document.createElement('link');
        el.id = id;
        el.rel = relVal;
        document.head.appendChild(el);
      }
      el.href = hrefVal || '';
    };

    // 2. Standard Meta Tags
    setMetaTag('#meta-desc', 'name', 'description', heroDesc);
    setMetaTag('#meta-author', 'name', 'author', shopName);
    setMetaTag('#meta-robots', 'name', 'robots', 'index, follow');

    // 3. Dynamic Canonical URL
    let currentCanonical = '';
    if (typeof window !== 'undefined' && window.location && window.location.href) {
      const origin = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '';
      const pathname = window.location.pathname || '';
      currentCanonical = (origin + pathname) || window.location.href;
    }
    setLinkTag('canonical-url', 'canonical', currentCanonical);

    // 4. Open Graph Tags
    setMetaTag('#og-title', 'property', 'og:title', `${shopName} - ${heroTitle}`);
    setMetaTag('#og-desc', 'property', 'og:description', heroDesc);
    setMetaTag('#og-image', 'property', 'og:image', fullLogoUrl);
    setMetaTag('#og-url', 'property', 'og:url', currentCanonical);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('#og-site-name', 'property', 'og:site_name', shopName);

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('#twitter-title', 'name', 'twitter:title', `${shopName} - ${heroTitle}`);
    setMetaTag('#twitter-desc', 'name', 'twitter:description', heroDesc);
    setMetaTag('#twitter-image', 'name', 'twitter:image', fullLogoUrl);

    // 6. Schema.org Restaurant JSON-LD Data
    let jsonLdScript = document.getElementById('json-ld-schema');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = 'json-ld-schema';
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }

    const activeBranchCfg = getActiveBranchConfig(config.activeBranch);
    const activePhones = activeBranchCfg.phones && activeBranchCfg.phones.length > 0 ? activeBranchCfg.phones : [];

    const schemaObj = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": (currentCanonical || '') + "#restaurant",
      "name": shopName,
      "description": heroDesc,
      "url": currentCanonical,
      "logo": fullLogoUrl,
      "image": fullLogoUrl,
      "servesCuisine": "Pizza",
      "priceRange": "$$"
    };

    if (activePhones.length > 0) {
      schemaObj["telephone"] = activePhones[0];
    }

    if (activeBranchCfg.shopLat && activeBranchCfg.shopLng) {
      schemaObj["geo"] = {
        "@type": "GeoCoordinates",
        "latitude": activeBranchCfg.shopLat,
        "longitude": activeBranchCfg.shopLng
      };
    }

    if (activeBranchCfg.timing) {
      schemaObj["openingHours"] = activeBranchCfg.timing;
    }

    if (Array.isArray(config.branches) && config.branches.length > 0) {
      schemaObj["department"] = config.branches.map(bName => {
        const bCfg = getActiveBranchConfig(bName);
        const dep = {
          "@type": "Restaurant",
          "name": `${shopName} - ${bName}`,
          "url": currentCanonical
        };
        if (bCfg.phones && bCfg.phones[0]) dep["telephone"] = bCfg.phones[0];
        if (bCfg.shopLat && bCfg.shopLng) {
          dep["geo"] = {
            "@type": "GeoCoordinates",
            "latitude": bCfg.shopLat,
            "longitude": bCfg.shopLng
          };
        }
        if (bCfg.timing) dep["openingHours"] = bCfg.timing;
        return dep;
      });
    }

    if (Array.isArray(config.menu) && config.menu.length > 0) {
      schemaObj["hasMenu"] = {
        "@type": "Menu",
        "name": "Main Menu",
        "hasMenuItem": config.menu.slice(0, 15).map(item => ({
          "@type": "MenuItem",
          "name": item.name,
          "description": item.desc || '',
          "offers": {
            "@type": "Offer",
            "price": item.price,
            "priceCurrency": "PKR"
          }
        }))
      };
    }

    jsonLdScript.textContent = JSON.stringify(schemaObj, null, 2);
  } catch (err) {
    console.warn("renderSEO failed gracefully:", err);
  }
}

// PURE SUPABASE LOGO LOADER (No broken icon flash, no unstyled state, no corrupt image symbol/alt text)
function renderLogo() {
  const logoUrl = sanitizeUrl(config.logo || 'https://mjlexamazzlswgulbklc.supabase.co/storage/v1/object/public/menu-images/logo.jpg');
  const logoElements = document.querySelectorAll('.nav-logo-img, .footer-logo-img, #nav-logo, #site-logo-img');
  
  logoElements.forEach(img => {
    img.style.opacity = '0';
    img.alt = escapeHTML(config.shopName || "Restaurant Logo");

    img.onload = function() {
      img.style.opacity = '1';
      img.style.display = 'block';
    };

    img.onerror = function() {
      img.style.opacity = '0';
      img.style.display = 'none';
    };

    img.src = logoUrl;

    if (img.complete && img.naturalWidth !== 0) {
      img.style.opacity = '1';
      img.style.display = 'block';
    }
  });

  const favicon = document.getElementById('page-favicon');
  if (favicon) favicon.href = logoUrl;
}

function renderBanner() {
  const bannerEl = document.getElementById('disp-offer-banner');
  if (!bannerEl) return;

  const branchCfg = getActiveBranchConfig(config.activeBranch);
  const isHidden = !branchCfg.bannerMode || branchCfg.bannerMode === 'none' || branchCfg.bannerMode === 'false';

  if (isHidden) {
    bannerEl.style.display = 'none';
    bannerEl.innerText = '';
  } else {
    bannerEl.innerText = branchCfg.bannerText || "🎉 Special Offer Available!";
    bannerEl.style.display = 'block';
  }
}

function renderUserBranchDropdown() {
  const sel = document.getElementById('global-branch-select');
  if (!sel) return;

  const branches = config.branches || [];
  if (!branches.includes(config.activeBranch)) {
    config.activeBranch = branches[0] || "Main Branch - City Center";
  }

  let html = '';
  branches.forEach(b => {
    html += `<option value="${escapeHTML(b)}" ${config.activeBranch === b ? 'selected' : ''}>🏢 ${escapeHTML(b)}</option>`;
  });
  sel.innerHTML = html;

  populateCartAndReviewBranchDropdowns();
}

function onUserBranchChange(val) {
  config.activeBranch = val;
  sessionStorage.setItem('selected_pizzeria_branch', val);

  recalculateDistanceForCurrentBranch();
  renderSiteUI();
}

function renderMapSectionAndDirections() {
  const activeCfg = getActiveBranchConfig(config.activeBranch);

  const locationSection = document.getElementById('location-section');
  if (locationSection) {
    let headerNameEl = document.getElementById('shop-map-branch-name');
    if (!headerNameEl) {
      const container = locationSection.querySelector('.container');
      const mapCard = locationSection.querySelector('.map-card');
      if (container && mapCard) {
        headerNameEl = document.createElement('h3');
        headerNameEl.id = 'shop-map-branch-name';
        headerNameEl.style.textAlign = 'center';
        headerNameEl.style.marginBottom = '12px';
        headerNameEl.style.fontSize = '1.3rem';
        headerNameEl.style.color = 'var(--primary)';
        headerNameEl.style.fontWeight = '700';
        container.insertBefore(headerNameEl, mapCard);
      }
    }
    if (headerNameEl) {
      headerNameEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHTML(config.activeBranch)}`;
    }
  }

  const mapIframe = document.getElementById('shop-map-iframe');
  if (mapIframe) {
    const formattedUrl = formatGoogleMapsEmbedUrl(activeCfg.mapEmbed, activeCfg.shopLat, activeCfg.shopLng);
    if (mapIframe.src !== formattedUrl) {
      mapIframe.src = formattedUrl;
    }
  }

  const directionsBtn = document.getElementById('shop-map-link');
  if (directionsBtn) {
    const directUrl = activeCfg.directionsUrl || `https://maps.google.com/?q=${activeCfg.shopLat},${activeCfg.shopLng}`;
    directionsBtn.href = sanitizeUrl(directUrl);
  }

  const callBtn = document.getElementById('direct-call-link');
  if (callBtn) {
    const phone = activeCfg.phones && activeCfg.phones[0] ? activeCfg.phones[0] : "1234567890";
    callBtn.href = `tel:${phone}`;
  }
}

function formatGoogleMapsEmbedUrl(input, lat, lng) {
  if (!input || !input.trim()) {
    if (lat && lng) return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    return `https://maps.google.com/maps?q=34.3313,73.1980&z=15&output=embed`;
  }

  let str = input.trim();
  if (str.includes('<iframe')) {
    const match = str.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      str = match[1];
    }
  }

  return sanitizeUrl(str);
}

function renderStoreStatusAndTiming() {
  const activeCfg = getActiveBranchConfig(config.activeBranch);

  const timingEl = document.getElementById('disp-timing');
  if (timingEl) {
    timingEl.innerText = activeCfg.timing || "11:30 AM To 02:00 AM";
  }

  const statusBadge = document.getElementById('store-status-badge');
  if (statusBadge) {
    const mode = activeCfg.statusMode || "auto";
    let isOpen = true;

    if (mode === "open") isOpen = true;
    else if (mode === "closed") isOpen = false;
    else isOpen = calculateIsOpenFromTiming(activeCfg.timing);

    if (isOpen) {
      statusBadge.className = 'status-badge status-open';
      statusBadge.innerText = '🟢 OPEN NOW';
    } else {
      statusBadge.className = 'status-badge status-closed';
      statusBadge.innerText = '🔴 CLOSED NOW';
    }
  }
}

function calculateIsOpenFromTiming(timingStr) {
  if (!timingStr) return true;
  try {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    
    const parts = timingStr.toLowerCase().split('to');
    if (parts.length !== 2) return true;

    const parseMinutes = (tStr) => {
      const match = tStr.trim().match(/(\d+):?(\d+)?\s*(am|pm)/);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      let mins = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3];
      if (period === 'pm' && hours < 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      return hours * 60 + mins;
    };

    const startMins = parseMinutes(parts[0]);
    const endMins = parseMinutes(parts[1]);

    if (startMins === null || endMins === null) return true;

    if (startMins < endMins) {
      return curMinutes >= startMins && curMinutes <= endMins;
    } else {
      return curMinutes >= startMins || curMinutes <= endMins;
    }
  } catch (e) {
    return true;
  }
}

function renderMenu() {
  const container = document.getElementById('menu-container');
  const catFilters = document.getElementById('customer-category-filters');
  const searchInput = document.getElementById('menu-search');
  if (!container) return;

  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  if (catFilters) {
    let catsHtml = `<button class="filter-btn ${currentCategory === 'all' ? 'active' : ''}" onclick="setCategoryFilter('all')">All Items</button>`;
    (config.customCategories || []).forEach(c => {
      catsHtml += `<button class="filter-btn ${currentCategory === c.key ? 'active' : ''}" onclick="setCategoryFilter('${escapeHTML(c.key)}')">${escapeHTML(c.label)}</button>`;
    });
    catFilters.innerHTML = catsHtml;
  }

  const currentBranch = config.activeBranch;
  const filtered = (config.menu || []).filter(item => {
    const itemBranches = Array.isArray(item.branches) ? item.branches : ['all'];
    const branchMatches = itemBranches.includes('all') || itemBranches.includes(currentBranch);
    if (!branchMatches) return false;

    if (currentCategory !== 'all' && item.type !== currentCategory) return false;

    if (searchQuery) {
      const matchName = item.name.toLowerCase().includes(searchQuery);
      const matchDesc = (item.desc || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="fa-solid fa-pizza-slice" style="font-size: 2rem; margin-bottom: 10px;"></i>
      <p>No menu items available for ${escapeHTML(currentBranch)} in this category.</p>
    </div>`;
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const hasImage = item.img && item.img.trim().length > 0;
    const cardClass = hasImage ? "card" : "card text-only-card";
    const imgHtml = hasImage ? `<img src="${sanitizeUrl(item.img)}" alt="${escapeHTML(item.name)}" class="card-img" loading="lazy">` : '';

    const h3MarginTop = (!hasImage && item.tag) ? '32px' : (hasImage ? '0' : '8px');

    html += `
    <div class="${cardClass}">
      ${item.tag ? `<span class="deal-badge">${escapeHTML(item.tag)}</span>` : ''}
      ${imgHtml}
      <div>
        <h3 style="margin-top: ${h3MarginTop};">${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.desc || '')}</p>
      </div>
      <div class="card-footer">
        <span class="price-tag">${escapeHTML(config.currencySymbol || 'Rs.')}${item.price}</span>
        <button class="btn-add" onclick="addToCart(${item.id})"><i class="fa-solid fa-plus"></i> Add to Cart</button>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function setCategoryFilter(catKey) {
  currentCategory = catKey;
  renderMenu();
}

function setOrderType(type) {
  orderType = type;
  document.getElementById('tab-del').className = `type-btn ${type === 'delivery' ? 'active' : ''}`;
  document.getElementById('tab-take').className = `type-btn ${type === 'takeaway' ? 'active' : ''}`;

  const addrGroup = document.getElementById('address-group');
  const locGroup = document.getElementById('location-share-group');
  if (addrGroup) addrGroup.style.display = type === 'delivery' ? 'block' : 'none';
  if (locGroup) locGroup.style.display = type === 'delivery' ? 'block' : 'none';

  updateCart();
}

function addToCart(itemId) {
  const item = (config.menu || []).find(i => i.id === itemId);
  if (!item) return;

  if (cart[itemId]) {
    cart[itemId].qty += 1;
  } else {
    cart[itemId] = { ...item, qty: 1 };
  }

  showToast(`Added ${item.name} to cart!`);
  updateCart();
}

function updateCartQty(itemId, delta) {
  if (!cart[itemId]) return;
  cart[itemId].qty += delta;
  if (cart[itemId].qty <= 0) {
    delete cart[itemId];
  }
  updateCart();
}

function updateCart() {
  const cartList = document.getElementById('cart-items');
  const itemCountEl = document.getElementById('cart-item-count');
  const cartTotalEl = document.getElementById('cart-total');
  const deliveryNoteEl = document.getElementById('delivery-note-disp');
  const currSymbolEl = document.getElementById('cart-curr-symbol');
  if (currSymbolEl) currSymbolEl.innerText = config.currencySymbol || 'Rs.';

  if (!cartList) return;

  const cartKeys = Object.keys(cart);
  let totalItems = 0;
  let itemsSubtotal = 0;

  if (cartKeys.length === 0) {
    cartList.innerHTML = `<li style="color: var(--text-muted); font-size: 0.85rem; padding: 10px 0;">Your cart is empty. Select delicious items from the menu to start!</li>`;
    if (itemCountEl) itemCountEl.innerText = '0 items';
    if (cartTotalEl) cartTotalEl.innerText = '0';
    
    renderCartDeliveryNote(0, calculatedDistanceKm, deliveryNoteEl);
    return;
  }

  let listHtml = '';
  cartKeys.forEach(key => {
    const item = cart[key];
    const itemTotal = item.price * item.qty;
    totalItems += item.qty;
    itemsSubtotal += itemTotal;

    listHtml += `
    <li class="cart-item">
      <div>
        <div style="font-weight: 600;">${escapeHTML(item.name)}</div>
        <small style="color: var(--text-muted);">${config.currencySymbol || 'Rs.'}${item.price} x ${item.qty}</small>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
        <span class="qty-input">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
      </div>
    </li>`;
  });

  cartList.innerHTML = listHtml;
  if (itemCountEl) itemCountEl.innerText = `${totalItems} item${totalItems > 1 ? 's' : ''}`;

  let deliveryFeeCalculated = 0;
  if (orderType === 'delivery') {
    deliveryFeeCalculated = calculateDeliveryFee(itemsSubtotal, calculatedDistanceKm);
  }

  const grandTotal = itemsSubtotal + deliveryFeeCalculated;
  if (cartTotalEl) cartTotalEl.innerText = grandTotal;

  renderCartDeliveryNote(itemsSubtotal, calculatedDistanceKm, deliveryNoteEl);
}

// Automatically generates Delivery Note based on configured Delivery Settings
function renderCartDeliveryNote(subtotal, distanceKm, deliveryNoteEl) {
  if (!deliveryNoteEl) return;

  if (orderType !== 'delivery') {
    deliveryNoteEl.innerHTML = "🛍️ Take Away Order (No delivery charge)";
    return;
  }

  const mode = config.deliveryMode || 'realtime';
  const freeMin = Number(config.freeDeliveryMin) || 0;
  const freeRadius = Number(config.freeDeliveryRadius) || 0;
  const curr = config.currencySymbol || 'Rs.';

  if (mode === 'free') {
    deliveryNoteEl.innerHTML = "🎉 <strong>Free Delivery</strong> on all orders!";
    return;
  }

  if (freeMin > 0 && subtotal >= freeMin) {
    deliveryNoteEl.innerHTML = `🎉 <strong>Free Delivery applied!</strong> (Order above ${curr}${freeMin})`;
    return;
  }

  if (distanceKm !== null && freeRadius > 0 && distanceKm <= freeRadius) {
    deliveryNoteEl.innerHTML = `🎉 <strong>Free Delivery applied!</strong> (Within ${freeRadius} KM radius)`;
    return;
  }

  const calculatedFee = calculateDeliveryFee(subtotal, distanceKm);

  if (distanceKm !== null) {
    deliveryNoteEl.innerHTML = `📍 Distance: <strong>${distanceKm} KM</strong> | Delivery Fee: <strong>${curr}${calculatedFee}</strong>`;
  } else {
    let autoNoteParts = [];
    if (freeRadius > 0) autoNoteParts.push(`within <strong>${freeRadius} KM</strong>`);
    if (freeMin > 0) autoNoteParts.push(`orders over <strong>${curr}${freeMin}</strong>`);

    if (autoNoteParts.length > 0) {
      deliveryNoteEl.innerHTML = `💡 Free Delivery ${autoNoteParts.join(' or ')}!`;
    } else if (mode === 'fixed') {
      deliveryNoteEl.innerHTML = `📦 Fixed Delivery Fee: <strong>${curr}${config.deliveryFee || 100}</strong>`;
    } else if (mode === 'tiered') {
      deliveryNoteEl.innerHTML = `📊 Base Delivery Fee: <strong>${curr}${config.tieredDeliveryFee || 100}</strong> (Up to ${config.tieredMaxKm || 5} KM)`;
    } else {
      deliveryNoteEl.innerHTML = `⚡ Realtime distance rate: <strong>${curr}${config.perKmRate || 30}/KM</strong>.`;
    }
  }
}

function calculateDeliveryFee(subtotal, distanceKm) {
  const mode = config.deliveryMode || 'realtime';
  if (mode === 'free') return 0;

  const freeMin = Number(config.freeDeliveryMin) || 0;
  const freeRadius = Number(config.freeDeliveryRadius) || 0;

  if (freeMin > 0 && subtotal >= freeMin) return 0;
  if (freeRadius > 0 && distanceKm !== null && distanceKm <= freeRadius) return 0;

  if (mode === 'fixed') {
    return Number(config.deliveryFee) || 100;
  } else if (mode === 'tiered') {
    const maxKm = Number(config.tieredMaxKm) || 5;
    const baseFee = Number(config.tieredDeliveryFee) || 100;
    const perKm = Number(config.perKmRate) || 30;
    if (distanceKm !== null && distanceKm <= maxKm) {
      return baseFee;
    }
    const extraKm = Math.ceil(Math.max(0, (distanceKm || maxKm) - maxKm));
    return baseFee + (extraKm * perKm);
  } else {
    if (distanceKm === null) return Number(config.deliveryFee) || 100;
    const perKm = Number(config.perKmRate) || 30;

    let chargeableKm = distanceKm;
    if (freeRadius > 0 && distanceKm > freeRadius) {
      chargeableKm = distanceKm - freeRadius;
    }

    return Math.max(30, Math.round(chargeableKm * perKm));
  }
}

function populateCartAndReviewBranchDropdowns() {
  const custBranchSel = document.getElementById('cust-branch');
  const waSel = document.getElementById('whatsapp-select');
  const revBranchSel = document.getElementById('rev-branch');
  const viewerRevFilter = document.getElementById('viewer-review-branch-filter');
  const branches = config.branches || [];

  if (custBranchSel) {
    let bHtml = '';
    branches.forEach(b => {
      bHtml += `<option value="${escapeHTML(b)}" ${config.activeBranch === b ? 'selected' : ''}>🏢 ${escapeHTML(b)}</option>`;
    });
    custBranchSel.innerHTML = bHtml;
  }

  if (waSel) {
    const activeCfg = getActiveBranchConfig(config.activeBranch);
    const phones = activeCfg.phones && activeCfg.phones.length > 0 ? activeCfg.phones : ["1234567890"];
    let waHtml = '';
    phones.forEach(p => {
      waHtml += `<option value="${escapeHTML(p)}">📱 WhatsApp (${escapeHTML(p)})</option>`;
    });
    waSel.innerHTML = waHtml;
  }

  if (revBranchSel) {
    let revHtml = '';
    branches.forEach(b => {
      revHtml += `<option value="${escapeHTML(b)}" ${config.activeBranch === b ? 'selected' : ''}>🏢 ${escapeHTML(b)}</option>`;
    });
    revBranchSel.innerHTML = revHtml;
  }

  if (viewerRevFilter) {
    let revFilterHtml = '<option value="all">🌟 All Reviews / Branches</option>';
    branches.forEach(b => {
      revFilterHtml += `<option value="${escapeHTML(b)}">🏢 ${escapeHTML(b)}</option>`;
    });
    viewerRevFilter.innerHTML = revFilterHtml;
  }
}

function onCartBranchChange(val) {
  onUserBranchChange(val);
}

async function fetchCustomerGPS() {
  const btn = document.getElementById('btn-fetch-gps');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Locating...';
  }

  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser.", true);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Fetch Precise GPS';
    }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      lastCustomerLat = lat;
      lastCustomerLng = lng;

      const mapsInput = document.getElementById('cust-maps-url');
      if (mapsInput) {
        mapsInput.value = `https://maps.google.com/maps?q=${lat},${lng}`;
      }

      const activeCfg = getActiveBranchConfig(config.activeBranch);
      calculatedDistanceKm = await fetchORSDistance(activeCfg.shopLat, activeCfg.shopLng, lat, lng);

      showToast(`📍 GPS Fetched! Distance: ${calculatedDistanceKm !== null ? calculatedDistanceKm + ' KM' : 'Calculated'}`);
      updateCart();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Fetch Precise GPS';
      }
    },
    (err) => {
      showToast("Unable to fetch GPS location.", true);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Fetch Precise GPS';
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

let geocodeDebounceTimer = null;
function onCustomAddressInputDebounced() {
  clearTimeout(geocodeDebounceTimer);
  geocodeDebounceTimer = setTimeout(() => {
    recalculateDistanceForCurrentBranch();
  }, 700);
}

async function recalculateDistanceForCurrentBranch() {
  const mapsInput = document.getElementById('cust-maps-url');
  const addressInput = document.getElementById('cust-address');

  const mapsUrlVal = mapsInput ? mapsInput.value.trim() : '';
  const addressVal = addressInput ? addressInput.value.trim() : '';

  if (mapsUrlVal) {
    const coords = parseLatLngFromUrl(mapsUrlVal);
    if (coords) {
      lastCustomerLat = coords.lat;
      lastCustomerLng = coords.lng;
      const activeCfg = getActiveBranchConfig(config.activeBranch);
      calculatedDistanceKm = await fetchORSDistance(activeCfg.shopLat, activeCfg.shopLng, coords.lat, coords.lng);
      updateCart();
      return;
    }
  }

  if (addressVal) {
    const geo = await fetchGeocodeAddress(addressVal);
    if (geo) {
      lastCustomerLat = geo.lat;
      lastCustomerLng = geo.lng;
      const activeCfg = getActiveBranchConfig(config.activeBranch);
      calculatedDistanceKm = await fetchORSDistance(activeCfg.shopLat, activeCfg.shopLng, geo.lat, geo.lng);
      updateCart();
      return;
    }
  }

  lastCustomerLat = null;
  lastCustomerLng = null;
  calculatedDistanceKm = null;
  updateCart();
}

function updateGpsPreview(val) {
  recalculateDistanceForCurrentBranch();
}

async function fetchORSDistance(startLat, startLng, endLat, endLng) {
  if (!startLat || !startLng || !endLat || !endLng) return null;
  try {
    if (_supabase && _supabase.functions) {
      const { data, error } = await _supabase.functions.invoke('ors-distance', {
        body: { startLat, startLng, endLat, endLng }
      });
      if (!error && data && typeof data.distanceKm === 'number') return data.distanceKm;
    }
  } catch (e) {}
  return calculateHaversineDistance(startLat, startLng, endLat, endLng);
}

async function fetchGeocodeAddress(addressText) {
  if (!addressText || !addressText.trim()) return null;
  try {
    if (_supabase && _supabase.functions) {
      const { data, error } = await _supabase.functions.invoke('geocode-address', {
        body: { address: addressText.trim() }
      });
      if (!error && data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        return { lat: data.lat, lng: data.lng };
      }
    }
  } catch (e) {}
  return null;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

function parseLatLngFromUrl(str) {
  if (!str) return null;
  try { str = decodeURIComponent(str); } catch(e) {}
  if (str.includes('<iframe')) {
    const match = str.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) str = match[1];
  }
  let pbMatch = str.match(/!2d(-?\d+(?:\.\d+)?)(?:![^!]*)*!3d(-?\d+(?:\.\d+)?)/);
  if (pbMatch) return { lat: parseFloat(pbMatch[2]), lng: parseFloat(pbMatch[1]) };
  let pbReverse = str.match(/!3d(-?\d+(?:\.\d+)?)(?:![^!]*)*!2d(-?\d+(?:\.\d+)?)/);
  if (pbReverse) return { lat: parseFloat(pbReverse[1]), lng: parseFloat(pbReverse[2]) };
  let atMatch = str.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  let rawMatch = str.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (rawMatch) return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };
  return null;
}

function placeOrder() {
  const cartKeys = Object.keys(cart);
  if (cartKeys.length === 0) {
    showToast("Your cart is empty!", true);
    return;
  }

  const nameInput = document.getElementById('cust-name');
  const addressInput = document.getElementById('cust-address');
  const mapsInput = document.getElementById('cust-maps-url');
  const waSel = document.getElementById('whatsapp-select');

  const custName = nameInput ? nameInput.value.trim() : '';
  const custAddress = addressInput ? addressInput.value.trim() : '';
  const custMaps = mapsInput ? mapsInput.value.trim() : '';
  const waPhone = waSel ? waSel.value : '';

  if (!custName) {
    showToast("Please enter your full name.", true);
    if (nameInput) nameInput.focus();
    return;
  }

  if (orderType === 'delivery' && !custAddress && !custMaps) {
    showToast("Please enter delivery address or Google Maps link.", true);
    if (addressInput) addressInput.focus();
    return;
  }

  let text = `*🍕 NEW ORDER - ${config.shopName.toUpperCase()}*\n`;
  text += `*Branch:* ${config.activeBranch}\n`;
  text += `*Order Type:* ${orderType.toUpperCase()}\n`;
  text += `*Customer:* ${custName}\n`;

  if (orderType === 'delivery') {
    if (custAddress) text += `*Address:* ${custAddress}\n`;
    if (custMaps) text += `*Maps / Distance Link:* ${custMaps}\n`;
    if (calculatedDistanceKm !== null) text += `*Calculated Distance:* ${calculatedDistanceKm} KM\n`;
  }

  text += `\n*ORDER ITEMS:*\n`;
  let subtotal = 0;
  cartKeys.forEach(k => {
    const item = cart[k];
    const itemTot = item.price * item.qty;
    subtotal += itemTot;
    text += `• ${item.name} x${item.qty} = ${config.currencySymbol || 'Rs.'}${itemTot}\n`;
  });

  let delFee = orderType === 'delivery' ? calculateDeliveryFee(subtotal, calculatedDistanceKm) : 0;
  let grandTot = subtotal + delFee;

  text += `\n*Subtotal:* ${config.currencySymbol || 'Rs.'}${subtotal}\n`;
  if (orderType === 'delivery') text += `*Delivery Fee:* ${config.currencySymbol || 'Rs.'}${delFee}\n`;
  text += `*GRAND TOTAL:* ${config.currencySymbol || 'Rs.'}${grandTot}\n`;

  const cleanPhone = waPhone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

function renderGallery() {
  const container = document.getElementById('gallery-container');
  if (!container) return;

  const images = config.gallery || [];
  if (images.length === 0) {
    container.innerHTML = `<p style="padding: 20px; color: var(--text-muted);">No photos available in gallery.</p>`;
    return;
  }

  let html = '';
  images.forEach(img => {
    html += `
    <div class="gallery-item">
      <img src="${sanitizeUrl(img)}" alt="Restaurant gallery photo" loading="lazy">
    </div>`;
  });
  container.innerHTML = html;
}

function scrollGallery(direction) {
  const container = document.getElementById('gallery-container');
  if (container) container.scrollBy({ left: direction * 280, behavior: 'smooth' });
}

async function loadReviewsFromSupabase() {
  if (!_supabase) return;
  try {
    const { data, error } = await _supabase
      .from('pizzeria_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      reviewsList = data;
      renderReviewsList();
    }
  } catch (e) {}
}

function renderReviewsList() {
  const container = document.getElementById('reviews-container');
  const filterSel = document.getElementById('viewer-review-branch-filter');
  if (!container) return;

  const selectedFilter = filterSel ? filterSel.value : 'all';
  const filtered = reviewsList.filter(r => {
    if (selectedFilter === 'all') return true;
    return r.branch === selectedFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 15px; grid-column:1/-1;">No reviews submitted yet for this branch selection.</p>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    const stars = '⭐'.repeat(r.rating || 5);
    html += `
    <div class="review-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <strong style="font-size:0.9rem;">${escapeHTML(r.name || 'Customer')}</strong>
        <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(r.branch || '')}</span>
      </div>
      <div style="color:#f59e0b; font-size:0.8rem; margin-bottom:4px;">${stars}</div>
      <p style="font-size:0.82rem; color:var(--text);">${escapeHTML(r.comment || '')}</p>
    </div>`;
  });

  container.innerHTML = html;
}

async function submitReview() {
  const nameInput = document.getElementById('rev-name');
  const commentInput = document.getElementById('rev-comment');
  const ratingSel = document.getElementById('rev-rating');
  const branchSel = document.getElementById('rev-branch');

  const name = nameInput ? nameInput.value.trim() : '';
  const comment = commentInput ? commentInput.value.trim() : '';
  const rating = ratingSel ? parseInt(ratingSel.value, 10) : 5;
  const branch = branchSel ? branchSel.value : config.activeBranch;

  if (!name || !comment) {
    showToast("Please enter your name and review comment.", true);
    return;
  }

  const newRev = {
    name,
    comment,
    rating,
    branch,
    created_at: new Date().toISOString()
  };

  if (_supabase) {
    try {
      const { data, error } = await _supabase.from('pizzeria_reviews').insert([newRev]).select();
      if (!error && data && data[0]) {
        newRev.id = data[0].id;
      }
    } catch (e) {}
  }

  reviewsList.unshift(newRev);
  if (nameInput) nameInput.value = '';
  if (commentInput) commentInput.value = '';

  showToast("✓ Thank you for your review!");
  renderReviewsList();
}

// --- ADMIN PANEL CONTROLS & MANAGEMENT ---

function cleanAdminPanelUI() {
  const restrictedElementIds = [
    'adm-shopName', 'adm-tagline', 'adm-heroTitle', 'adm-heroDesc',
    'adm-aboutTitle', 'adm-aboutDesc', 'adm-aboutContent',
    'adm-favicon', 'adm-footerLogo', 'adm-primaryColor', 'adm-accentColor',
    'adm-heroBg', 'adm-seoTitle', 'adm-metaDescription', 'adm-seoKeywords',
    'adm-seoAuthor', 'adm-seoRobots', 'adm-canonicalUrl', 'adm-ogImage', 'adm-schemaType',
    'adm-soc-fb', 'adm-soc-insta', 'adm-soc-wa', 'adm-soc-tt'
  ];

  restrictedElementIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const parentBlock = el.closest('div');
      if (parentBlock && !parentBlock.classList.contains('admin-section-block')) {
        parentBlock.style.display = 'none';
      } else {
        el.disabled = true;
        el.style.backgroundColor = '#f1f5f9';
      }
    }
  });

  const globalSec = document.getElementById('sec-global-config');
  if (globalSec) globalSec.style.display = 'none';
}

function populateAdminFields() {
  cleanAdminPanelUI();
  populateAdminBranchDropdown();
  renderAdminBranchOverview();
  renderMenuBranchCheckboxes();
  renderAdminMenuTable();
  renderAdminCategoryTags();
  renderAdminCategoryManager();
  renderAdminReviewsList();
  renderAdminGalleryManager();

  const logoInput = document.getElementById('adm-logo-url');
  if (logoInput) logoInput.value = config.logo || '';

  const delMode = document.getElementById('adm-deliveryMode');
  const delFee = document.getElementById('adm-deliveryFee');
  const perKm = document.getElementById('adm-perKmRate');
  const maxKm = document.getElementById('adm-tieredMaxKm');
  const tieredFee = document.getElementById('adm-tieredDeliveryFee');
  const radius = document.getElementById('adm-freeDeliveryRadius');
  const freeMin = document.getElementById('adm-freeDeliveryMin');

  if (delMode) delMode.value = config.deliveryMode || 'realtime';
  if (delFee) delFee.value = config.deliveryFee || 100;
  if (perKm) perKm.value = config.perKmRate || 30;
  if (maxKm) maxKm.value = config.tieredMaxKm || 5;
  if (tieredFee) tieredFee.value = config.tieredDeliveryFee || 100;
  if (radius) radius.value = config.freeDeliveryRadius || 1;
  if (freeMin) freeMin.value = config.freeDeliveryMin || 1500;

  updateUnsavedAlertBanner();
}

function populateAdminBranchDropdown() {
  const adminBranchSelect = document.getElementById('admin-selected-branch-dropdown');
  if (!adminBranchSelect) return;
  const branches = config.branches || [];

  let html = '<option value="all">🌐 All Branches Overview</option>';
  branches.forEach(b => {
    html += `<option value="${escapeHTML(b)}">🏢 Branch: ${escapeHTML(b)}</option>`;
  });
  adminBranchSelect.innerHTML = html;
  adminBranchSelect.value = adminSelectedBranch || 'all';
}

function onAdminBranchSelectChange(val) {
  adminSelectedBranch = val;
  renderAdminBranchOverview();
  renderAdminMenuTable();
}

function renderAdminBranchOverview() {
  const container = document.getElementById('admin-branch-overview');
  if (!container) return;

  const branchesToRender = (adminSelectedBranch === 'all') 
    ? config.branches 
    : config.branches.filter(b => b === adminSelectedBranch);

  let html = '';
  branchesToRender.forEach(bName => {
    const bCfg = getActiveBranchConfig(bName);
    const bKey = bName.replace(/[^a-zA-Z0-9]/g, '_');
    const phones = bCfg.phones || [];

    let phonesListHtml = '';
    phones.forEach((p, pIdx) => {
      phonesListHtml += `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <input type="text" value="${escapeHTML(p)}" oninput="updateBranchPhoneValue('${escapeHTML(bName)}', ${pIdx}, this.value)">
        <button onclick="adminDeleteBranchPhone('${escapeHTML(bName)}', ${pIdx})" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;" title="Delete Phone Number">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>`;
    });

    html += `
    <div style="background:#ffffff; border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h5 style="margin:0; font-size:0.95rem; color:var(--primary);"><i class="fa-solid fa-store"></i> ${escapeHTML(bName)}</h5>
        ${config.branches.length > 1 ? `<button onclick="adminDeleteBranch('${escapeHTML(bName)}')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;"><i class="fa-solid fa-trash"></i> Delete Branch</button>` : ''}
      </div>

      <div class="admin-grid-2">
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Banner Configuration</label>
          <select id="adm-br-${bKey}-bannerMode" onchange="markAdminHasChanges()">
            <option value="show" ${bCfg.bannerMode !== 'none' ? 'selected' : ''}>🎉 Display Banner</option>
            <option value="none" ${bCfg.bannerMode === 'none' ? 'selected' : ''}>❌ None (Hide Banner)</option>
          </select>
        </div>
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Banner Text</label>
          <input type="text" id="adm-br-${bKey}-bannerText" value="${escapeHTML(bCfg.bannerText || '')}" oninput="markAdminHasChanges()">
        </div>
      </div>

      <div class="admin-grid-2" style="margin-top:8px;">
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Google Maps Iframe Embed Code / Link</label>
          <input type="text" id="adm-br-${bKey}-mapEmbed" value="${escapeHTML(bCfg.mapEmbed || '')}" placeholder="Paste Google Maps iframe HTML tag or Embed URL directly" oninput="handleBranchMapEmbedInput('${bKey}', this.value)">
        </div>
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Google Maps Direct Link</label>
          <input type="text" id="adm-br-${bKey}-directionsUrl" value="${escapeHTML(bCfg.directionsUrl || '')}" placeholder="Direct Google Maps Link" oninput="markAdminHasChanges()">
        </div>
      </div>

      <div class="admin-grid-3" style="margin-top:8px;">
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Operating Hours / Timings</label>
          <input type="text" id="adm-br-${bKey}-timing" value="${escapeHTML(bCfg.timing || '')}" oninput="markAdminHasChanges()">
        </div>
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Store Status Mode</label>
          <select id="adm-br-${bKey}-statusMode" onchange="markAdminHasChanges()">
            <option value="auto" ${bCfg.statusMode === 'auto' ? 'selected' : ''}>⏰ Auto (Hours Based)</option>
            <option value="open" ${bCfg.statusMode === 'open' ? 'selected' : ''}>🟢 Force OPEN</option>
            <option value="closed" ${bCfg.statusMode === 'closed' ? 'selected' : ''}>🔴 Force CLOSED</option>
          </select>
        </div>
        <div>
          <label style="font-weight:600; font-size:0.78rem;">Branch Phone Lines (+ Add / Delete)</label>
          ${phonesListHtml}
          <div style="display:flex; gap:4px; margin-top:4px;">
            <input type="text" id="adm-br-${bKey}-new-phone" placeholder="New Phone (e.g. 0311...)">
            <button onclick="adminAddBranchPhone('${escapeHTML(bName)}')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:1.1rem;" title="Add Phone Number">+</button>
          </div>
        </div>
      </div>
      
      <input type="hidden" id="adm-br-${bKey}-shopLat" value="${bCfg.shopLat || 34.3313}">
      <input type="hidden" id="adm-br-${bKey}-shopLng" value="${bCfg.shopLng || 73.1980}">
    </div>`;
  });

  container.innerHTML = html;
}

function adminAddBranchPhone(bName) {
  const bKey = bName.replace(/[^a-zA-Z0-9]/g, '_');
  const input = document.getElementById(`adm-br-${bKey}-new-phone`);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const bCfg = getActiveBranchConfig(bName);
  if (!Array.isArray(bCfg.phones)) bCfg.phones = [];
  bCfg.phones.push(val);
  markAdminHasChanges();
  renderAdminBranchOverview();
}

function adminDeleteBranchPhone(bName, pIdx) {
  const bCfg = getActiveBranchConfig(bName);
  if (Array.isArray(bCfg.phones) && bCfg.phones[pIdx] !== undefined) {
    bCfg.phones.splice(pIdx, 1);
    markAdminHasChanges();
    renderAdminBranchOverview();
  }
}

function updateBranchPhoneValue(bName, pIdx, value) {
  const bCfg = getActiveBranchConfig(bName);
  if (Array.isArray(bCfg.phones) && bCfg.phones[pIdx] !== undefined) {
    bCfg.phones[pIdx] = value;
    markAdminHasChanges();
  }
}

function handleBranchMapEmbedInput(bKey, val) {
  markAdminHasChanges();
  if (!val) return;
  const parsed = parseLatLngFromUrl(val);
  if (parsed) {
    const latEl = document.getElementById(`adm-br-${bKey}-shopLat`);
    const lngEl = document.getElementById(`adm-br-${bKey}-shopLng`);
    if (latEl) latEl.value = parsed.lat;
    if (lngEl) lngEl.value = parsed.lng;
  }
}

function adminDeleteBranch(bName) {
  if ((config.branches || []).length <= 1) {
    showToast("Cannot delete the only remaining branch!", true);
    return;
  }

  showConfirmationModal("Delete Branch", `Are you sure you want to delete branch "${bName}"?`, () => {
    config.branches = config.branches.filter(b => b !== bName);
    if (config.branchOverrides && config.branchOverrides[bName]) {
      delete config.branchOverrides[bName];
    }
    if (config.activeBranch === bName) {
      config.activeBranch = config.branches[0];
    }
    markAdminHasChanges();
    populateAdminFields();
    renderSiteUI();
  });
}

function adminAddBranch() {
  const input = document.getElementById('admin-add-branch-input');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) {
    showToast("Please enter a branch name.", true);
    return;
  }

  if (!Array.isArray(config.branches)) config.branches = [];
  if (config.branches.includes(newName)) {
    showToast("A branch with this name already exists.", true);
    return;
  }

  config.branches.push(newName);
  getActiveBranchConfig(newName); // Initialize defaults
  input.value = '';
  markAdminHasChanges();
  populateAdminFields();
  renderSiteUI();
}

function renderAdminCategoryTags() {
  const sel = document.getElementById('menu-form-type');
  if (!sel) return;

  let html = '';
  (config.customCategories || []).forEach(c => {
    html += `<option value="${escapeHTML(c.key)}">${escapeHTML(c.label)}</option>`;
  });
  sel.innerHTML = html;
}

// --- Dynamic Category Management System (Add / Remove) ---
function renderAdminCategoryManager() {
  const container = document.getElementById('admin-category-list');
  if (!container) return;

  let html = '';
  (config.customCategories || []).forEach(c => {
    html += `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-subtle); padding:6px 12px; border-radius:6px; margin-bottom:6px; border:1px solid var(--border);">
      <span style="font-size:0.85rem; font-weight:600;">${escapeHTML(c.label)} <small style="color:var(--text-muted); font-weight:normal;">(${escapeHTML(c.key)})</small></span>
      <button onclick="adminDeleteCategory('${escapeHTML(c.key)}')" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;" title="Delete Category"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  });

  container.innerHTML = html;
}

function adminAddCategory() {
  const labelInput = document.getElementById('admin-cat-label');
  const keyInput = document.getElementById('admin-cat-key');

  const label = labelInput ? labelInput.value.trim() : '';
  let key = keyInput ? keyInput.value.trim().toLowerCase().replace(/\s+/g, '_') : '';

  if (!label) {
    showToast("Please enter category name.", true);
    return;
  }

  if (!key) {
    key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  if (!Array.isArray(config.customCategories)) config.customCategories = [];
  if (config.customCategories.some(c => c.key === key)) {
    showToast("Category key already exists.", true);
    return;
  }

  config.customCategories.push({ key, label });

  if (labelInput) labelInput.value = '';
  if (keyInput) keyInput.value = '';

  markAdminHasChanges();
  renderAdminCategoryManager();
  renderAdminCategoryTags();
  renderMenu();
  showToast("✓ Food category added successfully!");
}

function adminDeleteCategory(catKey) {
  if ((config.customCategories || []).length <= 1) {
    showToast("At least one food category must remain!", true);
    return;
  }

  showConfirmationModal("Delete Food Category", `Are you sure you want to delete category "${catKey}"?`, () => {
    config.customCategories = (config.customCategories || []).filter(c => c.key !== catKey);
    markAdminHasChanges();
    renderAdminCategoryManager();
    renderAdminCategoryTags();
    renderMenu();
    showToast("✓ Category removed successfully!");
  });
}

function renderMenuBranchCheckboxes() {
  const container = document.getElementById('menu-form-branches-checkboxes');
  if (!container) return;

  let html = `<label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;"><input type="checkbox" value="all" checked class="menu-branch-cb"> All Branches</label>`;
  (config.branches || []).forEach(b => {
    html += `<label style="cursor:pointer; display:inline-flex; align-items:center; gap:4px;"><input type="checkbox" value="${escapeHTML(b)}" class="menu-branch-cb"> ${escapeHTML(b)}</label>`;
  });
  container.innerHTML = html;
}

function renderAdminMenuTable() {
  const tbody = document.getElementById('menu-table-body');
  if (!tbody) return;

  const currentBranchScope = adminSelectedBranch;
  const menuItems = (config.menu || []).filter(item => {
    if (currentBranchScope === 'all') return true;
    const bArr = Array.isArray(item.branches) ? item.branches : ['all'];
    return bArr.includes('all') || bArr.includes(currentBranchScope);
  });

  if (menuItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px;">No menu items found.</td></tr>`;
    return;
  }

  let html = '';
  menuItems.forEach((item, idx) => {
    const bArr = Array.isArray(item.branches) ? item.branches : ['all'];
    const branchLabel = bArr.includes('all') ? 'All Branches' : bArr.join(', ');

    html += `
    <tr>
      <td><input type="checkbox" class="admin-menu-item-cb" value="${item.id}"></td>
      <td>${idx + 1}</td>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td><span class="badge">${escapeHTML(item.type)}</span></td>
      <td>${config.currencySymbol || 'Rs.'}${item.price}</td>
      <td><small style="color:var(--text-muted);">${escapeHTML(branchLabel)}</small></td>
      <td>
        <div style="display:flex; gap:4px;">
          <button onclick="editMenuItem(${item.id})" style="background:#0284c7; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteMenuItem(${item.id})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  });

  tbody.innerHTML = html;
}

function addOrUpdateMenuItem() {
  const nameEl = document.getElementById('menu-form-name');
  const priceEl = document.getElementById('menu-form-price');
  const typeEl = document.getElementById('menu-form-type');
  const descEl = document.getElementById('menu-form-desc');
  const tagEl = document.getElementById('menu-form-tag');
  const imgEl = document.getElementById('menu-form-img');

  const name = nameEl ? nameEl.value.trim() : '';
  const price = priceEl ? parseFloat(priceEl.value) : 0;
  const type = typeEl ? typeEl.value : 'pizza';
  const desc = descEl ? descEl.value.trim() : '';
  const tag = tagEl ? tagEl.value.trim() : '';
  const img = imgEl ? imgEl.value.trim() : '';

  if (!name || isNaN(price)) {
    showToast("Please enter item name and valid price.", true);
    return;
  }

  const branchCbs = document.querySelectorAll('.menu-branch-cb:checked');
  let selectedBranches = [];
  branchCbs.forEach(cb => selectedBranches.push(cb.value));
  if (selectedBranches.length === 0) selectedBranches = ['all'];

  if (editingItemId !== null) {
    const idx = (config.menu || []).findIndex(i => i.id === editingItemId);
    if (idx !== -1) {
      config.menu[idx] = { ...config.menu[idx], name, price, type, desc, tag, img, branches: selectedBranches };
    }
    editingItemId = null;
  } else {
    const newId = Date.now();
    if (!Array.isArray(config.menu)) config.menu = [];
    config.menu.push({ id: newId, name, price, type, desc, tag, img, branches: selectedBranches });
  }

  cancelEditMenuItem();
  markAdminHasChanges();
  renderAdminMenuTable();
  renderMenu();
  showToast("✓ Menu item saved!");
}

function editMenuItem(id) {
  const item = (config.menu || []).find(i => i.id === id);
  if (!item) return;

  editingItemId = id;
  const nameEl = document.getElementById('menu-form-name');
  const priceEl = document.getElementById('menu-form-price');
  const typeEl = document.getElementById('menu-form-type');
  const descEl = document.getElementById('menu-form-desc');
  const tagEl = document.getElementById('menu-form-tag');
  const imgEl = document.getElementById('menu-form-img');
  const cancelBtn = document.getElementById('menu-cancel-btn');

  if (nameEl) nameEl.value = item.name || '';
  if (priceEl) priceEl.value = item.price || 0;
  if (typeEl) typeEl.value = item.type || 'pizza';
  if (descEl) descEl.value = item.desc || '';
  if (tagEl) tagEl.value = item.tag || '';
  if (imgEl) imgEl.value = item.img || '';

  const itemBranches = Array.isArray(item.branches) ? item.branches : ['all'];
  const cbs = document.querySelectorAll('.menu-branch-cb');
  cbs.forEach(cb => {
    cb.checked = itemBranches.includes(cb.value);
  });

  if (cancelBtn) cancelBtn.hidden = false;
}

function cancelEditMenuItem() {
  editingItemId = null;
  const nameEl = document.getElementById('menu-form-name');
  const priceEl = document.getElementById('menu-form-price');
  const descEl = document.getElementById('menu-form-desc');
  const tagEl = document.getElementById('menu-form-tag');
  const imgEl = document.getElementById('menu-form-img');
  const cancelBtn = document.getElementById('menu-cancel-btn');

  if (nameEl) nameEl.value = '';
  if (priceEl) priceEl.value = '';
  if (descEl) descEl.value = '';
  if (tagEl) tagEl.value = '';
  if (imgEl) imgEl.value = '';

  const cbs = document.querySelectorAll('.menu-branch-cb');
  cbs.forEach(cb => { cb.checked = (cb.value === 'all'); });

  if (cancelBtn) cancelBtn.hidden = true;
}

function deleteMenuItem(id) {
  showConfirmationModal("Delete Menu Item", "Are you sure you want to remove this menu item?", () => {
    config.menu = (config.menu || []).filter(i => i.id !== id);
    markAdminHasChanges();
    renderAdminMenuTable();
    renderMenu();
  });
}

function toggleSelectAllMenuItems(checked) {
  const cbs = document.querySelectorAll('.admin-menu-item-cb');
  cbs.forEach(cb => cb.checked = checked);
}

function adminBulkDeleteMenuItems() {
  const checkedCbs = document.querySelectorAll('.admin-menu-item-cb:checked');
  if (checkedCbs.length === 0) {
    showToast("No menu items selected.", true);
    return;
  }

  showConfirmationModal("Delete Selected Menu Items", `Delete ${checkedCbs.length} selected item(s)?`, () => {
    const idsToDelete = Array.from(checkedCbs).map(cb => parseInt(cb.value, 10));
    config.menu = (config.menu || []).filter(i => !idsToDelete.includes(i.id));
    markAdminHasChanges();
    renderAdminMenuTable();
    renderMenu();
    showToast(`✓ Removed ${idsToDelete.length} menu item(s).`);
  });
}

function renderAdminGalleryManager() {
  const container = document.getElementById('admin-gallery-list');
  if (!container) return;

  const images = config.gallery || [];
  if (images.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); width:100%;">No gallery images uploaded yet.</p>`;
    return;
  }

  let html = '';
  images.forEach((imgUrl, idx) => {
    html += `
    <div style="position:relative; width:90px; height:70px; border-radius:6px; overflow:hidden; border:1px solid var(--border);">
      <input type="checkbox" class="admin-gallery-cb" value="${idx}" style="position:absolute; top:4px; left:4px; z-index:5;">
      <img src="${sanitizeUrl(imgUrl)}" style="width:100%; height:100%; object-fit:cover;">
      <button onclick="adminDeleteGalleryImage(${idx})" style="position:absolute; top:4px; right:4px; background:#ef4444; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:0.65rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
    </div>`;
  });

  container.innerHTML = html;
}

function adminAddGalleryImage() {
  const input = document.getElementById('admin-gallery-url');
  if (!input) return;
  const url = input.value.trim();
  if (!url) {
    showToast("Please enter an image URL or upload a file.", true);
    return;
  }

  if (!Array.isArray(config.gallery)) config.gallery = [];
  config.gallery.push(url);
  input.value = '';
  markAdminHasChanges();
  renderAdminGalleryManager();
  renderGallery();
  showToast("✓ Image added to gallery!");
}

function adminDeleteGalleryImage(index) {
  if (Array.isArray(config.gallery) && config.gallery[index] !== undefined) {
    config.gallery.splice(index, 1);
    markAdminHasChanges();
    renderAdminGalleryManager();
    renderGallery();
  }
}

function toggleSelectAllGallery(checked) {
  const cbs = document.querySelectorAll('.admin-gallery-cb');
  cbs.forEach(cb => cb.checked = checked);
}

function adminBulkDeleteGallery() {
  const checkedCbs = document.querySelectorAll('.admin-gallery-cb:checked');
  if (checkedCbs.length === 0) {
    showToast("No gallery images selected.", true);
    return;
  }

  showConfirmationModal("Delete Gallery Images", `Delete ${checkedCbs.length} image(s)?`, () => {
    const indicesToDelete = Array.from(checkedCbs).map(cb => parseInt(cb.value, 10)).sort((a, b) => b - a);
    indicesToDelete.forEach(idx => {
      if (config.gallery[idx] !== undefined) config.gallery.splice(idx, 1);
    });
    markAdminHasChanges();
    renderAdminGalleryManager();
    renderGallery();
    showToast("✓ Selected images deleted.");
  });
}

function renderAdminReviewsList() {
  const container = document.getElementById('admin-reviews-list');
  const filterSel = document.getElementById('admin-review-branch-filter');
  const branches = config.branches || [];

  if (filterSel && filterSel.options.length === 0) {
    let fHtml = '<option value="all">🌟 All Branches</option>';
    branches.forEach(b => {
      fHtml += `<option value="${escapeHTML(b)}">🏢 ${escapeHTML(b)}</option>`;
    });
    filterSel.innerHTML = fHtml;
  }

  if (!container) return;
  const selectedFilter = filterSel ? filterSel.value : 'all';

  const filtered = reviewsList.filter(r => {
    if (selectedFilter === 'all') return true;
    return r.branch === selectedFilter;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); margin:0;">No customer reviews match this filter.</p>`;
    return;
  }

  let html = '';
  filtered.forEach(r => {
    html += `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding:6px 0; font-size:0.8rem;">
      <div style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" class="admin-review-cb" value="${r.id}">
        <div>
          <strong>${escapeHTML(r.name || 'Customer')}</strong> (${'⭐'.repeat(r.rating || 5)})
          <div style="color:var(--text-muted); font-size:0.75rem;">${escapeHTML(r.comment || '')}</div>
        </div>
      </div>
      <button onclick="adminDeleteReview('${r.id}')" style="background:#ef4444; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  });

  container.innerHTML = html;
}

function adminDeleteReview(id) {
  pendingDeletedReviewIds.push(id);
  reviewsList = reviewsList.filter(r => r.id !== id);
  markAdminHasChanges();
  renderAdminReviewsList();
  renderReviewsList();
}

function toggleSelectAllReviews(checked) {
  const cbs = document.querySelectorAll('.admin-review-cb');
  cbs.forEach(cb => cb.checked = checked);
}

function adminBulkDeleteReviews() {
  const checkedCbs = document.querySelectorAll('.admin-review-cb:checked');
  if (checkedCbs.length === 0) {
    showToast("No reviews selected.", true);
    return;
  }

  showConfirmationModal("Delete Reviews", `Delete ${checkedCbs.length} selected review(s)?`, () => {
    checkedCbs.forEach(cb => {
      const id = cb.value;
      pendingDeletedReviewIds.push(id);
      reviewsList = reviewsList.filter(r => String(r.id) !== String(id));
    });
    markAdminHasChanges();
    renderAdminReviewsList();
    renderReviewsList();
    showToast("✓ Selected reviews deleted.");
  });
}

function collectAdminFormValues() {
  const logoInput = document.getElementById('adm-logo-url');
  if (logoInput && logoInput.value.trim()) {
    config.logo = logoInput.value.trim();
  }

  const delMode = document.getElementById('adm-deliveryMode');
  const delFee = document.getElementById('adm-deliveryFee');
  const perKm = document.getElementById('adm-perKmRate');
  const maxKm = document.getElementById('adm-tieredMaxKm');
  const tieredFee = document.getElementById('adm-tieredDeliveryFee');
  const radius = document.getElementById('adm-freeDeliveryRadius');
  const freeMin = document.getElementById('adm-freeDeliveryMin');

  if (delMode) config.deliveryMode = delMode.value;
  if (delFee) config.deliveryFee = parseFloat(delFee.value) || 0;
  if (perKm) config.perKmRate = parseFloat(perKm.value) || 0;
  if (maxKm) config.tieredMaxKm = parseFloat(maxKm.value) || 0;
  if (tieredFee) config.tieredDeliveryFee = parseFloat(tieredFee.value) || 0;
  if (radius) config.freeDeliveryRadius = parseFloat(radius.value) || 0;
  if (freeMin) config.freeDeliveryMin = parseFloat(freeMin.value) || 0;

  (config.branches || []).forEach(bName => {
    const bKey = bName.replace(/[^a-zA-Z0-9]/g, '_');
    const bCfg = getActiveBranchConfig(bName);

    const bannerModeEl = document.getElementById(`adm-br-${bKey}-bannerMode`);
    const bannerTextEl = document.getElementById(`adm-br-${bKey}-bannerText`);
    const mapEmbedEl = document.getElementById(`adm-br-${bKey}-mapEmbed`);
    const directionsEl = document.getElementById(`adm-br-${bKey}-directionsUrl`);
    const timingEl = document.getElementById(`adm-br-${bKey}-timing`);
    const statusModeEl = document.getElementById(`adm-br-${bKey}-statusMode`);
    const latEl = document.getElementById(`adm-br-${bKey}-shopLat`);
    const lngEl = document.getElementById(`adm-br-${bKey}-shopLng`);

    if (bannerModeEl) bCfg.bannerMode = bannerModeEl.value;
    if (bannerTextEl) bCfg.bannerText = bannerTextEl.value;
    if (mapEmbedEl) bCfg.mapEmbed = mapEmbedEl.value;
    if (directionsEl) bCfg.directionsUrl = directionsEl.value;
    if (timingEl) bCfg.timing = timingEl.value;
    if (statusModeEl) bCfg.statusMode = statusModeEl.value;
    if (latEl && latEl.value) bCfg.shopLat = parseFloat(latEl.value);
    if (lngEl && lngEl.value) bCfg.shopLng = parseFloat(lngEl.value);
  });
}

function showLoginModal() {
  const errBox = document.getElementById('login-error-container');
  if (errBox) errBox.style.display = 'none';
  openModal('modal-login');
}

async function performSupabaseLogin() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errBox = document.getElementById('login-error-container');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!email || !password) {
    if (errBox) {
      errBox.innerText = "Please enter email and password.";
      errBox.style.display = 'block';
    }
    return;
  }

  if (!_supabase) {
    if (errBox) {
      errBox.innerText = "Supabase client not initialized.";
      errBox.style.display = 'block';
    }
    return;
  }

  try {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (errBox) {
        errBox.innerText = error.message || "Invalid authentication credentials.";
        errBox.style.display = 'block';
      }
    } else {
      closeModal('modal-login');
      populateAdminFields();
      openModal('modal-admin');
      showToast("✓ Authenticated successfully!");
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = "Authentication error: " + err.message;
      errBox.style.display = 'block';
    }
  }
}

async function logoutSupabase() {
  if (_supabase) {
    try { await _supabase.auth.signOut(); } catch (e) {}
  }
  closeModal('modal-admin');
  showToast("Logged out of Admin Panel.");
}

function closeAdminPanelWithPrompt() {
  if (adminHasUnsavedChanges) {
    showConfirmationModal("Unsaved Changes", "You have unsaved changes. Are you sure you want to exit without saving?", () => {
      adminHasUnsavedChanges = false;
      closeModal('modal-admin');
    });
  } else {
    closeModal('modal-admin');
  }
}

// --- Application Entry Point ---
window.addEventListener('DOMContentLoaded', () => {
  loadConfigFromSupabase();

  const hamburger = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-links');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
});
