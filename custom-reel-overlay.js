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
    
    // Simple global click handler to close overlay on any link click (fixes Safari bug)
    document.addEventListener('click', (e) => {
      if (e.target.closest('a[href]')) {
        // Close all overlays immediately
        document.querySelectorAll('[reel-overlay-target="true"]').forEach(overlay => {
          overlay.style.opacity = '0';
          const video = overlay.querySelector('video');
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
        });
      }
    }, true);
    
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
      video.preload = 'auto';
      
      // Set overlay to display: block and visibility: visible but keep it hidden with opacity (preserves fixed positioning)
      overlay.style.display = 'block';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '0';
      
      let hoverCount = 0;
      let playPromise = null;
      let unloadTimer = null;
      
      const startPlaying = () => {
        // Check if video needs to load source first
        const dataSrc = video.getAttribute('data-video-src');
        if (dataSrc && !video.src) {
          video.src = dataSrc;
        }
        
        try {
          // Reset video to start
          video.currentTime = 0;
          
          // Play the video
          playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Auto-play was prevented, try again after a brief delay
              setTimeout(() => {
                try {
                  playPromise = video.play();
                } catch (e) {
                  // Silent fail
                }
              }, 50);
            });
          }
        } catch (e) {
          // Silent fail
        }
      };
      
      const stopPlaying = () => {
        try {
          // Cancel any pending play
          if (playPromise && typeof playPromise.cancel === 'function') {
            playPromise.cancel();
          }
          
          // Pause the video
          video.pause();
          video.currentTime = 0;
          playPromise = null;
        } catch (e) {
          // Silent fail
        }
      };
      
      const onEnter = () => {
        hoverCount++;
        
        // Clear any pending unload
        if (unloadTimer) {
          clearTimeout(unloadTimer);
          unloadTimer = null;
        }
        
        // Show overlay with CSS transition
        overlay.style.opacity = '1';
        
        // Start playing if not already playing
        if (hoverCount === 1) {
          startPlaying();
        }
      };
      
      const onLeave = () => {
        hoverCount--;
        
        // If we're still hovering (either trigger or overlay), don't stop
        if (hoverCount > 0) return;
        
        // Hide overlay with CSS transition
        overlay.style.opacity = '0';
        
        // Wait for CSS transition to complete (300ms) before stopping video
        unloadTimer = setTimeout(() => {
          stopPlaying();
          unloadTimer = null;
        }, 300);
      };
      
      // Add event listeners
      trigger.addEventListener('mouseenter', onEnter);
      trigger.addEventListener('mouseleave', onLeave);
      overlay.addEventListener('mouseenter', onEnter);
      overlay.addEventListener('mouseleave', onLeave);
      
      // Mark as bound
      trigger.dataset.reelOverlayBound = '1';
    });
  }
  
  function stopAllReelOverlays() {
    // Stop all videos
    document.querySelectorAll('[reel-overlay-target="true"] video').forEach(v => { 
      v.pause(); 
      v.currentTime = 0;
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