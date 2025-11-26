# Barba.js Scripts Documentation

## Overview
This project uses a custom `data-barba-init` system for managing JavaScript functionality across page transitions. This system ensures scripts run properly on each page while preventing double execution.

## How It Works

### 1. Script Execution
- Scripts with `data-barba-init` are executed during Barba.js page transitions
- Each script gets a unique ID based on content and position
- Scripts are prevented from running multiple times on the same page

### 2. Manual Guards
- Each script uses a manual guard to prevent double execution
- Guards are reset between page transitions via `destroyAll()`
- This allows scripts to run fresh on each new page

### 3. Cleanup System
- Scripts can register cleanup functions for proper resource management
- All registered instances are automatically destroyed on page transitions
- Initialization flags are reset to allow re-initialization

## Creating New Scripts

### Step 1: Script Template
Use this template for all new scripts:

```javascript
// My New Script - Automatic Script
(function() {
  // 1. Manual guard (prevents double execution)
  if (window.myNewScriptInitialized) {
    return;
  }
  
  // 2. Your script logic
  function initMyScript() {
    console.log('🎠 Initializing my new script...');
    
    // Find elements
    const elements = document.querySelectorAll('[my-script-trigger]');
    
    // Set up functionality
    elements.forEach(element => {
      // Your code here
    });
  }
  
  // 3. Cleanup function (optional but recommended)
  function cleanupMyScript() {
    console.log('🧹 Cleaning up my script...');
    // Remove event listeners, destroy instances, etc.
  }
  
  // 4. Initialize your script
  initMyScript();
  
  // 5. Register cleanup function
  if (window.instanceRegistry) {
    window.instanceRegistry.register('myNewScript', { stop: cleanupMyScript }, 'stop');
  }
  
  // 6. Mark as initialized
  window.myNewScriptInitialized = true;
})();
```

### Step 2: Add to HTML
```html
<script data-barba-init>
// Paste your script content here (without <script> tags)
</script>
```

### Step 3: Update main.js
Add your flag to the `destroyAll()` function in `main.js`:

```javascript
// Reset specific script flags
window.macyInitialized = false;
window.reelOverlayInitialized = false;
window.myNewScriptInitialized = false; // Add your new flag here
```

## Existing Scripts

### 1. Reel Overlay (`custom-reel-overlay.js`)
- **Flag**: `window.reelOverlayInitialized`
- **Functionality**: Hover overlay with video playback
- **Triggers**: `[reel-overlay-trigger="true"]`
- **Targets**: `[reel-overlay-target="true"]`

### 2. Masonry Grid (`custom-masonry.js`)
- **Flag**: `window.macyInitialized`
- **Functionality**: Responsive masonry grid layout
- **Triggers**: `[macy-grid="true"]`

## System Components

### Instance Registry
Located in `main.js`, manages all script instances:

```javascript
window.instanceRegistry = {
  instances: new Map(),
  initializedScripts: new Set(),
  
  register(name, instance, destroyMethod = 'destroy'),
  isScriptInitialized(scriptId),
  markScriptInitialized(scriptId),
  destroyAll()
};
```

### Script Execution
The `executeCustomScripts()` function handles:
- Finding scripts with `data-barba-init`
- Generating unique IDs
- Preventing double execution
- Executing script content

### Cleanup Process
The `destroyAll()` function:
- Destroys all registered instances
- Clears initialization flags
- Resets script tracking
- Prepares for new page

## Best Practices

### 1. Naming Conventions
- Use descriptive flag names: `window.reelOverlayInitialized`
- Avoid generic names: `window.initialized`
- Include script purpose in name

### 2. Cleanup Functions
- Always provide cleanup functions for complex scripts
- Remove event listeners
- Destroy third-party instances
- Clear timers and intervals

### 3. Error Handling
- Wrap script execution in try-catch blocks
- Provide fallbacks for missing dependencies
- Log errors for debugging

### 4. Testing
- Test on initial page load
- Test page transitions
- Test back/forward navigation
- Test with different page combinations

## Troubleshooting

### Script Not Running
1. Check if flag is added to `destroyAll()`
2. Verify script has manual guard
3. Check console for errors
4. Ensure script is in correct HTML location

### Script Running Multiple Times
1. Verify manual guard is working
2. Check if flag is being reset properly
3. Look for duplicate script tags

### Script Not Working on Page Transitions
1. Ensure flag is reset in `destroyAll()`
2. Check if cleanup function is registered
3. Verify script re-initializes properly

## File Structure
```
project/
├── main.js                          # Core system and Barba.js setup
├── custom-reel-overlay.js           # Reel overlay functionality
├── custom-masonry.js                # Masonry grid functionality
└── BARBA_SCRIPTS_DOCUMENTATION.md   # This documentation
```

## Maintenance

### Adding New Scripts
1. Create script file
2. Add to HTML with `data-barba-init`
3. Add flag to `destroyAll()` in main.js
4. Test thoroughly

### Updating Existing Scripts
1. Modify script functionality
2. Update cleanup if needed
3. Test across all page transitions
4. Update documentation if necessary

### Debugging
- Use browser dev tools console
- Check for script execution logs
- Verify flag states
- Monitor instance registry

---

*This documentation should be updated whenever new scripts are added or the system is modified.*
