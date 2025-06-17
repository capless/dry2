/**
 * BaseElement - Base class for all DRY2 components
 * Provides common functionality including Alpine.js integration
 */
class BaseElement extends HTMLElement {
  constructor() {
    super();
    this._isInitialized = false;
    this._componentData = {};
  }

  connectedCallback() {
    if (!this._isInitialized) {
      this._waitForAlpineAndInitialize();
      this._isInitialized = true;
    }
  }

  /**
   * Wait for Alpine.js to be ready, then initialize the component
   */
  _waitForAlpineAndInitialize() {
    // Check if Alpine.js is loaded
    if (window.Alpine && window.Alpine.version) {
      // Alpine is loaded, initialize immediately
      this._initializeComponent();
    } else {
      // Alpine not loaded yet, wait for it
      if (!window.alpineLoadPromise) {
        window.alpineLoadPromise = new Promise(resolve => {
          if (window.Alpine && window.Alpine.version) {
            resolve();
          } else {
            const checkAlpine = () => {
              if (window.Alpine && window.Alpine.version) {
                resolve();
              } else {
                setTimeout(checkAlpine, 10);
              }
            };
            checkAlpine();
          }
        });
      }
      
      window.alpineLoadPromise.then(() => {
        this._initializeComponent();
      });
    }
  }

  /**
   * Force Alpine to process this component
   */
  _ensureAlpineProcessing() {
    if (window.Alpine && window.Alpine.initTree) {
      // Give Alpine a moment to process, then force init if needed
      setTimeout(() => {
        const alpineData = this.querySelector('[x-data]');
        if (alpineData && !alpineData.__x) {
          try {
            window.Alpine.initTree(this);
          } catch (e) {
            // Fallback: try again in a moment
            setTimeout(() => {
              try {
                window.Alpine.initTree(this);
              } catch (e) {
                console.warn(`Alpine.js initialization delayed for ${this.tagName.toLowerCase()} component`);
              }
            }, 100);
          }
        }
      }, 50);
    }
  }

  /**
   * Override this method in child classes to implement component initialization
   */
  _initializeComponent() {
    // To be implemented by child classes
    console.warn(`Component ${this.tagName.toLowerCase()} should implement _initializeComponent()`);
  }

  /**
   * Extract text content from the element, preserving structure
   */
  _extractContent() {
    return this.textContent.trim();
  }

  /**
   * Utility method to create Alpine.js data object string
   */
  _createAlpineDataString(dataObject) {
    const entries = Object.entries(dataObject).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}: '${value.replace(/'/g, "\\'")}'`;
      } else if (typeof value === 'boolean') {
        return `${key}: ${value}`;
      } else if (typeof value === 'number') {
        return `${key}: ${value}`;
      } else if (typeof value === 'function') {
        return `${key}: ${value.toString()}`;
      } else {
        return `${key}: ${JSON.stringify(value)}`;
      }
    }).join(',\n        ');
    
    return `{
        ${entries}
      }`;
  }

  /**
   * Utility method to safely set an attribute
   */
  _setAttribute(name, value) {
    if (value !== null && value !== undefined && value !== '') {
      this.setAttribute(name, value);
    } else {
      this.removeAttribute(name);
    }
  }

  /**
   * Utility method to get boolean attribute
   */
  _getBooleanAttribute(name) {
    return this.hasAttribute(name);
  }

  /**
   * Utility method to set boolean attribute
   */
  _setBooleanAttribute(name, value) {
    if (value) {
      this.setAttribute(name, '');
    } else {
      this.removeAttribute(name);
    }
  }

  /**
   * Utility method to get attribute with default value
   */
  _getAttributeWithDefault(name, defaultValue) {
    return this.getAttribute(name) || defaultValue;
  }

  /**
   * Common method to handle attribute changes and update component data
   */
  _updateComponentData(attributeName, newValue) {
    if (this._componentData && this._componentData.hasOwnProperty(attributeName)) {
      this._componentData[attributeName] = newValue;
      this._refresh();
    }
  }

  /**
   * Refresh the component (re-render if needed)
   * Override in child classes for custom refresh behavior
   */
  _refresh() {
    // Default implementation - trigger a re-render if render method exists
    if (typeof this._render === 'function') {
      this._render();
      this._ensureAlpineProcessing();
    }
  }

  /**
   * Utility method to create CSS classes string
   */
  _createClassString(baseClasses, conditionalClasses = {}) {
    let classes = Array.isArray(baseClasses) ? baseClasses.join(' ') : baseClasses;
    
    Object.entries(conditionalClasses).forEach(([className, condition]) => {
      if (condition) {
        classes += ` ${className}`;
      }
    });
    
    return classes.trim();
  }

  /**
   * Dispatch a custom event from this component
   */
  _dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Common cleanup method - override in child classes if needed
   */
  disconnectedCallback() {
    // Cleanup logic can be added here
  }
}

// Make BaseElement globally available
window.BaseElement = BaseElement; 