// Macy Grid - Fully Automatic Script
<script data-barba-init>
(function() {
  var selector = '[macy-grid="true"]';
  var columns = 4;
  var margin = 24; // Fallback
  var cssGapVariable = '--_responsive-sizes---container-padding';
  
  // Automatic initialization guard - no manual setup needed
  if (window.macyInitialized) {
    return;
  }
  
  function getCSSVariableValue(variableName) {
    var el = document.querySelector(selector);
    if (!el) return margin;
    
    // Try to get the variable from element or root
    var rawValue = getComputedStyle(el).getPropertyValue(variableName).trim() || 
                   getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    
    if (!rawValue) return margin;
    
    // If value contains CSS functions, compute it via temporary element
    if (rawValue.includes('clamp(') || rawValue.includes('calc(')) {
      var tempEl = document.createElement('div');
      tempEl.style.position = 'absolute';
      tempEl.style.visibility = 'hidden';
      tempEl.style.paddingLeft = 'var(' + variableName + ')';
      document.body.appendChild(tempEl);
      
      var computed = parseFloat(getComputedStyle(tempEl).paddingLeft);
      document.body.removeChild(tempEl);
      
      return (!isNaN(computed) && computed > 0) ? computed : margin;
    }
    
    // Handle simple pixel values
    if (rawValue.includes('px')) {
      var num = parseFloat(rawValue);
      return (!isNaN(num)) ? num : margin;
    }
    
    return margin;
  }
  
  function getCurrentSpacing() {
    return getCSSVariableValue(cssGapVariable);
  }
  
  function init() {
    var el = document.querySelector(selector);
    
    if (!el) {
      setTimeout(init, 100);
      return;
    }
    
    // Check if container has proper dimensions
    var rect = el.getBoundingClientRect();
    
    if (rect.height === 0) {
      setTimeout(init, 100);
      return;
    }
    
    var currentSpacing = getCurrentSpacing();
    
    // Create Macy instance
    window.macyInstance = Macy({
      container: el,
      trueOrder: false,
      waitForImages: false,
      margin: { x: currentSpacing, y: currentSpacing },
      columns: columns,
      breakAt: {
        991: { columns: 3, margin: { x: currentSpacing, y: currentSpacing } },
        767: { columns: 2, margin: { x: currentSpacing, y: currentSpacing } },
        479: { columns: 1, margin: { x: currentSpacing, y: currentSpacing } }
      }
    });
    
    // Automatic cleanup registration - no manual setup needed
    if (window.instanceRegistry) {
      window.instanceRegistry.register('macy', window.macyInstance, 'remove');
    }
    
    // Mark as initialized
    window.macyInitialized = true;
  }
  
  // Wait for page to be ready
  function waitForPaint() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        setTimeout(init, 50);
      });
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForPaint);
  } else {
    waitForPaint();
  }
  
  // Resize handler
  window.addEventListener('resize', function() {
    if (!window.macyInstance) {
      init();
      return;
    }
    
    var currentSpacing = getCurrentSpacing();
    window.macyInstance.options.margin = { x: currentSpacing, y: currentSpacing };
    
    if (window.macyInstance.options.breakAt) {
      for (var breakpoint in window.macyInstance.options.breakAt) {
        window.macyInstance.options.breakAt[breakpoint].margin = { 
          x: currentSpacing, 
          y: currentSpacing 
        };
      }
    }
    
    window.macyInstance.recalculate(true, true);
  });
})();
</script>

<!-- No data-barba-destroy needed - automatic cleanup handles it! -->