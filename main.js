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
// LOAD ANIMATIONS
// ============================================

/**
 * Prime load-fx elements BEFORE reveal (prevents flash-then-fade)
 * Hides elements with data-load-fx attributes
 * @param {Element} scope - DOM scope to search
 */
function primeLoadFx(scope = document) {
  const els = scope.querySelectorAll('[data-load-fx="fade"], [data-load-fx="stagger"]');
  if (els.length && window.gsap) window.gsap.set(els, { autoAlpha: 0 });
}
window.primeLoadFx = primeLoadFx;

/**
 * Animate load-fx elements AFTER reveal
 * Supports: data-load-fx="fade" | "stagger"
 * @param {Element} scope - DOM scope to search
 */
function runLoadFx(scope = document) {
  if (!window.gsap) return;
  
  // Single fades
  const fades = scope.querySelectorAll('[data-load-fx="fade"]');
  if (fades.length) {
    window.gsap.fromTo(
      fades,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'visibility,opacity'
      }
    );
  }

  // Stagger up animations
  const staggers = scope.querySelectorAll('[data-load-fx="stagger"]');
  if (staggers.length) {
    window.gsap.fromTo(
      staggers,
      { y: 16, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06,
        overwrite: 'auto',
        clearProps: 'transform,visibility,opacity'
      }
    );
  }
}
window.runLoadFx = runLoadFx;

// ============================================
// SCROLL ANIMATIONS
// ============================================

/**
 * Install scroll-triggered effects for elements in scope
 * Supports: data-scroll-fx="fade" | "up" | data-scroll-stagger
 * @param {Element} scope - DOM scope to search
 * @returns {Function} - Disposer function to clean up triggers
 */
function installScrollFx(scope = document) {
  if (!window.ScrollTrigger || !window.gsap) return () => {};
  const triggers = [];

  // Fade when entering viewport
  scope.querySelectorAll('[data-scroll-fx="fade"]').forEach(el => {
    triggers.push(
      window.gsap.from(el, {
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true }
      })
    );
  });

  // Rise up on enter
  scope.querySelectorAll('[data-scroll-fx="up"]').forEach(el => {
    triggers.push(
      window.gsap.from(el, {
        y: 24,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      })
    );
  });

  // Group stagger (stagger direct children)
  scope.querySelectorAll('[data-scroll-stagger]').forEach(group => {
    const items = group.querySelectorAll(':scope > *');
    triggers.push(
      window.gsap.from(items, {
        y: 12,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: group, start: 'top 80%', once: true }
      })
    );
  });

  // Disposer: kill all ScrollTriggers/tweens
  return () => {
    triggers.forEach(t => {
      try { t.scrollTrigger?.kill(); } catch (e) {}
      try { t.kill?.(); } catch (e) {}
    });
    try { window.ScrollTrigger.refresh(); } catch (e) {}
  };
}
window.installScrollFx = installScrollFx;

// ============================================
// VIDEO MODULES
// ============================================

/**
 * Initialize video hover functionality
 * Plays videos on hover/touch for elements with data-video-on-hover
 */
function initVideoHoverModule() {
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

// ============================================
// FLOATER MESSAGE MODULE (jQuery Required)
// ============================================

/**
 * Initialize available floater message functionality
 * Requires jQuery to be loaded
 */
if (typeof window.jQuery !== 'undefined') {
  window.jQuery(function () {
    const $doc = window.jQuery(document);
    const $win = window.jQuery(window);
    const $wrapper = window.jQuery('.floater-message_wrapper');
    const $panel = window.jQuery('.floater-message_available');

    const SHOW_DISPLAY = 'flex';
    let $activeBtn = null;

    // Helper functions
    const getFill = ($btn) => $btn.find('.button-fill.is--toggle');
    const isOpen = () => $panel.hasClass('is--open');
    const inZone = (el) => window.jQuery(el).closest('.nav-button.is--toggle, .floater-message_wrapper').length > 0;

    // Open / Close functions
    function open($btn) {
      if ($wrapper.css('display') !== SHOW_DISPLAY) $wrapper.css('display', SHOW_DISPLAY);
      requestAnimationFrame(() => $panel.addClass('is--open'));
      $activeBtn = $btn;
      getFill($btn).addClass('is--open').removeClass('is--hover');
    }

    function close() {
      if (!isOpen()) return;
      $panel.removeClass('is--open');

      $panel.one('transitionend', function (e) {
        if (e.target !== this) return;
        if (!isOpen()) $wrapper.css('display', 'none');
      });

      // Fallback if no transition
      setTimeout(() => { if (!isOpen()) $wrapper.css('display', 'none'); }, 500);

      window.jQuery('.button-fill.is--toggle').removeClass('is--open is--hover');
      $activeBtn = null;
    }

    // Event handlers
    // Toggle (delegated)
    $doc.on('click', '.nav-button.is--toggle', function (e) {
      e.preventDefault();
      const $btn = window.jQuery(this);
      if ($activeBtn && $btn.is($activeBtn)) {
        close();
      } else {
        if ($activeBtn) close();
        open($btn);
      }
    });

    // Hover (only when nothing active)
    $doc.on('mouseenter', '.nav-button.is--toggle', function () {
      if ($activeBtn) return;
      getFill(window.jQuery(this)).addClass('is--hover');
    }).on('mouseleave', '.nav-button.is--toggle', function () {
      if ($activeBtn) return;
      getFill(window.jQuery(this)).removeClass('is--hover');
    });

    // Leave zone → close
    $doc.on('mouseleave', '.nav-button.is--toggle, .floater-message_wrapper', function (e) {
      if ($activeBtn && !inZone(e.relatedTarget)) close();
    });

    // Click outside → close
    $doc.on('click', function (e) {
      if ($activeBtn && !inZone(e.target)) close();
    });

    // Click wrapper background (not the panel) → close
    $wrapper.on('click', function (e) {
      if (window.jQuery(e.target).closest('.floater-message_available').length) return;
      if ($activeBtn) close();
    });

    // Esc → close
    $doc.on('keydown', function (e) {
      if (e.key === 'Escape' && $activeBtn) close();
    });

    // SCROLL → close (any page scroll while open)
    $win.on('scroll', function () {
      if ($activeBtn) close();
    });
  });
}

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

  // Overlay elements
  const wrap = document.querySelector('.transition-overlay_wrapper');
  const ov = document.querySelector('.transition-overlay');

  /**
   * Cover screen from bottom (leave transition)
   */
  const coverFromBottom = async () => {
    if (!wrap || !ov) return;
    wrap.classList.add('is-visible');
    window.gsap.set(ov, { transformOrigin: 'bottom center', scaleY: 0 });
    await window.gsap.to(ov, { scaleY: 1, duration: 0.45, ease: 'power2.inOut' });
  };

  /**
   * Reveal screen to top (enter transition)
   */
  const revealToTop = async () => {
    if (!wrap || !ov) return;
    window.gsap.set(ov, { transformOrigin: 'top center' });
    await window.gsap.to(ov, { scaleY: 0, duration: 0.5, ease: 'power2.inOut' });
    wrap.classList.remove('is-visible');
  };

  // Keep disposer for per-page ScrollTriggers
  let disposeScrollFx = () => {};

  /**
   * Initialize Barba.js with page transition configuration
   */
  function start() {
    if (!window.barba || !window.gsap) return setTimeout(start, 50);

    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { try { window.barba.destroy(); } catch (e) {} start(); }
    });

    try { window.barba.destroy(); } catch (e) {}

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

        async leave() {
          window.lenis?.stop();
          disposeScrollFx?.();                       // kill old ScrollTriggers
          window.stopAllHoverVideos?.();
          window.stopAllAutoplayVideos?.();
          await coverFromBottom();
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
            // 🔹 PRIME load effects NOW so they’re hidden before reveal
            primeLoadFx(next.container);
          }

          // Let it paint one frame
          await new Promise(r => requestAnimationFrame(r));
        },

        async enter() {
          window.scrollTo(0, 0);
          await revealToTop();                       // overlay off → ready to animate
        },

        async after({ next }) {
          await afterSwapReady(next?.container);     // (from FX module)
          reinitIXStable();                          // re-bind Webflow click/hover IX

          // Install + run attribute animations
          installLenisScrollTriggerBridge();
          runLoadFx(next.container);                 // ← fades hero now (no flash)
          disposeScrollFx = installScrollFx(next.container);

          // Your modules & utilities
          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.runWidowFix?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
          window.lenis?.start();
        },

        async once({ next }) {
          await ensureSyncHtmlBody(next);
          // Prime before first reveal too (prevents first-load flash)
          if (next?.container) primeLoadFx(next.container);

          await afterSwapReady(next?.container);
          reinitIXStable();

          installLenisScrollTriggerBridge();
          runLoadFx(next.container);
          disposeScrollFx = installScrollFx(next.container);

          window.initVideoHoverModule?.();
          window.initAutoplayVideos?.();
          window.runWidowFix?.();

          try { window.ScrollTrigger.refresh(); } catch (e) {}
        }
      }]
    });

    try { window.barba.prefetch.init(); } catch (e) {}
    // Optionally, log version
    // console.log('[Barba] init', window.barba.version);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();