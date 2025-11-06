/* ============================================
   CORE ANIMATION MODULE — GSAP + ScrollTrigger + Lenis
   ============================================ */

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Wait for DOM to be painted and fonts to load
 * @param {Element} scope - DOM scope to wait for
 * @returns {Promise} - Resolves when ready
 */
function afterSwapReady(scope = document) {
  return new Promise(async (resolve) => {
    await new Promise(r => requestAnimationFrame(r));
    try { await document.fonts?.ready; } catch (e) {}
    resolve();
  });
}
window.afterSwapReady = afterSwapReady;

// ============================================
// LENIS SCROLL BRIDGE
// ============================================

/**
 * Bridge Lenis smooth scroll with ScrollTrigger
 * Call once to sync smooth scrolling with GSAP animations
 */
function installLenisScrollTriggerBridge() {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (installLenisScrollTriggerBridge._done) return;
  installLenisScrollTriggerBridge._done = true;

  const connect = () => {
    if (!window.lenis) { setTimeout(connect, 50); return; }

    window.gsap.registerPlugin(window.ScrollTrigger);

    // Tell ST to use the page as scroller; delegate to Lenis
    window.ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        return arguments.length
          ? window.lenis.scrollTo(value, { immediate: true })
          : window.pageYOffset;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      }
    });

    // Keep them in sync
    window.lenis.on?.('scroll', window.ScrollTrigger.update);
    window.gsap.ticker.add(() => window.lenis?.raf?.(performance.now()));
    window.ScrollTrigger.addEventListener('refresh', () => window.lenis?.update?.());
    window.ScrollTrigger.refresh();
  };
  connect();
}
window.installLenisScrollTriggerBridge = installLenisScrollTriggerBridge;

// ============================================
// VIDEO MANAGER - CORE UTILITIES
// ============================================
// Copy this entire section to use video functionality in other projects

/**
 * Unified Video Manager
 * Handles all video functionality with common utilities
 * 
 * Usage:
 * 1. Include this VideoManager class
 * 2. Include the specific video modules you need (hover, autoplay, scroll)
 * 3. Call the init functions: initVideoHoverModule(), initAutoplayVideos(), initVideoOnScrollModule()
 */
class VideoManager {
  constructor() {
    this.videos = new Map();
    this.observers = new Map();
    this.timers = new Map();
    this.visibilityHandler = null; // Store visibilitychange handler for cleanup
  }

  // Common video setup
  setupVideo(video, options = {}) {
    video.muted = true;
    video.playsInline = true;
    
    if (options.src && !video.getAttribute('src')) {
      video.setAttribute('src', options.src);
    }
  }

  // Safe video operations
  async playVideo(video) {
    try {
      await video.play();
      return true;
    } catch (error) {
      console.warn('Video play blocked:', error);
      return false;
    }
  }

  pauseVideo(video) {
    try {
      video.pause();
    } catch (error) {
      console.warn('Video pause error:', error);
    }
  }

  // Common video finding logic
  findVideo(wrapper, className = null) {
    if (className) {
      return wrapper.querySelector(className) || wrapper.querySelector('video');
    }
    return wrapper.querySelector('.video-card-hover__video') || 
           wrapper.querySelector('.video-scroll__video') || 
           wrapper.querySelector('video');
  }

  // Get video source
  getVideoSrc(wrapper, video) {
    return (video && video.getAttribute('data-video-src')) || wrapper.getAttribute('data-video-src');
  }

  // Reset video to beginning
  resetVideoTime(video) {
    try {
      video.currentTime = 0;
    } catch (e) {}
  }

  // Unload video safely
  unloadVideo(video) {
    video.removeAttribute('src');
    try {
      video.load();
    } catch (e) {}
  }

  // Clear timer safely
  clearTimer(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  // Set timer safely
  setTimer(key, callback, delay) {
    this.clearTimer(key);
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(key);
    }, delay);
    this.timers.set(key, timer);
  }

  // Check if element is in viewport
  inViewport(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    return r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw;
  }

  // Store observer for cleanup
  addObserver(video, observer) {
    this.observers.set(video, observer);
  }

  // Simple cleanup
  cleanup() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Remove visibilitychange listener if it exists
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

// Global video manager instance
window.videoManager = new VideoManager();

// ============================================
// VIDEO HOVER MODULE
// ============================================
// Copy this section for hover video functionality

/**
 * Initialize video hover functionality
 * Plays videos on hover/touch for elements with data-video-on-hover
 * 
 * HTML Usage:
 * <div data-video-on-hover data-video-src="video.mp4">
 *   <video class="video-card-hover__video"></video>
 * </div>
 */
function initVideoHoverModule() {
  console.log('🎥 Initializing video hover functionality...');
  const wrappers = document.querySelectorAll('[data-video-on-hover]');
  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.videoHoverBound === '1') return;

    const video = window.videoManager.findVideo(wrapper, '.video-card-hover__video');
    const src = window.videoManager.getVideoSrc(wrapper, video);
    if (!video || !src) return;

    window.videoManager.setupVideo(video);

    const timerKey = `hover-${Math.random()}`;

    const onEnter = () => {
      window.videoManager.clearTimer(timerKey);
      if (!video.getAttribute('src')) video.setAttribute('src', src);
      window.videoManager.resetVideoTime(video);
      window.videoManager.playVideo(video);
      wrapper.dataset.videoOnHover = 'active';
    };

    const onLeave = () => {
      window.videoManager.pauseVideo(video);
      wrapper.dataset.videoOnHover = 'not-active';
      window.videoManager.setTimer(timerKey, () => {
        window.videoManager.unloadVideo(video);
      }, 250);
    };
    
    wrapper.addEventListener('mouseenter', onEnter);
    wrapper.addEventListener('mouseleave', onLeave);
    wrapper.addEventListener('touchstart', onEnter, { passive: true });
    wrapper.addEventListener('touchend', onLeave);

    wrapper.dataset.videoHoverBound = '1';
  });
}
window.initVideoHoverModule = initVideoHoverModule;

/**
 * Stop all hover videos
 */
function stopAllHoverVideos() {
  document.querySelectorAll('[data-video-on-hover] video').forEach(v => { 
    window.videoManager.pauseVideo(v);
  });
}
window.stopAllHoverVideos = stopAllHoverVideos;

// ============================================
// VIDEO AUTOPLAY MODULE
// ============================================
// Copy this section for autoplay video functionality

/**
 * Initialize autoplay videos
 * Videos with data-video-autoplay will play when in viewport
 * <div data-video-autoplay>
 *   <video data-video-src="video.mp4"></video>
 * </div>
 */
function initAutoplayVideos() {
  console.log('▶️ Initializing autoplay videos...');
  const vids = document.querySelectorAll('[data-video-autoplay] video, video[data-video-autoplay]');
  vids.forEach(v => {
    window.videoManager.setupVideo(v);

    // Lazy load if using data-video-src
    const ds = v.getAttribute('data-video-src');
    if (ds && !v.getAttribute('src')) v.setAttribute('src', ds);

    if (v.dataset.autoplayBound === '1') return;
    v.dataset.autoplayBound = '1';

    const tryPlay = () => window.videoManager.playVideo(v);

    v.addEventListener('loadeddata', tryPlay, { passive: true });
    v.addEventListener('canplay', tryPlay, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new window.IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) tryPlay();
          else window.videoManager.pauseVideo(v);
        });
      }, { threshold: 0.1 });
      
      io.observe(v);
      // Store observer for cleanup
      window.videoManager.addObserver(v, io);
    } else {
      tryPlay();
    }
  });
}
window.initAutoplayVideos = initAutoplayVideos;

/**
 * Stop all autoplay videos
 */
function stopAllAutoplayVideos() {
  document.querySelectorAll('[data-video-autoplay] video, video[data-video-autoplay]')
    .forEach(v => window.videoManager.pauseVideo(v));
}
window.stopAllAutoplayVideos = stopAllAutoplayVideos;

// ============================================
// VIDEO SCROLL MODULE
// ============================================
/**
 * Preload video on scroll videos during page transition
 * Prevents flash when navigating to pages with videos in view
 */
function preloadVideoOnScroll() {
  // Preload scroll videos
  const wrappers = document.querySelectorAll('[data-video-on-scroll]');
  wrappers.forEach(wrapper => {
    const video = window.videoManager.findVideo(wrapper, '.video-scroll__video');
    if (!video) return;

    window.videoManager.setupVideo(video);

    const src = video.getAttribute('data-video-src');
    if (src && !video.src) {
      video.src = src;
      video.load();
    }
  });

  // Preload autoplay videos
  const autoplayVids = document.querySelectorAll('[data-video-autoplay] video, video[data-video-autoplay]');
  autoplayVids.forEach(video => {
    window.videoManager.setupVideo(video);

    const src = video.getAttribute('data-video-src') || video.getAttribute('src');
    if (src && !video.src) {
      video.src = src;
      video.load();
    }
  });
}
window.preloadVideoOnScroll = preloadVideoOnScroll;

/**
 * Initialize video on scroll functionality
 * Videos with data-video-on-scroll will play when in viewport and pause when out
 * HTML Usage:
 * <div data-video-on-scroll>
 *   <video class="video-scroll__video" data-video-src="video.mp4"></video>
 * </div>
 */
function initVideoOnScrollModule() {
  console.log('📹 Initializing video on scroll functionality...');
  const wrappers = document.querySelectorAll('[data-video-on-scroll]');

  // Helper: play video safely
  const playVideo = (wrapper, video) => {
    if (video.readyState >= 3) {
      window.videoManager.playVideo(video).then(() => wrapper.dataset.state = 'active')
        .catch(err => console.warn('Video play blocked:', err));
    } else {
      const onCanPlay = () => {
        video.removeEventListener('canplay', onCanPlay);
        window.videoManager.playVideo(video).then(() => wrapper.dataset.state = 'active')
          .catch(err => console.warn('Video play blocked:', err));
      };
      video.addEventListener('canplay', onCanPlay, { once: true });
    }
  };

  // Helper: pause video
  const pauseVideo = (wrapper, video) => {
    window.videoManager.pauseVideo(video);
    wrapper.dataset.state = 'inactive';
  };

  wrappers.forEach(wrapper => {
    if (wrapper.dataset.videoScrollBound === '1') return;

    const video = window.videoManager.findVideo(wrapper, '.video-scroll__video');
    if (!video) return;

    // Play/pause observer
    const playIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playVideo(wrapper, video);
        } else {
          pauseVideo(wrapper, video);
        }
      });
    }, { threshold: 0 });

    // Start observing
    playIO.observe(wrapper);
    // Store observer for cleanup (using wrapper as key since that's what we observe)
    window.videoManager.addObserver(wrapper, playIO);

    // Handle videos visible on first load
    if (window.videoManager.inViewport(wrapper)) {
      playVideo(wrapper, video);
    }

    wrapper.dataset.videoScrollBound = '1';
  });

  // Handle tab visibility changes (only add once)
  if (!window.videoManager.visibilityHandler) {
    window.videoManager.visibilityHandler = () => {
      const currentWrappers = document.querySelectorAll('[data-video-on-scroll]');
      if (document.hidden) {
        // Pause all when tab hidden
        currentWrappers.forEach(wrapper => {
          const video = window.videoManager.findVideo(wrapper, '.video-scroll__video');
          if (video) {
            window.videoManager.pauseVideo(video);
            wrapper.dataset.state = 'inactive';
          }
        });
      } else {
        // Resume any video that is in viewport
        currentWrappers.forEach(wrapper => {
          const video = window.videoManager.findVideo(wrapper, '.video-scroll__video');
          if (video && window.videoManager.inViewport(wrapper)) {
            if (video.readyState >= 3) {
              window.videoManager.playVideo(video).then(() => wrapper.dataset.state = 'active')
                .catch(err => console.warn('Video play blocked:', err));
            } else {
              const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                window.videoManager.playVideo(video).then(() => wrapper.dataset.state = 'active')
                  .catch(err => console.warn('Video play blocked:', err));
              };
              video.addEventListener('canplay', onCanPlay, { once: true });
            }
          }
        });
      }
    };
    document.addEventListener('visibilitychange', window.videoManager.visibilityHandler);
  }
}
window.initVideoOnScrollModule = initVideoOnScrollModule;

/**
 * Stop all video on scroll videos
 */
function stopAllVideoOnScroll() {
  document.querySelectorAll('[data-video-on-scroll] video').forEach(v => { 
    window.videoManager.pauseVideo(v);
  });
}
window.stopAllVideoOnScroll = stopAllVideoOnScroll;


// ============================================
// LENIS INITIALIZATION
// ============================================

/**
 * Initialize Lenis smooth scrolling
 * autoRaf: false because we use GSAP ticker (via installLenisScrollTriggerBridge)
 * This prevents double RAF loops and reduces CPU usage
 */
window.lenis = new window.Lenis({
  autoRaf: false,
  lerp: 0.25,
  smoothWheel: true,
  smoothTouch: true
});

// If stop-scroll is active (from loader in head), keep Lenis stopped
if (document.documentElement.classList.contains('stop-scroll')) {
  window.lenis.stop();
}

// Configure ScrollTrigger default configuration for Webflow interactions
if (window.ScrollTrigger) {
  ScrollTrigger.defaults({
    scroller: document.body,
    preventOverlaps: true
  });
}

// Helper function to refresh ScrollTrigger when needed
function refreshScrollTrigger() {
  if (window.ScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Fix widow words in paragraphs (desktop only)
 * Prevents single words on last line of paragraphs
 */
function runWidowFix() {
  if (!window.matchMedia('(min-width: 768px)').matches) return;
  const paragraphs = document.querySelectorAll('p');
  paragraphs.forEach(p => {
    let html = p.innerHTML;
    html = html.replace(/\s+([^\s<]+)(\s*(<\/[^>]+>)*)$/, '&nbsp;$1$2'); // keep last 2 words
    html = html.replace(/([.!?]) (\w+)\s+(\w+)/g, '$1 $2&nbsp;$3');      // sentence start
    p.innerHTML = html;
  });
}
window.runWidowFix = runWidowFix;
document.addEventListener('DOMContentLoaded', runWidowFix);


/**
 * Copy text functionality
 * Copies text content in lowercase when clicking elements with .copy-text class
 */
document.addEventListener('click', async (e) => {
  const wrapper = e.target.closest('.copy-text');
  if (!wrapper) return;

  const text = (wrapper.innerText || wrapper.textContent || '')
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim()
    .toLowerCase();       // force lowercase

  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    // Optionally, show a UI feedback here
    // console.log(`Copied: ${text}`);
  } catch {
    // fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
});

/**
 * Update CET time in footer
 * Updates time display every second with Copenhagen timezone
 */
function updateCETTime() {
  const now = new Date();

  // Get CET time (Copenhagen)
  const cet = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Copenhagen" }));

  let hours = cet.getHours();
  let minutes = cet.getMinutes();

  // Determine AM/PM in 24-hour mode
  const ampm = hours >= 12 ? "PM" : "AM";

  // Always pad hours and minutes
  const hoursStr = hours < 10 ? "0" + hours : hours;
  const minutesStr = minutes < 10 ? "0" + minutes : minutes;

  // Final format: 00:15 AM, 08:00 AM, 14:05 PM
  const timeString = `${hoursStr}:${minutesStr} ${ampm}`;

  const cetElem = document.getElementById("cet-time");
  if (cetElem) cetElem.textContent = timeString;
}
updateCETTime();
setInterval(updateCETTime, 1000);

// ============================================
// SCROLL BEHAVIOR
// ============================================

/**
 * Scroll to top on page refresh
 * Prevents browser from restoring scroll position
 * Note: Actual scroll happens during loader animation to prevent flash
 */
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * Scroll to top button functionality
 * Smooth scroll to top using GSAP when clicking scroll-top button
 */
document.addEventListener("DOMContentLoaded", function () {
  const scrollBtn = document.getElementById("scroll-top");

  if (scrollBtn && window.gsap && window.gsap.to) {
    scrollBtn.addEventListener("click", function () {
      window.gsap.to(window, {
        duration: 1,            // time in seconds
        scrollTo: { y: 0 },     // scroll target
        ease: "power2.out"    // easing
      });
    });
  }
});


// ============================================
// DYNAMIC SCRIPT & CSS LOADING SYSTEM
// ============================================
// Essential system for loading external libraries and executing custom scripts
// during Barba.js transitions. Supports:
// - data-barba-load: Load external CDN libraries
// - data-barba-init: Execute custom scripts
// - data-barba-css: Inject custom CSS
// ============================================

/**
 * Load external script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => {
      console.error(`Failed to load script: ${src}`);
      reject();
    };
    document.head.appendChild(script);
  });
}

/**
 * Load external CSS dynamically
 */
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => {
      console.error(`Failed to load CSS: ${href}`);
      reject();
    };
    document.head.appendChild(link);
  });
}

/**
 * Load scripts and CSS from HTML content
 */
async function loadAssetsFromHTML(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Load CSS first
  const cssLinks = doc.querySelectorAll('link[href][data-barba-load]');
  console.log(`🎨 Loaded ${cssLinks.length} external CSS libraries`);
  for (const link of cssLinks) {
    await loadCSS(link.href);
  }
  
  // Then load scripts
  const scripts = doc.querySelectorAll('script[src][data-barba-load]');
  console.log(`📦 Loaded ${scripts.length} external libraries`);
  for (const script of scripts) {
    await loadScript(script.src);
  }
}

/**
 * Instance Registry for automatic cleanup
 * Tracks and manages all page-specific instances
 */
window.instanceRegistry = {
  instances: new Map(),
  initializedScripts: new Set(),
  
  register(name, instance, destroyMethod = 'destroy') {
    this.instances.set(name, {
      instance,
      destroyMethod,
      created: Date.now()
    });
    console.log(`📝 Registered instance: ${name}`);
  },
  
  isScriptInitialized(scriptId) {
    return this.initializedScripts.has(scriptId);
  },
  
  markScriptInitialized(scriptId) {
    this.initializedScripts.add(scriptId);
    console.log(`🔒 Marked script as initialized: ${scriptId}`);
  },
  
  destroyAll() {
    console.log(`🧹 Destroying ${this.instances.size} registered instances`);
    
    for (const [name, data] of this.instances) {
      try {
        if (data.instance && typeof data.instance[data.destroyMethod] === 'function') {
          data.instance[data.destroyMethod]();
          console.log(`✅ Destroyed: ${name}`);
        }
      } catch (error) {
        console.error(`❌ Error destroying ${name}:`, error);
      }
    }
    
    this.instances.clear();
    
    // Reset all initialization flags for page transitions
    this.initializedScripts.clear();
    // Reset specific script flags
    window.macyInitialized = false;
    window.reelOverlayInitialized = false;
    console.log(`🔄 Reset all script initialization flags`);
  }
};

/**
 * Execute custom scripts by data attribute
 * Enhanced version with automatic double-execution prevention
 * Looks for scripts with data-barba-init or data-barba-destroy attributes
 * Can extract scripts from HTML string or current document
 */
function executeCustomScripts(action = 'init', htmlString = null) {
  const attribute = action === 'init' ? 'data-barba-init' : 'data-barba-destroy';
  let scripts = [];
  
  if (htmlString) {
    // Extract scripts from HTML string (for page transitions)
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    scripts = Array.from(doc.querySelectorAll(`script[${attribute}]`));
  } else {
    // Use current document (for first page load)
    scripts = Array.from(document.querySelectorAll(`script[${attribute}]`));
  }
  
  console.log(`📦 Executing ${scripts.length} custom scripts`);
  
  scripts.forEach((script, index) => {
    // Simple ID generation: action + index + first 20 chars of content
    const content = script.textContent || script.innerText || '';
    const scriptId = `${action}_${index}_${content.slice(0, 20).replace(/\s/g, '')}`;
    
    // Check if script is already initialized
    if (window.instanceRegistry.isScriptInitialized(scriptId)) {
      console.log(`⏭️ Skipping already initialized script: ${scriptId}`);
      return;
    }
    
    // Mark script as initialized
    window.instanceRegistry.markScriptInitialized(scriptId);
    
    try {
      // Execute the script content
      const scriptContent = script.textContent || script.innerText;
      if (scriptContent.trim()) {
        // Create a new script element to execute in global scope
        const newScript = document.createElement('script');
        
        // Wrap script content to handle missing destroy methods
        const wrappedScript = `
          try {
            ${scriptContent}
          } catch (error) {
            if (error.message && error.message.includes('destroy is not a function')) {
              console.warn('Destroy method not available - skipping cleanup');
            } else {
              throw error;
            }
          }
        `;
        
        newScript.textContent = wrappedScript;
        document.head.appendChild(newScript);
        document.head.removeChild(newScript);
        console.log(`✅ Executed script: ${scriptId}`);
      }
    } catch (error) {
      console.error(`❌ Error executing script: ${scriptId}`, error);
    }
  });
}

/**
 * Extract and inject custom CSS by data attribute
 * Looks for style tags with data-barba-css attribute
 */
function executeCustomCSS(htmlString = null) {
  let styles = [];
  
  if (htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    styles = Array.from(doc.querySelectorAll('style[data-barba-css]'));
  } else {
    styles = Array.from(document.querySelectorAll('style[data-barba-css]'));
  }
  
  let injectedCount = 0;
  
  styles.forEach((style) => {
    try {
      const cssContent = style.textContent || style.innerText;
      if (cssContent.trim()) {
        const newStyle = document.createElement('style');
        newStyle.textContent = cssContent;
        newStyle.setAttribute('data-barba-injected', 'true');
        document.head.appendChild(newStyle);
        injectedCount++;
      }
    } catch (error) {
      console.error('Failed to inject CSS style:', error);
    }
  });
  
  if (injectedCount > 0) {
    console.log(`🎨 Loaded ${injectedCount} custom CSS style${injectedCount > 1 ? 's' : ''}`);
  }
}

/**
 * Remove injected CSS styles
 */
function removeCustomCSS() {
  const injectedStyles = document.querySelectorAll('style[data-barba-injected="true"]');
  injectedStyles.forEach((style) => style.remove());
}

// Make essential functions globally available
window.loadAssetsFromHTML = loadAssetsFromHTML;
window.executeCustomScripts = executeCustomScripts;
window.executeCustomCSS = executeCustomCSS;
window.removeCustomCSS = removeCustomCSS;

// ============================================
// BARBA.JS PAGE TRANSITIONS
// ============================================
//
// Handles smooth page transitions with automatic script/CSS loading.
// Scripts are loaded BEFORE transitions to prevent layout shift.
// CSS and scripts are destroyed AFTER transitions complete.
//
// ============================================

/**
 * Barba.js page transition system
 * Features:
 * - Overlay: bottom-up cover → top-up reveal
 * - Syncs <html data-wf-page> and <body class> from next page
 * - Primes [data-load-fx] BEFORE reveal (no flash)
 * - Runs load + scroll FX AFTER reveal (and on first load)
 * - Stops/starts Lenis; calls video + widow modules
 */
(function initBarbaOnce() {
  if (window.__BARBA_INIT__) return;
  window.__BARBA_INIT__ = true;

  // Allowed hosts for internal navigation
  const INTERNAL_HOSTS = [
    location.host,
    'studioprimal02.webflow.io',
    'www.studioprimal.com',
    'studioprimal.com'
  ];

  /**
   * Re-initialize Webflow runtime for click/hover interactions
   */
  function reinitIXStable() {
    try {
      window.Webflow?.destroy();
      window.Webflow?.ready?.();
      window.Webflow?.require?.('ix2').init();
      setTimeout(() => { try { window.Webflow?.require('ix2').init(); } catch (e) {} }, 0);
    } catch (e) {
      console.error('Webflow reinit error:', e);
    }
  }

  /**
   * Sync HTML and body attributes from next page
   * Pulls data-wf-page and body class from HTML string
   * @param {string} nextHTMLString - HTML content of next page
   */
  function syncHtmlAndBodyFromHTML(nextHTMLString) {
    if (!nextHTMLString) return;
    const htmlTag = nextHTMLString.match(/<html[^>]*>/i)?.[0];
    const wfPage = htmlTag && htmlTag.match(/data-wf-page="([^"]+)"/i)?.[1];
    if (wfPage) document.documentElement.setAttribute('data-wf-page', wfPage);
    
    const bodyClass = nextHTMLString.match(/<body[^>]*class="([^"]*)"/i)?.[1];
    if (typeof bodyClass === 'string') {
      document.body.className = bodyClass;
    }
  }

  /**
   * Ensure HTML and body are synced from next page
   * Fetches HTML if not already available
   * @param {Object} next - Next page object from Barba
   */
  async function ensureSyncHtmlBody(next) {
    let html = next?.html;
    if (!html && next?.url?.href) {
      try { html = await fetch(next.url.href, { credentials: 'include' }).then(r => r.text()); } catch (e) {}
    }
    syncHtmlAndBodyFromHTML(html);
  }

  // ============================================
  // TRANSITION OVERLAY FUNCTIONS
  // ============================================

  // Transition state management
  let isTransitioning = false;
  let pendingNavigation = null;
  let barbaInitialized = false;
  let startCalled = false; // Prevent multiple start() calls

  // Easing configuration - change these to update all animations
  const COVER_EASE = 'power4.inOut';  // Easing for exit/cover animations
  const REVEAL_EASE = 'Expo.Out';   // Easing for enter/reveal animations

  /**
   * Calculate dynamic transform origin based on viewport center
   * Returns transform origin as percentage string (e.g., "50% 30%")
   * @param {Element} element - The element to calculate transform origin for
   * @returns {string} - Transform origin as percentage (e.g., "50% 30%")
   */
  function calculateViewportCenterTransformOrigin(element) {
    if (!element) return 'center center';
    
    const rect = element.getBoundingClientRect();
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;
    
    // Calculate intersection point between element and viewport center
    const intersectionX = Math.max(0, Math.min(rect.width, viewportCenterX - rect.left));
    const intersectionY = Math.max(0, Math.min(rect.height, viewportCenterY - rect.top));
    
    // Convert to percentage
    const originX = (intersectionX / rect.width) * 100;
    const originY = (intersectionY / rect.height) * 100;
    
    return `${originX}% ${originY}%`;
  }

  /**
   * Trigger a same-page transition for visual consistency
   * Runs the exit animation then immediately the enter animation
   */
  async function triggerSamePageTransition() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    const container = document.querySelector('[data-barba="container"]');
    
    try {
      // Stop Lenis and disable scroll during transition
      window.lenis?.stop();
      document.body.style.overflow = 'hidden';
      
      // Run exit animation
      await coverFromBottom(container);
      
      // Scroll to top while overlay is covering
      window.scrollTo(0, 0);
      
      // Small delay to feel natural
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Run enter animation
      await revealToTop(container);
      
      // Re-enable scroll and restart Lenis
      document.body.style.overflow = '';
      window.lenis?.start();
      
    } catch (error) {
      console.warn('Same-page transition failed:', error);
      // Ensure scroll is re-enabled even if error occurs
      document.body.style.overflow = '';
      window.lenis?.start();
    } finally {
      isTransitioning = false;
    }
  }

  /**
   * Cover screen from bottom (leave transition)
   * Animates current Barba container out with fade and upward movement
   */
  const coverFromBottom = async (currentContainer = null) => {
    const container = currentContainer || document.querySelector('[data-barba="container"]');
    const footer = document.getElementById('site-footer');
    if (!container) return;
    
    const tl = window.gsap.timeline();
    
    // Animate current container out (blur + move up + scale down) if it exists
    if (container) {
      // Set dynamic transform origin based on viewport center
      const dynamicOrigin = calculateViewportCenterTransformOrigin(container);
      window.gsap.set(container, { transformOrigin: dynamicOrigin });
      
      // Disable pointer events during transition
      container.style.pointerEvents = 'none';
      
      // Separate animations for different easing and timing
      tl.to(container, { 
        opacity: 0, // Fade out
        duration: 0.6, 
        ease: COVER_EASE 
      }, 0)
      .to(container, { 
        filter: 'blur(10px)', // Add blur effect
        duration: 0.4, 
        ease: COVER_EASE 
      }, 0) // Slight delay for blur
      .to(container, { 
        scale: 0.95, // Scale down slightly
        duration: 0.6, 
        ease: COVER_EASE 
      }, 0)
      .to(container, { 
        y: '-1rem', 
        duration: 0.6, 
        ease: COVER_EASE 
      }, 0);
    }
    
    // Animate footer out with opacity and blur (no scale)
    if (footer) {
      tl.to(footer, { 
        opacity: 0, // Fade out
        duration: 0.6, 
        ease: COVER_EASE 
      }, 0)
      .to(footer, { 
        filter: 'blur(10px)', // Add blur effect
        duration: 0.4, 
        ease: COVER_EASE 
      }, 0);
    }
    
    await tl;
  };

  /**
   * Reveal screen to top (enter transition)
   * Animates new Barba container in with fade and downward movement
   */
  const revealToTop = async (nextContainer = null) => {
    const container = nextContainer || document.querySelector('[data-barba="container"]');
    const footer = document.getElementById('site-footer');
    if (!container) return;
    
    // Set initial state for new container
    const dynamicOrigin = calculateViewportCenterTransformOrigin(container);
    window.gsap.set(container, { 
      visibility: 'visible',
      opacity: 0,
      y: '-1rem',
      filter: 'blur(10px)',
      scale: 0.95,
      transformOrigin: dynamicOrigin
    });
    
    container.style.pointerEvents = 'none';
    
    // Set initial state for footer
    if (footer) {
      window.gsap.set(footer, { 
        opacity: 0,
        filter: 'blur(10px)'
      });
    }
    
    // Create timeline for synchronized animations
    const tl = window.gsap.timeline();
    
    // Animate new container in
    tl.to(container, { 
      opacity: 1,
      duration: 0.6, 
      ease: REVEAL_EASE
    }, 0)
    .to(container, { 
      filter: 'blur(0px)',
      duration: 0.4, 
      ease: REVEAL_EASE 
    }, 0.1)
    .to(container, { 
      scale: 1,
      duration: 0.6, 
      ease: REVEAL_EASE 
    }, 0)
    .to(container, { 
      y: '0rem', 
      duration: 0.6, 
      ease: REVEAL_EASE 
    }, 0)
    .call(() => {
      container.style.pointerEvents = '';
    });
    
    // Animate footer in with opacity and blur (no scale)
    if (footer) {
      tl.to(footer, { 
        opacity: 1,
        duration: 0.6, 
        ease: REVEAL_EASE
      }, 0)
      .to(footer, { 
        filter: 'blur(0px)',
        duration: 0.4, 
        ease: REVEAL_EASE 
      }, 0.1);
    }
    
    await tl;
  };
  
  // Export for use in page loader
  window.revealToTop = revealToTop;

  /**
   * Reset transition state and ensure clean initialization
   */
  function resetTransitionState() {
    isTransitioning = false;
    pendingNavigation = null;
    document.body.style.overflow = '';
    window.lenis?.start();
    
    const container = document.querySelector('[data-barba="container"]');
    if (container) container.style.pointerEvents = '';
  }

  /**
   * Initialize Barba.js with page transition configuration
   */
function start() {
  if (startCalled) return;
  if (!window.barba || !window.gsap) return setTimeout(start, 50);
  
  startCalled = true;
  // Initialize Barba.js page transitions

    // Prevent browser from automatically restoring scroll positions
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Queue browser back/forward navigation during transitions
    window.addEventListener('popstate', (e) => {
      if (isTransitioning && !pendingNavigation) {
        // Block Barba from handling this and queue it
        e.stopImmediatePropagation();
        e.preventDefault();
        
        pendingNavigation = {
          url: window.location.href,
          hash: null,
          isSpecial: false
        };
        console.log('⏸️ Browser back/forward queued - transition in progress');
      }
    }, true); // Capture phase to intercept before Barba

    // Add scroll lock styles for transitions
    if (!document.getElementById('barba-scroll-lock-styles')) {
      const style = document.createElement('style');
      style.id = 'barba-scroll-lock-styles';
      style.textContent = `
        html.barba-transitioning {
          overflow: hidden !important;
        }
        html.barba-transitioning body {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Reset state before initializing
    resetTransitionState();

    // Prevent reinitialization on page restore from cache
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        console.log('📄 Page restored from cache');
      }
    });

    try { window.barba.destroy(); } catch (e) {}
    
    // Manually intercept clicks and trigger Barba
    // Prevents clicks during transitions to avoid interruption
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href') || '';
      const isSpecialNavButton = link.hasAttribute('special-nav-button');
      
      // Handle special nav button with hash
      if (isSpecialNavButton && href.includes('#')) {
        e.preventDefault();
        e.stopPropagation();
        
        window.closeMessageOverlay?.();
        
        const linkUrl = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        // Same page: smooth scroll
        if (linkUrl.pathname === currentUrl.pathname) {
          window.history.replaceState(null, '', link.href);
          const targetElement = document.querySelector(linkUrl.hash);
          if (targetElement && window.lenis) {
            window.lenis.scrollTo(targetElement, { offset: 0, duration: 1.2 });
          }
          return;
        }
        
        // Different page: store hash before transition and mark as special navigation
        window.barbaNavigationHash = linkUrl.hash;
        window.barbaSpecialNavButton = true; // Flag for theme switching
        sessionStorage.setItem('specialNavButton', 'true'); // For <head> theme script
        
        if (isTransitioning) {
          // Store URL and flags for queued navigation
          pendingNavigation = {
            url: link.href,
            hash: linkUrl.hash,
            isSpecial: true
          };
          return;
        }
        
        window.barba?.go?.(link.href);
        return;
      }
      
      // Only handle internal page links
      if (href.startsWith('/') && !href.startsWith('/#')) {
        e.preventDefault();
        e.stopPropagation();
        
        // If transition is in progress, queue the navigation
        if (isTransitioning) {
          pendingNavigation = {
            url: link.href,
            hash: null,
            isSpecial: false
          };
          console.log('⏸️ Transition in progress - navigation queued');
          return;
        }
        
        if (window.barba && window.barba.go) {
          window.barba.go(link.href);
        } else {
          window.location.href = link.href;
        }
      }
    }, true);

    window.barba.init({
      links: 'a[href]:not([target="_blank"])',
      prevent: ({ el }) => {
        if (!el || !el.href) return true;
        
        const href = el.getAttribute('href') || '';
        const isHash = href.startsWith('#') || href.includes('#');
        const isDownload = el.hasAttribute('download');
        const isPrevent = el.hasAttribute('data-barba-prevent');
        const isRelative = href.startsWith('/');
        
        // Allow special nav button even with hash
        if (el.hasAttribute('special-nav-button') && isHash) return false;
        
        let isAllowedHost = false;
        if (!isRelative) { 
          try { 
            isAllowedHost = INTERNAL_HOSTS.includes(new URL(el.href).host); 
          } catch (e) {}
        }
        
        return (!isRelative && !isAllowedHost) || isHash || isDownload || isPrevent;
      },
      
      requestError: (trigger, action, url, response) => { 
        console.error('❌ Barba request error:', url);
        barbaInitialized = true; 
      },
      
      debug: false,
      preventRunning: true,
      timeout: 10000,


      transitions: [{
        name: 'overlay-swap-clean',

        async leave({ current }) {
          isTransitioning = true;
          window.lenis?.stop();
          document.documentElement.classList.add('barba-transitioning');
          
          // Lock scroll position to prevent browser history restoration during animation
          const lockedY = window.scrollY;
          const scrollLock = () => window.scrollY !== lockedY && window.scrollTo(0, lockedY);
          window.addEventListener('scroll', scrollLock, { passive: true });
          window.barbaScrollLockCleanup = () => window.removeEventListener('scroll', scrollLock);
          
          window.closeMessageOverlay?.();
          window.stopAllHoverVideos?.();
          window.stopAllAutoplayVideos?.();
          window.stopAllVideoOnScroll?.();
          window.videoManager?.cleanup();
          window.cleanupPageLibraries?.();
          
          await coverFromBottom(current?.container);
        },

        async afterLeave({ current }) {
          // Remove scroll lock and hide old container
          window.barbaScrollLockCleanup?.();
          if (current?.container && window.gsap) {
            // Clear transforms that break position: fixed from both wrapper and container
            const wrapper = document.querySelector('[data-barba="wrapper"]');
            if (wrapper) {
              window.gsap.set(wrapper, { 
                clearProps: 'filter,scale,y,transform,transformOrigin,will-change'
              });
            }
            window.gsap.set(current.container, { 
              display: 'none',
              clearProps: 'filter,scale,y,transform,transformOrigin,will-change'
            });
          }
          
          // Clear footer transforms
          const footer = document.getElementById('site-footer');
          if (footer && window.gsap) {
            window.gsap.set(footer, { 
              clearProps: 'filter,opacity,transform,transformOrigin,will-change'
            });
          }
          
          // Scroll to top (invisible while page is covered) unless hash navigation
          if (!window.barbaNavigationHash) window.scrollTo(0, 0);
          
          // Kill all ScrollTrigger instances before page transition
          // They will be recreated on the new page
          if (window.ScrollTrigger && typeof window.ScrollTrigger.killAll === 'function') {
            try {
              window.ScrollTrigger.killAll();
            } catch (e) {
              console.warn('ScrollTrigger cleanup error:', e);
            }
          }
          
          window.cleanupThemeSwitching?.();
          
          // Automatic cleanup of all registered instances
          window.instanceRegistry.destroyAll();
          
          // Execute destroy scripts (for any manual cleanup)
          window.executeCustomScripts?.('destroy');
          window.removeCustomCSS?.();
        },

        async beforeEnter({ next, trigger }) {
          if (!window.barbaNavigationHash) {
            window.barbaNavigationHash = (!trigger && window.location.hash) || null;
          }
          
          await ensureSyncHtmlBody(next);
          
          // Set theme before content becomes visible (prevents flash)
          window.setInitialTheme?.();
          
          if (next?.container && window.gsap) {
            // Keep container hidden until reveal animation starts
            window.gsap.set(next.container, { 
              display: 'block',
              opacity: 0,
              visibility: 'hidden'
            });
          }
          
          // Set initial state for footer immediately
          // This prevents it from being briefly visible before the transition
          const footer = document.getElementById('site-footer');
          if (footer && window.gsap) {
            window.gsap.set(footer, { 
              opacity: 0,
              filter: 'blur(10px)'
            });
          }

          await afterSwapReady(next?.container);
          await new Promise(r => requestAnimationFrame(r));
          window.preloadVideoOnScroll?.();
          
          try {
            const response = await fetch(window.location.href);
            const html = await response.text();
            await window.loadAssetsFromHTML?.(html);
            await window.executeCustomCSS?.(html);
            
            // Add small delay for page transitions to ensure DOM is ready
            await new Promise(r => setTimeout(r, 50));
            await window.executeCustomScripts?.('init', html);
          } catch (error) {
            window.executeCustomCSS?.();
            await new Promise(r => setTimeout(r, 50));
            window.executeCustomScripts?.('init');
          }
          
          // Run widow fix before content is revealed to prevent flash
          window.runWidowFix?.();
        },

        async enter({ next, trigger }) {
          const hash = window.barbaNavigationHash;
          
          // Handle hash navigation (scroll to section)
          if (hash) {
            window.history.replaceState(null, '', window.location.pathname + hash);
            document.querySelector(hash)?.scrollIntoView({ behavior: 'instant', block: 'start' });
            void document.body.offsetHeight;
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            
            // Update theme based on actual scroll position after hash navigation
            const trigger = document.querySelector('[light-mode-trigger]');
            if (trigger) {
              const rect = trigger.getBoundingClientRect();
              const isTriggerInViewport = rect.top < window.innerHeight && rect.bottom > 0;
              applyTheme(isTriggerInViewport);
            }
          }
          
          window.barbaNavigationHash = null;
          await revealToTop(next?.container);
          
          // Unlock scroll and restart Lenis
          document.documentElement.classList.remove('barba-transitioning');
          window.lenis?.start();
          isTransitioning = false;
          
          // Handle pending navigation and restore flags
          if (pendingNavigation) {
            const pending = pendingNavigation;
            pendingNavigation = null;
            
            // Restore flags before executing queued navigation
            if (pending.hash) window.barbaNavigationHash = pending.hash;
            if (pending.isSpecial) window.barbaSpecialNavButton = true;
            
            setTimeout(() => window.barba.go(pending.url), 100);
          }
        },

        async after({ next }) {
          reinitIXStable();
          installLenisScrollTriggerBridge();

          // Clear any lingering transforms on both wrapper and container that break position: fixed
          if (window.gsap) {
            const wrapper = document.querySelector('[data-barba="wrapper"]');
            if (wrapper) {
              window.gsap.set(wrapper, { 
                clearProps: 'filter,scale,y,transform,transformOrigin,will-change'
              });
            }
            if (next?.container) {
              window.gsap.set(next.container, { 
                clearProps: 'filter,scale,y,transform,transformOrigin,will-change'
              });
            }
            
            // Clear footer transforms
            const footer = document.getElementById('site-footer');
            if (footer) {
              window.gsap.set(footer, { 
                clearProps: 'filter,opacity,transform,transformOrigin,will-change'
              });
            }
          }

          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.initVideoOnScrollModule?.();
          window.initMessageToggle?.();
          window.reinitializePageLibraries?.(); // Reinitialize page-specific libraries
          
          // Simple script reinitialization - the standard Barba.js approach
          await window.reinitializeScripts?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
          
          // Set up theme observer immediately
          window.initThemeSwitching?.();
          
          // Ensure everything is re-enabled (failsafe)
          document.body.style.overflow = '';
          document.body.style.pointerEvents = '';
          window.lenis?.start();
          
          const container = next?.container || document.querySelector('[data-barba="container"]');
          if (container) container.style.pointerEvents = '';
          
          isTransitioning = false;
          barbaInitialized = true;
        },

        async once({ next }) {
          await ensureSyncHtmlBody(next);
          await afterSwapReady(next?.container);
          
          // Preload videos on initial page load
          window.preloadVideoOnScroll?.();
          
          reinitIXStable();
          installLenisScrollTriggerBridge();

          // Reveal content with failsafe
          if (window.gsap) {
            document.documentElement.classList.remove('gsap-not-found');
            
            try {
              const initialContainer = document.querySelector('[data-barba="container"][data-prevent-flicker="true"]');
              if (initialContainer) {
                window.gsap.set(initialContainer, {
                  opacity: 1,
                  y: '0rem',
                  filter: 'blur(0px)',
                  scale: 1,
                  visibility: 'visible'
                });
              }
              
              // Ensure footer is visible on initial load
              const footer = document.getElementById('site-footer');
              if (footer) {
                window.gsap.set(footer, {
                  opacity: 1,
                  filter: 'blur(0px)'
                });
              }
            } catch (error) {
              console.error('❌ GSAP reveal failed in once hook, showing content anyway:', error);
              // Fallback: show content immediately
              const containers = document.querySelectorAll('[data-prevent-flicker="true"]');
              containers.forEach(c => {
                c.style.visibility = 'visible';
                c.style.opacity = '1';
              });
              
              // Fallback for footer
              const footer = document.getElementById('site-footer');
              if (footer) {
                footer.style.opacity = '1';
                footer.style.filter = 'blur(0px)';
              }
            }
          }

          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.initVideoOnScrollModule?.();
          window.initThemeSwitching?.(); // Initialize theme switching on first load
          window.initializePageLibraries?.(); // Initialize page-specific libraries on first load
          
          // Run widow fix after all content is ready
          window.runWidowFix?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
          
          resetTransitionState();
          barbaInitialized = true;
        }
      }]
    });

    barbaInitialized = true;
    
    try { window.barba.prefetch.init(); } catch (e) {}
  }

  // ============================================
  // FAILSAFE: Ensure content always shows
  // ============================================
  
  /**
   * Emergency failsafe: Show content after timeout regardless of GSAP/Barba status
   * This prevents content from staying hidden if scripts fail to load
   */
  setTimeout(() => {
    const hiddenContainers = document.querySelectorAll('[data-prevent-flicker="true"]');
    hiddenContainers.forEach(container => {
      if (window.getComputedStyle(container).visibility === 'hidden') {
        console.warn('⚠️ Failsafe triggered: Forcing content visibility');
        container.style.visibility = 'visible';
        container.style.opacity = '1';
      }
    });
  }, 3000); // 3 second failsafe timeout

  // Mark GSAP as found for flicker prevention CSS and handle initial page load
  if (window.gsap) {
    document.documentElement.classList.remove('gsap-not-found');
    
    try {
      // Show content on initial page load (no transition needed)
      const initialContainer = document.querySelector('[data-barba="container"][data-prevent-flicker="true"]');
      if (initialContainer) {
        // Set up initial page without transition
        window.gsap.set(initialContainer, {
          opacity: 1,
          y: '0rem',
          filter: 'blur(0px)',
          scale: 1,
          visibility: 'visible'
        });
      }
      
      // Ensure footer is visible on initial load
      const footer = document.getElementById('site-footer');
      if (footer) {
        window.gsap.set(footer, {
          opacity: 1,
          filter: 'blur(0px)'
        });
      }
      
      // Ensure initial state is set
      resetTransitionState();
    } catch (error) {
      console.error('❌ GSAP reveal failed, showing content anyway:', error);
      // Fallback: show content immediately
      const containers = document.querySelectorAll('[data-prevent-flicker="true"]');
      containers.forEach(c => {
        c.style.visibility = 'visible';
        c.style.opacity = '1';
      });
      
      // Fallback for footer
      const footer = document.getElementById('site-footer');
      if (footer) {
        footer.style.opacity = '1';
        footer.style.filter = 'blur(0px)';
      }
    }
  } else {
    document.documentElement.classList.add('gsap-not-found');
    console.warn('⚠️ GSAP not found - content will show via CSS fallback');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

// Animation timing constants
const MESSAGE_TIMING = {
  BLUR_DELAY: 400,
  WRAPPER_DELAY: 600
};

/**
 * Initialize message toggle functionality
 * Simplified version with cleaner event handling
 */
function initMessageToggle() {
  // Wait for Webflow
  if (!window.Webflow) {
    setTimeout(initMessageToggle, 100);
    return;
  }

  const elements = {
    toggleButton: document.querySelector('.nav-button.is--toggle'),
    overlayWrapper: document.querySelector('.message-overlay_wrapper'),
    messageBlur: document.querySelector('.floater-message_blur'),
    messageAvailable: document.querySelector('.floater-message_available'),
    buttonFill: document.querySelector('.nav-button.is--toggle .button-fill.is--toggle')
  };

  // Validate required elements
  if (!Object.values(elements).every(el => el)) {
    console.warn('Message toggle: Required elements not found');
    return;
  }

  // Clean up existing handlers
  elements.toggleButton.removeEventListener('click', elements.toggleButton._toggleHandler);
  document.removeEventListener('click', document._messageClickHandler);

  // Scroll management
  const manageScroll = (isOpen) => {
    if (isOpen) {
      window.lenis?.stop();
      document.documentElement.classList.add('stop-scroll');
    } else {
      document.documentElement.classList.remove('stop-scroll');
      window.lenis?.start();
    }
  };

  // Main toggle handler
  elements.toggleButton._toggleHandler = () => {
    const isOpening = !elements.toggleButton.classList.contains('is--active');
    
    // Toggle states
    elements.toggleButton.classList.toggle('is--active');
    elements.buttonFill?.classList.toggle('is--active', isOpening);
    
    // Show wrapper if opening
    if (isOpening) {
      elements.overlayWrapper.style.display = 'block';
      elements.overlayWrapper.offsetHeight; // Force reflow
    }
    
    // Toggle visibility and scroll
    elements.overlayWrapper.classList.toggle('is--visible');
    manageScroll(isOpening);
    
    // Handle animations
    if (isOpening) {
      elements.messageBlur.classList.add('is--open');
      elements.messageAvailable.classList.add('is--open');
    } else {
      elements.messageAvailable.classList.remove('is--open');
      setTimeout(() => {
        if (!elements.toggleButton.classList.contains('is--active')) {
          elements.messageBlur.classList.remove('is--open');
        }
      }, MESSAGE_TIMING.BLUR_DELAY);
      
      setTimeout(() => {
        if (!elements.toggleButton.classList.contains('is--active')) {
          elements.overlayWrapper.style.display = 'none';
        }
      }, MESSAGE_TIMING.WRAPPER_DELAY);
    }
  };

  // Document click handler for outside clicks
  document._messageClickHandler = (e) => {
    if (!elements.toggleButton.classList.contains('is--active')) return;

    const clickedElement = e.target.closest('.floater-message_close, .floater-message_blur, .nav-button.is--toggle, .floater-message_available');
    
    if (!clickedElement) {
      elements.toggleButton.click();
    } else if (clickedElement.classList.contains('floater-message_close')) {
      e.preventDefault();
      e.stopPropagation();
      elements.toggleButton.click();
    } else if (clickedElement.classList.contains('floater-message_blur')) {
      elements.toggleButton.click();
    }
    // floater-message_available clicks do nothing (stay open)
  };

  // Add event listeners
  elements.toggleButton.addEventListener('click', elements.toggleButton._toggleHandler);
  document.addEventListener('click', document._messageClickHandler);
}

/**
 * Close message overlay if open
 */
function closeMessageOverlay() {
  const toggleButton = document.querySelector('.nav-button.is--toggle');
  if (toggleButton?.classList.contains('is--active')) {
    toggleButton.click();
  }
}

// Initialize message toggle
window.initMessageToggle = initMessageToggle;
window.closeMessageOverlay = closeMessageOverlay;

// Add to Webflow ready event
window.Webflow?.push(function() {
  initMessageToggle();
  
  // Preload videos on page load/refresh
  window.preloadVideoOnScroll?.();
  
  // Initialize scripts and CSS for the current page on load/refresh
  setTimeout(async () => {
    try {
      const response = await fetch(window.location.href);
      const html = await response.text();
      
      // Process the full HTML for scripts and CSS
      await window.loadAssetsFromHTML?.(html);
      await window.executeCustomScripts?.('init', html);
      await window.executeCustomCSS?.(html);
    } catch (error) {
      // Fallback to current document
      window.executeCustomScripts?.('init');
      window.executeCustomCSS?.();
    }
  }, 100);
});

// Script reinitialization is now handled in the main transition's after hook

// ============================================
// THEME SWITCHING MODULE
// ============================================

/**
 * Helper: Set theme classes instantly (no transition animation)
 */
function applyTheme(isDark) {
  const elems = [document.documentElement, document.body];
  elems.forEach(el => {
    el.classList.remove('theme-dark', 'theme-light');
    el.classList.add(isDark ? 'theme-dark' : 'theme-light');
  });
}

/**
 * Set initial theme instantly (called early in Barba lifecycle to prevent flash)
 */
function setInitialTheme() {
  const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index';
  const fromSpecialButton = window.barbaSpecialNavButton || sessionStorage.getItem('specialNavButton') === 'true';
  
  // Determine theme: homepage is dark unless navigating to hash section (light theme)
  const isDark = isHomepage && !fromSpecialButton && !(window.barbaNavigationHash || window.location.hash);
  
  applyTheme(isDark);
  
  // Cleanup flags
  if (fromSpecialButton) {
    window.barbaSpecialNavButton = false;
    sessionStorage.removeItem('specialNavButton');
  }
}

/**
 * Theme switching: Sets up scroll-based theme observer on homepage
 * Switches theme when [light-mode-trigger] enters/leaves viewport
 * Optimized for mobile devices to prevent flickering
 */
function initThemeSwitching() {
  const isHomepage = window.location.pathname === '/' || window.location.pathname === '/index';
  if (!isHomepage) return;
  
  const trigger = document.querySelector('[light-mode-trigger]');
  if (!trigger) return;
  
  // Detect mobile device for optimized behavior
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                  window.innerWidth <= 768;
  
  // Track current theme state
  let isDark = document.body.classList.contains('theme-dark');
  
  // Set theme directly for instant response (no debounce)
  const setTheme = (isDark) => {
    const elems = [document.documentElement, document.body];
    elems.forEach(el => {
      el.classList.add('theme-transitioning');
      el.classList.toggle('theme-dark', isDark);
      el.classList.toggle('theme-light', !isDark);
    });
    setTimeout(() => {
      elems.forEach(el => el.classList.remove('theme-transitioning'));
    }, isMobile ? 200 : 300);
  };
  
  // Enable observer only after user scrolls
  // Clean up any existing scroll listener first
  if (window._themeScrollHandler) {
    window.removeEventListener('scroll', window._themeScrollHandler);
  }
  
  let hasScrolled = false;
  window._themeScrollHandler = () => {
    hasScrolled = true;
    window.removeEventListener('scroll', window._themeScrollHandler);
    window._themeScrollHandler = null;
  };
  window.addEventListener('scroll', window._themeScrollHandler, { passive: true });
  
  // Watch trigger and switch theme when it enters/leaves viewport
  const observerOptions = isMobile 
    ? { threshold: 0.5 }
    : { threshold: [0, 0.5, 1] };
  
  const observer = new IntersectionObserver(([entry]) => {
    // Only wait for user scroll to prevent false triggers on initial load
    if (!hasScrolled) return;
    
    const shouldBeDark = entry.isIntersecting;
    if (shouldBeDark !== isDark) {
      isDark = shouldBeDark;
      setTheme(isDark);
    }
  }, observerOptions);
  
  observer.observe(trigger);
  
  // Store for cleanup
  if (!window.themeObservers) window.themeObservers = [];
  window.themeObservers.push(observer);
}

function cleanupThemeSwitching() {
  // Clean up observers
  if (window.themeObservers) {
    window.themeObservers.forEach(o => o.disconnect());
    window.themeObservers = [];
  }
  
  // Clean up scroll listener
  if (window._themeScrollHandler) {
    window.removeEventListener('scroll', window._themeScrollHandler);
    window._themeScrollHandler = null;
  }
}

// Export functions for Barba hooks to use
window.setInitialTheme = setInitialTheme;
window.initThemeSwitching = initThemeSwitching;
window.cleanupThemeSwitching = cleanupThemeSwitching;

// ============================================
// PAGE LOADER MODULE
// ============================================

function revealOnInitialLoad(container) {
  if (!container || !window.gsap) return;
  
  // Set transform origin to top center
  const topCenterOrigin = '50% 0%';
  
  window.gsap.set(container, {
    display: 'block',
    visibility: 'visible',
    opacity: 0,
    y: '4rem',
    filter: 'blur(10px)',
    scale: 0.90,
    transformOrigin: topCenterOrigin
  });
  
  container.style.pointerEvents = 'none';
  
  window.gsap.timeline({
    onComplete: () => container.style.pointerEvents = ''
  })
  .to(container, { opacity: 1, duration: 1, ease: 'power2.out' }, '<')
  .to(container, { filter: 'blur(0px)', duration: 1.5, ease: 'power2.out' }, 0.35)
  .to(container, { scale: 1, duration: 1.5, ease: 'power2.out' }, '<')
  .to(container, { y: '0rem', duration: 1.5, ease: 'power2.out' }, '<');
}

function initPageLoader() {
  const loader = document.querySelector('.loader');
  const container = document.querySelector('[data-barba="container"]');
  if (!loader || !window.gsap) return;
  
  // Cleanup existing state
  window._loaderTimeline?.kill();
  window._loaderScrollCleanup?.();
  window._lottieAnimation?.destroy();
  delete window._loaderTimeline;
  delete window._loaderScrollCleanup;
  delete window._lottieAnimation;
  document.documentElement.classList.remove('stop-scroll');
  window.lenis?.start();
  
  // Fail-safe timeout
  const failSafe = setTimeout(() => {
    if (container) {
      container.style.display = '';
      container.style.opacity = '1';
      container.style.visibility = 'visible';
    }
    document.documentElement.classList.remove('stop-scroll');
    window.lenis?.start();
    if (loader) loader.style.setProperty('display', 'none', 'important');
  }, 5000);
  
  const loaderContent = loader.querySelector('.loader-content_wrapper');
  
  // Setup - don't touch the Lottie element, preload-lottie.js handles it
  loader.style.setProperty('display', 'block', 'important');
  gsap.set(loader, { top: '0%' });
  gsap.set(loaderContent, { opacity: 0, filter: 'blur(10px)' });
  if (container) gsap.set(container, { display: 'none' });
  
  // Lock scroll
  window.lenis?.stop();
  document.documentElement.classList.add('stop-scroll');
  const preventScroll = (e) => { e.preventDefault(); e.stopPropagation(); };
  document.addEventListener('wheel', preventScroll, { passive: false });
  document.addEventListener('touchmove', preventScroll, { passive: false });
  window._loaderScrollCleanup = () => {
    document.removeEventListener('wheel', preventScroll);
    document.removeEventListener('touchmove', preventScroll);
  };
  
  // Animation
  const tl = gsap.timeline({
    onComplete: () => {
      clearTimeout(failSafe);
      window._loaderScrollCleanup?.();
      window._lottieAnimation?.destroy();
      delete window._loaderScrollCleanup;
      delete window._loaderTimeline;
      delete window._lottieAnimation;
      document.documentElement.classList.remove('stop-scroll');
      window.lenis?.start();
      loader.style.setProperty('display', 'none', 'important');
    }
  });
  
  window._loaderTimeline = tl;
  
  if (loaderContent) {
    // Get initial y value from CSS/Webflow (GSAP will read current transform)
    const initialY = gsap.getProperty(loaderContent, 'y') || 0;
    tl.to(loaderContent, { opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power2.out' })
      .fromTo(loaderContent, { y: initialY }, { y: 0, duration: 0.7, ease: 'power4.out' }, '<')
      .to(loaderContent, { opacity: 0, filter: 'blur(10px)', duration: 1, ease: 'power2.out', delay: 1})
  }
  
  tl.to(loader, { top: '-101%', duration: 1, ease: 'power4.inOut' }, '<')
    .call(() => container && revealOnInitialLoad(container), null, '<');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageLoader);
} else {
  initPageLoader();
}