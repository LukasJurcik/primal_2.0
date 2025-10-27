(function() {
  'use strict';
  
  // Prevent double initialization
  if (window._lottiePreloaded) return;
  window._lottiePreloaded = true;
  
  function loadLottie() {
    const lottie = document.querySelector('.loader .lottie-animation-json');
    if (!lottie) return;
    
    // Check if already initialized
    if (lottie.dataset.lottieInitialized) return;
    lottie.dataset.lottieInitialized = 'true';
    
    lottie.setAttribute('data-autoplay', '1');
    
    if (window.Webflow && window.Webflow.require) {
      window.Webflow.require('lottie').init();
    } else {
      window.Webflow = window.Webflow || [];
      window.Webflow.push(function() {
        window.Webflow.require('lottie').init();
      });
    }
  }
  
  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLottie);
  } else {
    loadLottie();
  }
})();
