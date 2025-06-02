/**
 * Utility functions for WebGL support and map rendering
 */

/**
 * Check if WebGL is supported in the current browser
 * @returns {boolean} whether WebGL is supported
 */
export const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
};

/**
 * Try to reset the WebGL context (may help with context lost issues)
 * @param element The canvas element or container to reset
 * @returns {boolean} whether the reset was attempted
 */
export const tryResetWebGLContext = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  try {
    // For direct canvas elements
    if (element instanceof HTMLCanvasElement) {
      const gl = element.getContext('webgl') || element.getContext('experimental-webgl');
      if (gl) {
        // @ts-ignore - Accessing extension
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) {
          ext.loseContext();
          setTimeout(() => ext.restoreContext(), 500);
          return true;
        }
      }
    }
    
    // For container elements, find the canvas inside
    const canvas = element.querySelector('canvas');
    if (canvas) {
      return tryResetWebGLContext(canvas);
    }
    
    return false;
  } catch (e) {
    console.error('Error resetting WebGL context:', e);
    return false;
  }
};

/**
 * Try to recover from a WebGL context lost error
 * @param mapContainer The map container element
 * @param resetCallback Callback to run after attempting recovery
 */
export const recoverFromContextLost = (
  mapContainer: HTMLElement | null,
  resetCallback?: () => void
): void => {
  if (!mapContainer) return;
  
  // Try to reset WebGL context
  const resetAttempted = tryResetWebGLContext(mapContainer);
  
  if (resetAttempted) {
    setTimeout(() => {
      if (resetCallback) resetCallback();
    }, 1000);
  } else if (resetCallback) {
    resetCallback();
  }
};
