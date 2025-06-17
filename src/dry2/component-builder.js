/**
 * ComponentBuilder - A reusable class for creating interactive component builders
 * across all showcase pages
 */
class ComponentBuilder {
  constructor(config) {
    this.config = {
      elementId: config.elementId || 'component-builder',
      componentTag: config.componentTag, // e.g., 'dry-tabs', 'dry-button'
      title: config.title || 'Component Builder',
      description: config.description || 'Try changing the component properties dynamically.',
      
      // Property definitions
      properties: config.properties || {},
      
      // Default values
      defaults: config.defaults || {},
      
      // Content generator function
      contentGenerator: config.contentGenerator || this.defaultContentGenerator,
      
      // Custom preview wrapper
      previewWrapper: config.previewWrapper || this.defaultPreviewWrapper,
      
      // Code example generator
      codeGenerator: config.codeGenerator || this.defaultCodeGenerator
    };
    
    this.currentValues = { ...this.config.defaults };
    
    // Make this instance available globally for callbacks
    window[`componentBuilder_${this.config.elementId}`] = this;
    
    this.init();
  }
  
  init() {
    const container = document.getElementById(this.config.elementId);
    if (!container) {
      console.error(`ComponentBuilder: Element with id "${this.config.elementId}" not found`);
      return;
    }
    
    container.innerHTML = this.generateHTML();
    this.bindEvents();
    this.updateCode(); // Set initial code content
  }
  
  generateHTML() {
    return `
      <section class="demo-section">
        <h2 class="demo-title">${this.config.title}</h2>
        <p class="demo-description">${this.config.description}</p>
        
        <div class="demo-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Controls -->
            <div class="space-y-4">
              ${this.generateControls()}
            </div>
            
            <!-- Preview -->
            <div class="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg p-4">
              <div class="w-full" id="${this.config.elementId}-preview">
                ${this.generatePreview()}
              </div>
            </div>
          </div>
        </div>
        
        <div class="code-block">
          <div class="code-header">
            <span class="code-language">HTML</span>
            <button class="copy-button" onclick="window.componentBuilder_${this.config.elementId}.copyCode()">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              Copy
            </button>
          </div>
          <div class="code-content">
            <pre id="${this.config.elementId}-code"></pre>
          </div>
        </div>
      </section>
    `;
  }
  
  generateControls() {
    return Object.entries(this.config.properties).map(([key, propConfig]) => {
      return this.generateControl(key, propConfig);
    }).join('');
  }
  
  generateControl(key, propConfig) {
    const value = this.currentValues[key];
    const id = `${this.config.elementId}-${key}`;
    
    if (propConfig.type === 'select') {
      return `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${propConfig.label}</label>
          <select id="${id}" class="w-full p-2 border border-gray-300 rounded" data-property="${key}">
            ${propConfig.options.map(option => 
              `<option value="${option.value}" ${option.value === value ? 'selected' : ''}>${option.label}</option>`
            ).join('')}
          </select>
        </div>
      `;
    } else if (propConfig.type === 'checkbox') {
      return `
        <div class="space-y-2">
          <label class="flex items-center">
            <input type="checkbox" id="${id}" class="mr-2" data-property="${key}" ${value ? 'checked' : ''}>
            ${propConfig.label}
          </label>
        </div>
      `;
    } else if (propConfig.type === 'range') {
      return `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${propConfig.label}</label>
          <input type="range" id="${id}" class="w-full" 
                 min="${propConfig.min || 0}" 
                 max="${propConfig.max || 100}" 
                 value="${value}" 
                 data-property="${key}">
          <div class="text-sm text-gray-500 mt-1" id="${id}-display">${propConfig.displayFormat ? propConfig.displayFormat(value) : value}</div>
        </div>
      `;
    } else if (propConfig.type === 'text') {
      return `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">${propConfig.label}</label>
          <input type="text" id="${id}" class="w-full p-2 border border-gray-300 rounded" 
                 value="${value}" data-property="${key}">
        </div>
      `;
    } else {
      return '';
    }
  }
  
  bindEvents() {
    const container = document.getElementById(this.config.elementId);
    
    // Bind change events to all controls
    container.addEventListener('change', (e) => {
      const property = e.target.dataset.property;
      if (property) {
        this.updateProperty(property, this.getControlValue(e.target));
      }
    });
    
    container.addEventListener('input', (e) => {
      const property = e.target.dataset.property;
      if (property && e.target.type === 'range') {
        this.updateProperty(property, this.getControlValue(e.target));
        // Update range display
        const display = document.getElementById(`${this.config.elementId}-${property}-display`);
        if (display) {
          const propConfig = this.config.properties[property];
          display.textContent = propConfig.displayFormat ? propConfig.displayFormat(e.target.value) : e.target.value;
        }
      }
    });
  }
  
  getControlValue(element) {
    if (element.type === 'checkbox') {
      return element.checked;
    } else if (element.type === 'range') {
      return parseInt(element.value);
    } else {
      return element.value;
    }
  }
  
  updateProperty(property, value) {
    this.currentValues[property] = value;
    this.updatePreview();
    this.updateCode();
  }
  
  updatePreview() {
    const preview = document.getElementById(`${this.config.elementId}-preview`);
    preview.innerHTML = this.generatePreview();
    // Ensure custom element is upgraded and interactive
    const countdown = preview.querySelector('dry-countdown');
    if (countdown && (countdown.hasAttribute('autostart') || countdown.autostart)) {
      // Use setTimeout to ensure the element is upgraded before calling the method
      setTimeout(() => {
        if (typeof countdown.startCountdown === 'function') {
          countdown.startCountdown();
        }
      }, 0);
    }
  }
  
  updateCode() {
    const codeElement = document.getElementById(`${this.config.elementId}-code`);
    const rawCode = this.generateCode();
    // Use textContent to automatically escape HTML and prevent browser from rendering custom elements
    codeElement.textContent = rawCode;
  }
  
  generatePreview() {
    return this.config.previewWrapper(this.generateComponent());
  }
  
  generateComponent() {
    const attributes = Object.entries(this.currentValues)
      .filter(([key, value]) => {
        const propConfig = this.config.properties[key];
        const defaultValue = this.config.defaults[key];
        return value !== defaultValue && value !== false && value !== '';
      })
      .map(([key, value]) => {
        // Handle boolean attributes - if true, just include the attribute name
        if (typeof value === 'boolean' && value === true) {
          return key;
        }
        return `${key}="${value}"`;
      })
      .join(' ');
    
    const content = this.config.contentGenerator(this.currentValues);
    
    return `<${this.config.componentTag}${attributes ? ' ' + attributes : ''}>${content}</${this.config.componentTag}>`;
  }
  
  generateCode() {
    return this.config.codeGenerator(this.currentValues, this.config);
  }
  
  defaultPreviewWrapper(componentHTML) {
    return componentHTML;
  }
  
  defaultContentGenerator(values) {
    return 'Component content';
  }
  
  defaultCodeGenerator(values, config) {
    const attributes = Object.entries(values)
      .filter(([key, value]) => {
        const defaultValue = config.defaults[key];
        return value !== defaultValue && value !== false && value !== '';
      })
      .map(([key, value]) => {
        // Handle boolean attributes - if true, just include the attribute name
        if (typeof value === 'boolean' && value === true) {
          return key;
        }
        return `${key}="${value}"`;
      })
      .join(' ');
    
    return `<${config.componentTag}${attributes ? ' ' + attributes : ''}>
  Component content goes here...
</${config.componentTag}>`;
  }
  
  copyCode() {
    const rawCode = this.generateCode();
    navigator.clipboard.writeText(rawCode);
  }
}

// Make ComponentBuilder available globally
window.ComponentBuilder = ComponentBuilder; 