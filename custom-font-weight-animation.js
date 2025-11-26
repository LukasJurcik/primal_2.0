// Font Weight Animation - Automatic Script
(function() {
  // 1. Manual guard (prevents double execution)
  if (window.fontWeightAnimationInitialized) return;
  
  // Check if device supports hover (not touch devices)
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  if (!supportsHover) return;
  
  if (typeof window.$ === 'undefined' || typeof window.gsap === 'undefined' || typeof window.SplitType === 'undefined') {
    console.warn('⚠️ Font Weight Animation: Missing dependencies');
    return;
  }
  
  // 2. Script logic
  const maxDistance = 350;
  const maxExpo = -80;
  const minExpo = -20;
  let mouseX = 0;
  let mouseY = 0;
  
  function initFontWeightAnimation() {
    console.log('🎨 Initializing font weight animation...');
    const fontWeightItems = $('[data-animate=font-weight]');
    
    fontWeightItems.each((index, item) => {
      let splitChars;
      
      if ($(item).find('.char').length === 0) {
        try {
          const splitCharType = new SplitType(item, { types: 'chars,words' });
          splitChars = splitCharType.chars;
        } catch (error) {
          console.warn('SplitType error:', error);
          return;
        }
      } else {
        splitChars = $(item).find('.char');
      }
      
      $(splitChars).each((i, char) => {
        const initialExpo = parseFloat(getComputedStyle(char).getPropertyValue('--expo')) || 0;
        $(char).data('initialExpo', initialExpo);
        $(char).css('--expo', initialExpo);
        
        $(char).on('mouseenter.fontWeight', () => {
          gsap.to(char, { duration: 0.5, css: { '--expo': maxExpo } });
        });
        
        $(char).on('mouseleave.fontWeight', () => {
          gsap.to(char, { duration: 0.5, css: { '--expo': $(char).data('initialExpo') } });
        });
      });
    });
    
    function updateExpo() {
      $('[data-animate="font-weight"] .char').each((index, item) => {
        const $item = $(item);
        const pos = $item.offset();
        const cx = pos.left + $item.outerWidth() / 2;
        const cy = pos.top + $item.outerHeight() / 2;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        
        let expo = minExpo;
        if (dist < maxDistance) {
          expo = minExpo + (maxExpo - minExpo) * ((maxDistance - dist) / maxDistance);
        }
        gsap.to(item, { duration: 0.5, css: { '--expo': expo } });
      });
    }
    
    $(document).on('mousemove.fontWeight', (e) => {
      mouseX = e.pageX;
      mouseY = e.pageY;
      updateExpo();
    });
    
    $(window).on('scroll.fontWeight resize.fontWeight', updateExpo);
  }
  
  // 3. Cleanup function
  function cleanupFontWeightAnimation() {
    console.log('🧹 Cleaning up font weight animation...');
    $(document).off('.fontWeight');
    $(window).off('.fontWeight');
    $('[data-animate="font-weight"] .char').off('.fontWeight');
    mouseX = 0;
    mouseY = 0;
  }
  
  // 4. Initialize script
  requestAnimationFrame(() => {
    requestAnimationFrame(initFontWeightAnimation);
  });
  
  // 5. Register cleanup function
  if (window.instanceRegistry) {
    window.instanceRegistry.register('fontWeightAnimation', { stop: cleanupFontWeightAnimation }, 'stop');
  }
  
  // 6. Mark as initialized
  window.fontWeightAnimationInitialized = true;
})();
