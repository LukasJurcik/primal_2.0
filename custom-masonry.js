// Macy Grid - Fully Automatic Script
<script data-barba-init>
(function() {
  var selector = '[macy-grid="true"]';
  var columns = 4;
  var margin = 8; // Fallback
  var cssGapVariable = '--_responsive-sizes---grid-gap';
  
  // Automatic initialization guard - no manual setup needed
  if (window.macyInitialized) {
    return;
  }
  
  function getCSSVariableValue(variableName) {
    var el = document.querySelector(selector);
    if (!el) return margin;
    
    var value = getComputedStyle(el).getPropertyValue(variableName).trim();
    var numericValue = parseFloat(value);
    
    if (isNaN(numericValue)) return margin;
    
    var rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return numericValue * rootFontSize;
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
  
  // Wait for page to be fully painted
  function waitForPaint() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        init();
      });
    });
  }
  
  waitForPaint();
  
  // Resize handler
  window.addEventListener('resize', function() {
    if (window.macyInstance) {
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
    } else {
      init();
    }
  });
})();
</script>

<!-- No data-barba-destroy needed - automatic cleanup handles it! -->