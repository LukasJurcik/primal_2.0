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
// TEXT ANIMATION MODULE
// ============================================

/**
 * Initialize line reveal text animations
 * Animates text elements with data-line-reveal="true" attribute
 * Uses GSAP SplitText for line-by-line reveal animations
 */
function initTextAnimations() {
  console.log('🎭 Initializing line reveal animations...');
  if (typeof window.gsap === "undefined" || typeof window.SplitText === "undefined") {
    console.warn('GSAP or SplitText not found - text animations disabled');
    return;
  }

  // Process immediately, don't wait for fonts
  document.querySelectorAll("[data-line-reveal='true']").forEach((text) => {
    if (text.dataset.textAnimationBound === '1') return;
    
    try {
      SplitText.create(text, {
        type: "lines",
        autoSplit: true,
        mask: "lines",
        linesClass: "line",
        onSplit(self) {
          return gsap.timeline()
          .from(self.lines, {
            yPercent: 110,
            delay: 0.1, 
            duration: 0.8,
            stagger: { amount: 0.5 },
            ease: "power2.out", // Add easing here
          });
        },
      });

      gsap.set(text, { visibility: "visible" });
      text.dataset.textAnimationBound = '1';
    } catch (error) {
      console.warn('Text animation failed for element:', text, error);
    }
  });
}
window.initTextAnimations = initTextAnimations;

/**
 * Initialize word reveal text animations
 * Animates text elements with data-word-reveal="true" attribute
 * Uses GSAP SplitText for word-by-word reveal animations
 * Triggers on page load (perfect for hero headlines)
 */
function initWordAnimations() {
  console.log('📝 Initializing word reveal animations...');
  if (typeof window.gsap === "undefined" || typeof window.SplitText === "undefined") {
    console.warn('GSAP or SplitText not found - word animations disabled');
    return;
  }

  // Process immediately, don't wait for fonts
  document.querySelectorAll("[data-word-reveal='true']").forEach((text) => {
    if (text.dataset.wordAnimationBound === '1') return;
    
    try {
      SplitText.create(text, {
        type: "words",
        autoSplit: true,
        mask: "words",
        wordsClass: "word",
        onSplit(self) {
          return gsap.timeline()
          .from(self.words, {
            yPercent: 110,
            delay: 0, 
            duration: 0.7,
            stagger: { amount: 0.2 },
            ease: "cubic-bezier(.55,0,.25,1)",
          });
        },
      });

      gsap.set(text, { visibility: "visible" });
      text.dataset.wordAnimationBound = '1';
    } catch (error) {
      console.warn('Word animation failed for element:', text, error);
    }
  });
}
window.initWordAnimations = initWordAnimations;

/**
 * Initialize character reveal text animations
 * Animates text elements with data-char-reveal="true" attribute
 * Uses GSAP SplitText for character-by-character reveal animations
 * Triggers on page load (perfect for hero headlines)
 */
function initCharAnimations() {
  console.log('✨ Initializing character reveal animations...');
  if (typeof window.gsap === "undefined" || typeof window.SplitText === "undefined") {
    console.warn('GSAP or SplitText not found - character animations disabled');
    return;
  }

  // Process immediately, don't wait for fonts
  document.querySelectorAll("[data-char-reveal='true']").forEach((text) => {
    if (text.dataset.charAnimationBound === '1') return;
    
    try {
      SplitText.create(text, {
        type: "chars",
        autoSplit: true,
        mask: "chars",
        charsClass: "char",
        onSplit(self) {
          return gsap.timeline()
          .from(self.chars, {
            yPercent: 110,
            delay: 0,
            duration: 0.6,
            stagger: { amount: 0.5 },
            ease: "cubic-bezier(.75,.1,.15,1)",
          });
        },
      });

      gsap.set(text, { visibility: "visible" });
      text.dataset.charAnimationBound = '1';
    } catch (error) {
      console.warn('Character animation failed for element:', text, error);
    }
  });
}
window.initCharAnimations = initCharAnimations;

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
// VIDEO MODULES
// ============================================

/**
 * Initialize video hover functionality
 * Plays videos on hover/touch for elements with data-video-on-hover
 */
function initVideoHoverModule() {
  console.log('🎥 Initializing video hover functionality...');
  const wrappers = document.querySelectorAll('[data-video-on-hover]');
  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.videoHoverBound === '1') return;

    const video = wrapper.querySelector('.video-card-hover__video') || wrapper.querySelector('video');
    const src = (video && video.getAttribute('data-video-src')) || wrapper.getAttribute('data-video-src');
    if (!video || !src) return;

    video.muted = true;
    video.playsInline = true;

    let unloadTimer = null;

    const onEnter = () => {
      if (unloadTimer) { clearTimeout(unloadTimer); unloadTimer = null; }
      if (!video.getAttribute('src')) video.setAttribute('src', src);
      try { video.currentTime = 0; } catch (e) {}
      video.play().catch(() => {});
      wrapper.dataset.videoOnHover = 'active';
    };

    const onLeave = () => {
      try { video.pause(); } catch (e) {}
      wrapper.dataset.videoOnHover = 'not-active';
      unloadTimer = setTimeout(() => {
        video.removeAttribute('src');
        try { video.load(); } catch (e) {}
        unloadTimer = null;
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
    try { v.pause(); } catch (e) {} 
  });
}
window.stopAllHoverVideos = stopAllHoverVideos;

/**
 * Initialize autoplay videos
 * Videos with data-video-autoplay will play when in viewport
 */
function initAutoplayVideos() {
  console.log('▶️ Initializing autoplay videos...');
  const vids = document.querySelectorAll('[data-video-autoplay] video, video[data-video-autoplay]');
  vids.forEach(v => {
    v.muted = true;
    v.playsInline = true;

    // Lazy load if using data-video-src
    const ds = v.getAttribute('data-video-src');
    if (ds && !v.getAttribute('src')) v.setAttribute('src', ds);

    if (v.dataset.autoplayBound === '1') return;
    v.dataset.autoplayBound = '1';

    const tryPlay = () => v.play().catch(() => {});

    v.addEventListener('loadeddata', tryPlay, { passive: true });
    v.addEventListener('canplay', tryPlay, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new window.IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) tryPlay();
          else { try { v.pause(); } catch (e) {} }
        });
      }, { threshold: 0.25 });
      io.observe(v);
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
    .forEach(v => { try { v.pause(); } catch (e) {} });
}
window.stopAllAutoplayVideos = stopAllAutoplayVideos;

// ============================================
// LENIS INITIALIZATION
// ============================================

/**
 * Initialize Lenis smooth scrolling
 */
window.lenis = new window.Lenis({
  autoRaf: true,
  lerp: 0.25,
  smoothWheel: true,
  smoothTouch: true
});

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
 */
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
window.onbeforeunload = function () {
  window.scrollTo(0, 0);
};

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
// BARBA.JS PAGE TRANSITIONS
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
   * Ensures Webflow interactions work after page transitions
   */
  function reinitIXStable() {
    try {
      window.Webflow?.destroy();
      window.Webflow?.ready?.();
      window.Webflow?.require?.('ix2').init();
      setTimeout(() => { try { window.Webflow?.require('ix2').init(); } catch (e) {} }, 0);
    } catch (e) {}
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
    if (typeof bodyClass === 'string') document.body.className = bodyClass;
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

  // Easing configuration - change these to update all animations
  const COVER_EASE = 'power4.inOut';  // Easing for exit/cover animations
  const REVEAL_EASE = 'Expo.Out';   // Easing for enter/reveal animations

  // Overlay elements
  const wrap = document.querySelector('.transition-overlay_wrapper');
  const ov = document.querySelector('.transition-overlay');

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
   * Also animates current Barba container out with fade and upward movement
   */
  const coverFromBottom = async (currentContainer = null) => {
    if (!wrap || !ov) return;
    
    // Use passed container or find current Barba container
    const container = currentContainer || document.querySelector('[data-barba="container"]');
    
    wrap.classList.add('is-visible');
    
    // Set initial state - start with 0 scale, grow from bottom
    window.gsap.set(ov, { 
      scaleY: 0,
      transformOrigin: 'bottom center' // Scale grows from bottom up
    });
    
    // Create timeline for synchronized animations
    const tl = window.gsap.timeline();
    
    // ===== OVERLAY ANIMATION DISABLED =====
    // Overlay disabled - testing opacity only
    // tl.to(ov, { 
    //   scaleY: 1, 
    //   duration: 0.7,
    //   ease: 'power4.inOut'
    // }, 0);
    // ===== OVERLAY ANIMATION DISABLED =====
    
    // Animate current container out (blur + move up + scale down) if it exists
    if (container) {
      // Set transform origin to top center for scaling
      window.gsap.set(container, { transformOrigin: 'top center' });
      
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
        y: '-2rem', 
        duration: 0.6, 
        ease: COVER_EASE 
      }, 0);
    }
    
    await tl;
  };

  /**
   * Reveal screen to top (enter transition)
   * Also animates new Barba container in with fade and downward movement
   */
  const revealToTop = async (nextContainer = null) => {
    if (!wrap || !ov) return;
    
    // Use passed container or find new Barba container
    const container = nextContainer || document.querySelector('[data-barba="container"]');
    
    // Set initial state for new container (invisible, blurred, positioned, and scaled)
    if (container) {
      // Remove flicker prevention and set up for animation
      container.style.visibility = 'visible';
      
      // Disable pointer events initially
      container.style.pointerEvents = 'none';
      
      window.gsap.set(container, { 
        opacity: 0, // Start invisible
        y: '-2rem', // Start from same position where old container ended
        filter: 'blur(10px)', // Start with blur
        scale: 0.95, // Start scaled down
        transformOrigin: 'top center' // Scale from top
      });
    }
    
    // Set transform origin for reveal (scale shrinks from top down)
    window.gsap.set(ov, { transformOrigin: 'top center' });
    
    // Create timeline for synchronized animations
    const tl = window.gsap.timeline();
    
    // ===== OVERLAY ANIMATION DISABLED =====
    // Overlay disabled - testing opacity only
    // tl.to(ov, { 
    //   scaleY: 0, 
    //   duration: 0.7,
    //   ease: 'power4.inOut'
    // }, 0);
    // ===== OVERLAY ANIMATION DISABLED =====
    
    // Animate new container in (unblur + scale up + move to position) if it exists
    if (container) {
      // Separate animations for different easing and timing
      tl.to(container, { 
        opacity: 1, // Fade in
        duration: 0.6, 
        ease: REVEAL_EASE 
      }, 0)
      .to(container, { 
        filter: 'blur(0px)', // Remove blur as it fades in
        duration: 0.4, 
        ease: REVEAL_EASE 
      }, 0.1) // Blur clears after opacity starts
      .to(container, { 
        scale: 1, // Scale up to normal size
        duration: 0.6, 
        ease: REVEAL_EASE 
      }, 0)
      .to(container, { 
        y: '0rem', 
        duration: 0.6, 
        ease: REVEAL_EASE 
      }, 0); 
      
      // Re-enable pointer events after animation completes
      tl.call(() => {
        if (container) {
          container.style.pointerEvents = '';
        }
      });
    }
    
    await tl;
    wrap.classList.remove('is-visible');
  };

  /**
   * Initialize Barba.js with page transition configuration
   */
function start() {
  console.log('🚀 Initializing Barba.js page transitions...');
  if (!window.barba || !window.gsap) return setTimeout(start, 50);

    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { try { window.barba.destroy(); } catch (e) {} start(); }
    });

    try { window.barba.destroy(); } catch (e) {}

    // Intercept clicks during transitions and handle same-page clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href') || '';
      const isHash = href.startsWith('#') || href.includes('#');
      const isDownload = link.hasAttribute('download');
      const isPrevent = link.hasAttribute('data-barba-prevent');
      const isExternal = link.getAttribute('target') === '_blank';
      
      // Skip non-navigational links
      if (isHash || isDownload || isPrevent || isExternal) return;
      
      // Check if clicking on same page
      const currentPath = window.location.pathname;
      const linkPath = new URL(link.href, window.location.origin).pathname;
      const isSamePage = currentPath === linkPath;
      
      // Handle transitions in progress
      if (isTransitioning) {
        e.preventDefault();
        e.stopPropagation();
        
        // Store the pending navigation (even if same page)
        pendingNavigation = link.href;
        console.log('Navigation queued:', pendingNavigation);
        return;
      }
      
      // Handle same-page clicks - trigger transition anyway
      if (isSamePage) {
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger a fake transition for visual consistency
        triggerSamePageTransition();
      }
    }, true); // Use capture phase to intercept early

    window.barba.init({
      links: 'a[href]:not([target="_blank"])',
      prevent: ({ el }) => {
        if (!el || !el.href) return false;
        const href = el.getAttribute('href') || '';
        const isHash = href.startsWith('#') || href.includes('#');
        const isDownload = el.hasAttribute('download');
        const isPrevent = el.hasAttribute('data-barba-prevent');
        const isRelative = href.startsWith('/');
        let isAllowedHost = false;
        if (!isRelative) { try { isAllowedHost = INTERNAL_HOSTS.includes(new URL(el.href).host); } catch (e) {} }
        return (!isRelative && !isAllowedHost) || isHash || isDownload || isPrevent;
      },

      transitions: [{
        name: 'overlay-swap-clean',

        async leave({ current }) {
          // Mark transition as active
          isTransitioning = true;
          
          // Stop scroll and disable user scroll during transition
          window.lenis?.stop();
          document.body.style.overflow = 'hidden';
          
          window.stopAllHoverVideos?.();
          window.stopAllAutoplayVideos?.();
          await coverFromBottom(current?.container);
          
          // Overlay is now fully covering - wait here for content to load
          // This happens automatically as Barba fetches the next page
        },

        async afterLeave({ current }) {
          if (current?.container && window.gsap) window.gsap.set(current.container, { display: 'none' });
        },

        async beforeEnter({ next }) {
          // Update Webflow "page identity"
          await ensureSyncHtmlBody(next);

          // Make next container visible under overlay
          if (next?.container && window.gsap) {
            window.gsap.set(next.container, { clearProps: 'opacity,visibility', display: 'block' });
          }

          // Wait for content to be fully ready (images, fonts, etc.)
          await afterSwapReady(next?.container);
          
          // Let it paint one frame
          await new Promise(r => requestAnimationFrame(r));
        },

        async enter({ next }) {
          window.scrollTo(0, 0);
          
          // Now that content is loaded, reveal with animation
          await revealToTop(next?.container);        // overlay off → ready to animate
          
          // Re-enable scroll after transition completes
          document.body.style.overflow = '';
          
          // Mark transition as complete
          isTransitioning = false;
          
          // Handle any pending navigation through Barba
          if (pendingNavigation) {
            const pending = pendingNavigation;
            pendingNavigation = null;
            setTimeout(() => {
              // Use Barba's navigation to maintain transitions
              window.barba.go(pending);
            }, 100); // Small delay to ensure current transition is fully complete
          }
        },

        async after({ next }) {
          // Content is already ready from beforeEnter
          reinitIXStable();                          // re-bind Webflow click/hover IX

          // Install bridge
          installLenisScrollTriggerBridge();

          // Your modules & utilities
          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.initTextAnimations?.();
          window.initWordAnimations?.();
          window.initCharAnimations?.();
          window.initMessageToggle?.();
          window.runWidowFix?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
          
          // Ensure scroll is re-enabled and Lenis is started
          document.body.style.overflow = '';
          window.lenis?.start();
          
          // Ensure pointer events are re-enabled on container (fallback)
          const container = next?.container || document.querySelector('[data-barba="container"]');
          if (container) {
            container.style.pointerEvents = '';
          }
          
          // Ensure transition state is reset
          isTransitioning = false;
        },

        async once({ next }) {
          await ensureSyncHtmlBody(next);

          await afterSwapReady(next?.container);
          reinitIXStable();

          installLenisScrollTriggerBridge();

          // Mark GSAP as found for flicker prevention CSS
          if (window.gsap) {
            document.documentElement.classList.remove('gsap-not-found');
            
            // Ensure initial page content is visible (fallback)
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
          }

          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.initTextAnimations?.();
          window.initWordAnimations?.();
          window.initCharAnimations?.();
          window.runWidowFix?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
        }
      }]
    });

    try { window.barba.prefetch.init(); } catch (e) {}
    // Optionally, log version
    // console.log('[Barba] init', window.barba.version);
  }

  // Mark GSAP as found for flicker prevention CSS and handle initial page load
  if (window.gsap) {
    document.documentElement.classList.remove('gsap-not-found');
    
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
  } else {
    document.documentElement.classList.add('gsap-not-found');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/**
 * Initialize message toggle functionality
 * Handles the toggle behavior for the message button and related elements
 */
function initMessageToggle() {
  // Ensure Webflow is available
  if (!window.Webflow) {
    console.warn('Webflow not found - waiting...');
    setTimeout(initMessageToggle, 100);
    return;
  }

  console.log('🔘 Initializing message toggle...');
  console.log('Webflow found:', !!window.Webflow);
  
  const toggleButton = document.querySelector('.nav-button.is--toggle');
  console.log('Toggle button found:', toggleButton);
  
  const overlayWrapper = document.querySelector('.message-overlay_wrapper');
  console.log('Overlay wrapper found:', overlayWrapper);
  
  const messageBlur = document.querySelector('.floater-message_blur');
  console.log('Message blur found:', messageBlur);
  
  const messageAvailable = document.querySelector('.floater-message_available');
  console.log('Message available found:', messageAvailable);

  const closeButton = document.querySelector('.floater-message_close');
  console.log('Close button found:', closeButton);

  if (!toggleButton || !overlayWrapper || !messageBlur || !messageAvailable || !closeButton) {
    console.warn('Message toggle: Required elements not found');
    return;
  }

  // Remove any existing click listeners
  toggleButton.removeEventListener('click', toggleButton.toggleHandler);
  
  // Get the button fill element
  const buttonFill = toggleButton.querySelector('.button-fill.is--toggle');
  
  // Add hover listeners
  toggleButton.addEventListener('mouseenter', () => {
    if (buttonFill) buttonFill.classList.add('is--active');
  });
  
  toggleButton.addEventListener('mouseleave', () => {
    if (buttonFill && !toggleButton.classList.contains('is--active')) {
      buttonFill.classList.remove('is--active');
    }
  });

  // Function to manage scroll locking
  const manageScroll = (disable) => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    if (disable) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to html instead of body to maintain blur effect
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.top = `-${scrollY}px`;
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`; // Prevent layout shift
      document.documentElement.dataset.scrollPosition = scrollY;
    } else {
      // Restore scroll position
      const scrollY = document.documentElement.dataset.scrollPosition;
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.top = '';
      document.documentElement.style.paddingRight = '';
      window.scrollTo(0, parseInt(scrollY || '0'));
      delete document.documentElement.dataset.scrollPosition;
    }
  };

  // Create the click handler
  toggleButton.toggleHandler = () => {
    console.log('Toggle button clicked!');
    
    // Toggle button state
    toggleButton.classList.toggle('is--active');
    
    // Update button fill state
    if (buttonFill) {
      if (toggleButton.classList.contains('is--active')) {
        buttonFill.classList.add('is--active');
      } else {
        buttonFill.classList.remove('is--active');
      }
    }
    
    // First make wrapper visible if needed
    if (!overlayWrapper.classList.contains('is--visible')) {
      overlayWrapper.style.display = 'block';
      // Force a reflow to ensure display:block is applied
      overlayWrapper.offsetHeight;
    }
    
    // Toggle classes for transitions
    overlayWrapper.classList.toggle('is--visible');
    
    // Manage scroll locking
    manageScroll(toggleButton.classList.contains('is--active'));
    
    if (toggleButton.classList.contains('is--active')) {
      // Opening - add classes immediately
      messageBlur.classList.add('is--open');
      messageAvailable.classList.add('is--open');
    } else {
      // Closing - delay blur removal, remove available immediately
      messageAvailable.classList.remove('is--open');
      setTimeout(() => {
        if (!toggleButton.classList.contains('is--active')) {
          messageBlur.classList.remove('is--open');
        }
      }, 200);
      
      // Hide wrapper after all transitions
      setTimeout(() => {
        if (!toggleButton.classList.contains('is--active')) {
          overlayWrapper.style.display = 'none';
        }
      }, 400); // Wait for both transitions to complete afte closing
    }
  };

  // Add the click listeners
  toggleButton.addEventListener('click', toggleButton.toggleHandler);
  
  // Remove any existing click listeners from the document
  document.removeEventListener('click', document.messageClickHandler);
  
  // Create a new click handler for the document
  document.messageClickHandler = (e) => {
    // Only handle clicks when the message is open
    if (!toggleButton.classList.contains('is--active')) return;

    // Get the clicked element and check its classes
    const target = e.target;
    const clickedElement = target.closest('.floater-message_close, .floater-message_blur, .nav-button.is--toggle, .floater-message_available');
    
    if (!clickedElement) {
      // Click was outside all relevant elements - close the message
      toggleButton.click();
      return;
    }

    // Handle clicks based on the element that was clicked
    if (clickedElement.classList.contains('floater-message_close')) {
      // Close button was clicked
      e.preventDefault();
      e.stopPropagation();
      toggleButton.click();
    } else if (clickedElement.classList.contains('floater-message_blur')) {
      // Blur background was clicked
      toggleButton.click();
    } else if (clickedElement.classList.contains('floater-message_available')) {
      // Click was inside the message - do nothing
      return;
    }
  };

  // Add the click handler to the document
  document.addEventListener('click', document.messageClickHandler);
}

// Initialize message toggle
window.initMessageToggle = initMessageToggle;

// Add to Webflow ready event
window.Webflow?.push(function() {
  console.log('🌊 Webflow ready - initializing message toggle...');
  initMessageToggle();
});

// Add to Barba.js after hook to handle page transitions
if (window.barba) {
  window.barba.hooks.after(() => {
    console.log('🔄 Barba.js transition complete - reinitializing message toggle...');
    window.initMessageToggle?.();
  });
}