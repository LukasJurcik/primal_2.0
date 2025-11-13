// Values Slider - Automatic Script
(function() {
  // 1. Manual guard (prevents double execution)
  if (window.valuesSliderInitialized) {
    return;
  }

  // 2. Script logic
  function initValuesSlider() {
    console.log('🎠 Initializing values slider...');

    gsap.registerPlugin(Observer);

    let totalX = 0;
    let xTo;
    let wrapX;

    const sliderSection = document.querySelector('.values-slider');
    const sliderTrack = document.querySelector('.values-slider_wrapper');

    if (!sliderSection || !sliderTrack) {
      console.warn('[values-slider] Required elements not found');
      return null;
    }

    const slides = gsap.utils.toArray('.values-slide', sliderSection);
    const visibleSlideCount = slides.length / 2;
    const itemValues = [];
    let isHovering = false;
    let activeTouches = 0;
    let isDragging = false;

    const baseScrollDivisor = 25;
    const hoverScrollMultiplier = 0.3;
    let scrollMultiplier = 1;

    sliderTrack.style.cursor = 'grab';
    if (!sliderTrack.style.touchAction) {
      sliderTrack.style.touchAction = 'pan-y';
    }

    for (let i = 0; i < visibleSlideCount; i += 1) {
      const base = (Math.random() - 0.5) * 6;
      const jitter = i % 2 === 0 ? -1.2 : 1.2;
      itemValues.push(base + jitter);
    }

    const halfWidth = sliderTrack.scrollWidth / 2;
    wrapX = gsap.utils.wrap(-halfWidth, 0);

    xTo = gsap.quickTo(sliderTrack, 'x', {
      duration: 0.25,
      ease: 'power1',
      modifiers: {
        x: gsap.utils.unitize(wrapX),
      },
    });

    const dragTimeline = gsap.timeline({ paused: true });
    dragTimeline.to(slides, {
      rotate: (index) => itemValues[index % visibleSlideCount],
      xPercent: (index) => itemValues[index % visibleSlideCount],
      yPercent: (index) => itemValues[index % visibleSlideCount],
      scale: 0.98,
      duration: 0.5,
      ease: 'back.inOut(2)',
    });

    const observer = Observer.create({
      target: sliderTrack,
      type: 'pointer,touch',
      onPress: () => {
        sliderTrack.style.cursor = 'grabbing';
        isDragging = true;
        dragTimeline.play();
      },
      onDrag: (self) => {
        totalX += self.deltaX;
        xTo(totalX);
      },
      onRelease: () => {
        sliderTrack.style.cursor = 'grab';
        isDragging = false;
        scrollMultiplier =
          activeTouches > 0 || isHovering ? hoverScrollMultiplier : 1;
        dragTimeline.reverse();
      },
      onStop: () => {
        sliderTrack.style.cursor = 'grab';
        isDragging = false;
        scrollMultiplier =
          activeTouches > 0 || isHovering ? hoverScrollMultiplier : 1;
        dragTimeline.reverse();
      },
    });

    const tick = (_, deltaTime) => {
      if (!scrollMultiplier) return;
      totalX -= (deltaTime / baseScrollDivisor) * scrollMultiplier;
      xTo(totalX);
    };

    gsap.ticker.add(tick);

    const handleMouseEnter = () => {
      isHovering = true;
      if (!isDragging) {
        scrollMultiplier = hoverScrollMultiplier;
      }
    };

    const handleMouseLeave = () => {
      isHovering = false;
      if (!isDragging && activeTouches === 0) {
        scrollMultiplier = 1;
      }
    };

    const handleTouchStart = () => {
      activeTouches += 1;
      scrollMultiplier = hoverScrollMultiplier;
    };

    const handleTouchEnd = () => {
      activeTouches = Math.max(0, activeTouches - 1);
      if (activeTouches === 0) {
        scrollMultiplier = isHovering ? hoverScrollMultiplier : 1;
      }
    };

    sliderTrack.addEventListener('mouseenter', handleMouseEnter);
    sliderTrack.addEventListener('mouseleave', handleMouseLeave);
    sliderTrack.addEventListener('touchstart', handleTouchStart);
    sliderTrack.addEventListener('touchend', handleTouchEnd);
    sliderTrack.addEventListener('touchcancel', handleTouchEnd);

    // Return cleanup data
    return {
      observer,
      dragTimeline,
      tick,
      sliderTrack,
      handleMouseEnter,
      handleMouseLeave,
      handleTouchStart,
      handleTouchEnd,
    };
  }

  // 3. Cleanup function
  function cleanupValuesSlider() {
    console.log('🧹 Cleaning up values slider...');
    
    const instanceData = window.valuesSliderInstance;
    if (!instanceData) return;

    try {
      // Kill Observer instance
      if (instanceData.observer) {
        instanceData.observer.kill();
      }

      // Kill GSAP timeline
      if (instanceData.dragTimeline) {
        instanceData.dragTimeline.kill();
      }

      // Remove ticker function
      if (instanceData.tick) {
        gsap.ticker.remove(instanceData.tick);
      }

      // Remove event listeners
      if (instanceData.sliderTrack) {
        instanceData.sliderTrack.removeEventListener('mouseenter', instanceData.handleMouseEnter);
        instanceData.sliderTrack.removeEventListener('mouseleave', instanceData.handleMouseLeave);
        instanceData.sliderTrack.removeEventListener('touchstart', instanceData.handleTouchStart);
        instanceData.sliderTrack.removeEventListener('touchend', instanceData.handleTouchEnd);
        instanceData.sliderTrack.removeEventListener('touchcancel', instanceData.handleTouchEnd);

        // Reset styles
        instanceData.sliderTrack.style.cursor = '';
        instanceData.sliderTrack.style.touchAction = '';
      }
    } catch (error) {
      console.error('❌ Error cleaning up values slider:', error);
    }

    // Clear instance data
    window.valuesSliderInstance = null;
  }

  // 4. Initialize script
  const instanceData = initValuesSlider();
  if (instanceData) {
    // Store instance data for cleanup
    window.valuesSliderInstance = instanceData;

    // 5. Register cleanup function
    if (window.instanceRegistry) {
      window.instanceRegistry.register('valuesSlider', { stop: cleanupValuesSlider }, 'stop');
    }
  }

  // 6. Mark as initialized
  window.valuesSliderInitialized = true;
})();

