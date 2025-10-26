// Reel Overlay Hover - Automatic Script
(function() {
  // Check if device supports hover (not touch devices)
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  if (!supportsHover) return;
  
  // Simple manual guard - prevents double execution
  if (window.reelOverlayInitialized) return;
  
  function initReelOverlayModule() {
    const triggers = document.querySelectorAll('[reel-overlay-trigger="true"]');
    
    // Reset all bound states to allow re-binding after page transitions
    triggers.forEach(trigger => {
      trigger.dataset.reelOverlayBound = '0';
    });
    
    triggers.forEach((trigger) => {
      if (trigger.dataset.reelOverlayBound === '1') return;
      
      let overlay = document.querySelector('[reel-overlay-target="true"]');
      if (!overlay) return;
      
      // Ensure overlay is positioned relative to viewport by moving to body if needed
      if (overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
      }
      
      const specialHoverWrapper = overlay.querySelector('[special-hover="true"][data-video-on-hover="true"]');
      if (!specialHoverWrapper) return;
      
      const video = specialHoverWrapper.querySelector('video');
      if (!video) return;
      
      // Set up video properties
      video.muted = true;
      video.playsInline = true;
      
      // Set overlay to display: block and visibility: visible but keep it hidden with opacity (preserves fixed positioning)
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '0';
      
      let isHovering = false;
      let unloadTimer = null;
      
      const onEnter = () => {
        if (isHovering) return;
        isHovering = true;
        
        // Clear any pending unload
        if (unloadTimer) {
          clearTimeout(unloadTimer);
          unloadTimer = null;
        }
        
        // Show overlay with CSS transition
        overlay.style.opacity = '1';
        
        // Check if video needs to load source first
        const dataSrc = video.getAttribute('data-video-src');
        if (dataSrc && !video.src) {
          video.src = dataSrc;
        }
        
        try {
          video.currentTime = 0;
          video.play();
        } catch (e) {
          // Silent fail
        }
      };
      
      const onLeave = () => {
        if (!isHovering) return;
        isHovering = false;
        
        // Hide overlay with CSS transition
        overlay.style.opacity = '0';
        
        // Wait for CSS transition to complete (300ms) before pausing video
        setTimeout(() => {
          try {
            video.pause();
            video.currentTime = 0;
          } catch (e) {
            // Silent fail
          }
        }, 300);
      };
      
      // Add event listeners
      trigger.addEventListener('mouseenter', onEnter);
      trigger.addEventListener('mouseleave', onLeave);
      
      // Keep overlay visible when hovering over it (but don't control video)
      overlay.addEventListener('mouseenter', () => {
        if (isHovering) return;
        onEnter();
      });
      
      overlay.addEventListener('mouseleave', onLeave);
      
      // Mark as bound
      trigger.dataset.reelOverlayBound = '1';
    });
  }
  
  function stopAllReelOverlays() {
    document.querySelectorAll('[reel-overlay-target="true"] [special-hover="true"][data-video-on-hover="true"] video').forEach(v => { 
      try { 
        v.pause(); 
        v.currentTime = 0;
      } catch (e) {} 
    });
  }
  
  // Wait for page to be fully painted
  function waitForPaint() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        initReelOverlayModule();
      });
    });
  }
  
  waitForPaint();
  
  // Register cleanup function
  if (window.instanceRegistry) {
    window.instanceRegistry.register('reelOverlay', { stop: stopAllReelOverlays }, 'stop');
  }
  
  // Export functions for manual use if needed
  window.initReelOverlayModule = initReelOverlayModule;
  window.stopAllReelOverlays = stopAllReelOverlays;
  
  // Mark as initialized
  window.reelOverlayInitialized = true;
})();