class SwapComponent extends BaseElement {
  constructor() {
    super();
    this._active = false;
    this._boundHandleClick = null;
    this._boundHandleKeydown = null;
  }

  static get observedAttributes() {
    return ['icon-on', 'icon-off', 'active', 'disabled', 'size', 'transition', 'class'];
  }

  _initializeComponent() {
    // Set initial active state from attribute
    this._active = this.hasAttribute('active');

    // Create the component structure
    this._render();

    // Add event listeners
    this._addEventListeners();
    
    // Mark as initialized
    this._isInitialized = true;
  }

  _render() {
    const classes = this._getComponentClasses();
    const currentIcon = this._active ? this.iconOn : this.iconOff;
    const transitionClass = this.transition === 'none' ? '' : 'transition-all duration-200 ease-in-out';

    this.innerHTML = `
            <div class="${classes}" role="button" tabindex="${this.disabled ? '-1' : '0'}" aria-pressed="${this._active}" aria-label="Toggle" data-swap-button>
                <div class="swap-icon ${transitionClass} flex items-center justify-center">
                    ${currentIcon}
                </div>
            </div>
        `;
        
    // Re-attach event listeners to the button after rendering
    if (this._isInitialized) {
      this._addEventListeners();
    }
  }

  _getComponentClasses() {
    let classes = 'swap-component inline-flex items-center justify-center cursor-pointer select-none ';

    // Size classes
    if (this.size === 'small') {
      classes += 'text-sm p-1 min-w-[24px] min-h-[24px] ';
    } else if (this.size === 'large') {
      classes += 'text-xl p-3 min-w-[48px] min-h-[48px] ';
    } else {
      // medium or default
      classes += 'text-base p-2 min-w-[32px] min-h-[32px] ';
    }

    // State classes
    if (this.disabled) {
      classes += 'opacity-50 cursor-not-allowed pointer-events-none ';
    } else {
      classes += 'hover:opacity-75 active:scale-95 ';
    }

    // Focus styles
    classes += 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded transition-transform duration-150 ';

    // Custom classes
    const customClass = this.getAttribute('class');
    if (customClass) {
      classes += customClass + ' ';
    }

    return classes.trim();
  }

  _addEventListeners() {
    const button = this.querySelector('[data-swap-button]');
    if (!button) return;
    
    // Remove existing listeners first to avoid duplicates
    if (this._boundHandleClick) {
      button.removeEventListener('click', this._boundHandleClick);
      this._boundHandleClick = null;
    }
    if (this._boundHandleKeydown) {
      button.removeEventListener('keydown', this._boundHandleKeydown);
      this._boundHandleKeydown = null;
    }

    if (!this.disabled) {
      this._boundHandleClick = this._handleClick.bind(this);
      this._boundHandleKeydown = this._handleKeydown.bind(this);
      button.addEventListener('click', this._boundHandleClick);
      button.addEventListener('keydown', this._boundHandleKeydown);
    }
  }

  _handleClick(event) {
    event.preventDefault();
    if (!this.disabled) {
      this.toggle();
    }
  }

  _handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.disabled) {
        this.toggle();
      }
    }
  }

  // Public API
  toggle() {
    if (this.disabled) return;

    this.active = !this._active;
  }

  // Getters
  get iconOn() {
    return this.getAttribute('icon-on') || '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>';
  }

  get iconOff() {
    return this.getAttribute('icon-off') || '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>';
  }

  get active() {
    return this._active;
  }

  set active(value) {
    const newValue = Boolean(value);
    if (this._active !== newValue) {
      this._active = newValue;

      if (newValue) {
        this.setAttribute('active', '');
      } else {
        this.removeAttribute('active');
      }

      if (this._isInitialized) {
        this._render();
        this._dispatchChangeEvent();
      }
    }
  }

  get disabled() {
    return this._getBooleanAttribute('disabled');
  }

  set disabled(value) {
    this._setBooleanAttribute('disabled', value);
  }

  get size() {
    return this._getAttributeWithDefault('size', 'medium');
  }

  set size(value) {
    this._setAttribute('size', value);
  }

  get transition() {
    return this.getAttribute('transition') || 'fade';
  }

  _dispatchChangeEvent() {
    this._dispatchEvent('swap:change', {
      active: this._active,
      component: this
    });
  }

  _handleAttributeChange(name, oldValue, newValue) {
    if (oldValue !== newValue && this._isInitialized) {
      if (name === 'active') {
        this._active = this.hasAttribute('active');
        this._render();
      } else if (name === 'disabled') {
        this._addEventListeners(); // Re-setup listeners based on disabled state
        this._render();
      } else if (name === 'icon-on' || name === 'icon-off' || name === 'size' || name === 'class') {
        this._render();
      }
    }
  }

  disconnectedCallback() {
    // Clean up event listeners
    const button = this.querySelector('[data-swap-button]');
    if (button) {
      if (this._boundHandleClick) {
        button.removeEventListener('click', this._boundHandleClick);
      }
      if (this._boundHandleKeydown) {
        button.removeEventListener('keydown', this._boundHandleKeydown);
      }
    }
  }
}

customElements.define('swap-component', SwapComponent);
