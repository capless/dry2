class DryButton extends BaseElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading', 'type', 'href', 'target', 'icon'];
  }

  _initializeComponent() {
    // Store original content and setup component data
    const originalContent = this._extractContent();

    this._componentData = {
      content: originalContent,
      variant: this.variant,
      size: this.size,
      disabled: this.disabled,
      loading: this.loading,
      icon: this.icon
    };

    // Create the component structure with Alpine.js
    this._render();
    
    // Ensure Alpine processes this component
    this._ensureAlpineProcessing();
  }

  _extractContent() {
    return this.textContent.trim();
  }

  _render() {
    const isLink = !!this.href;
    const tagName = isLink ? 'a' : 'button';
    const linkProps = isLink ? `href="${this.href}" ${this.target ? `target="${this.target}"` : ''}` : '';
    const buttonProps = !isLink ? `type="${this.type}"` : '';

    // Create Alpine data object - can't use utility for functions
    const alpineData = `{
      content: '${this._componentData.content}',
      variant: '${this.variant}',
      size: '${this.size}',
      disabled: ${this.disabled},
      loading: ${this.loading},
      icon: '${this.icon}',
      
      getButtonClasses() {
        let classes = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border ';
        
        // Size classes
        if (this.size === 'sm') {
          classes += 'px-3 py-1.5 text-xs rounded ';
        } else if (this.size === 'lg') {
          classes += 'px-6 py-3 text-base rounded-lg ';
        } else if (this.size === 'xl') {
          classes += 'px-8 py-4 text-lg rounded-lg ';
        } else {
          // md or default
          classes += 'px-4 py-2 text-sm rounded-md ';
        }
        
        // Variant classes
        if (this.variant === 'secondary') {
          classes += 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 focus:ring-gray-500 ';
        } else if (this.variant === 'outline') {
          classes += 'bg-transparent text-blue-600 border-blue-600 hover:bg-blue-50 focus:ring-blue-500 ';
        } else if (this.variant === 'text') {
          classes += 'bg-transparent text-blue-600 border-transparent hover:bg-blue-50 focus:ring-blue-500 ';
        } else if (this.variant === 'danger') {
          classes += 'bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500 ';
        } else if (this.variant === 'success') {
          classes += 'bg-green-600 text-white border-green-600 hover:bg-green-700 focus:ring-green-500 ';
        } else if (this.variant === 'warning') {
          classes += 'bg-yellow-500 text-yellow-900 border-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 ';
        } else {
          // primary or default
          classes += 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500 ';
        }
        
        // State classes
        if (this.disabled || this.loading) {
          classes += 'opacity-50 cursor-not-allowed ';
        }
        
        return classes.trim();
      }
    }`;

    this.innerHTML = `
      <div x-data="${alpineData}" class="inline-block">
        
        <${tagName} 
          :class="getButtonClasses()"
          ${linkProps}
          ${buttonProps}
          :disabled="disabled || loading"
          :aria-busy="loading"
          :aria-disabled="disabled || loading">
          
          <!-- Loading Spinner -->
          <i x-show="loading" class="fas fa-spinner fa-spin mr-2"></i>
          
          <!-- Icon -->
          <i x-show="icon && !loading" :class="icon + (content ? ' mr-2' : '')"></i>
          
          <!-- Text Content -->
          <span x-show="content" x-text="content"></span>
          
        </${tagName}>
        
      </div>
    `;
  }



  // Public API methods
  setLoading(loading) {
    this.loading = loading;
  }

  setDisabled(disabled) {
    this.disabled = disabled;
  }

  setText(text) {
    if (this._componentData) {
      this._componentData.content = text;
    }
    this.textContent = text;
  }

  click() {
    if (!this.disabled && !this.loading) {
      const button = this.querySelector('button, a');
      if (button) {
        button.click();
      }
    }
  }

  // Getters and setters using base class utilities
  get variant() {
    return this._getAttributeWithDefault('variant', 'primary');
  }

  set variant(value) {
    this._setAttribute('variant', value);
  }

  get size() {
    return this._getAttributeWithDefault('size', 'md');
  }

  set size(value) {
    this._setAttribute('size', value);
  }

  get disabled() {
    return this._getBooleanAttribute('disabled');
  }

  set disabled(value) {
    this._setBooleanAttribute('disabled', value);
  }

  get loading() {
    return this._getBooleanAttribute('loading');
  }

  set loading(value) {
    this._setBooleanAttribute('loading', value);
  }

  get type() {
    return this._getAttributeWithDefault('type', 'button');
  }

  set type(value) {
    this._setAttribute('type', value);
  }

  get href() {
    return this.getAttribute('href') || '';
  }

  set href(value) {
    this._setAttribute('href', value);
  }

  get target() {
    return this.getAttribute('target') || '';
  }

  set target(value) {
    this._setAttribute('target', value);
  }

  get icon() {
    return this.getAttribute('icon') || '';
  }

  set icon(value) {
    this._setAttribute('icon', value);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this._isInitialized) {
      // Update component data and refresh
      this._updateComponentData(name, newValue);
      
      // For buttons, we need to re-render when attributes change
      if (this._componentData) {
        this._componentData[name] = newValue;
        this._refresh();
      }
    }
  }
}

customElements.define('dry-button', DryButton);
