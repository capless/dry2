// Dock Component for DRY2 Web Components

class DockComponent extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const orientation = this.orientation;
        const magnification = this.magnification;
        const containerClasses = this.getContainerClasses(orientation);
        
        // Check if we have direct children or need to set up for slotted content
        if (!this.hasChildNodes() || (this.firstElementChild && this.firstElementChild.tagName === 'SLOT')) {
            this.innerHTML = `<div class="${containerClasses}" style="--magnification: ${magnification};"><slot></slot></div>`;
            return;
        }
        
        // Process dock items
        const items = Array.from(this.querySelectorAll('dock-item'));
        
        // If no items found, set up for slotted content
        if (items.length === 0) {
            this.innerHTML = `<div class="${containerClasses}" style="--magnification: ${magnification};"><slot></slot></div>`;
            return;
        }
        
        // Create the dock with processed items
        const dockHTML = `
            <div class="${containerClasses}" style="--magnification: ${magnification};">
                ${items.map(item => item.outerHTML).join('')}
            </div>
        `;
        
        this.innerHTML = dockHTML;
        
        // Set up magnification effect
        this.setupMagnificationEffect();
    }

    getContainerClasses(orientation) {
        let classes = 'dock-container flex items-center justify-center p-4 ';
        
        // Orientation-specific classes
        if (orientation === 'vertical') {
            classes += 'flex-col h-full ';
        } else {
            // Default horizontal orientation
            classes += 'w-full ';
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    setupMagnificationEffect() {
        const dockContainer = this.querySelector('.dock-container');
        const dockItems = this.querySelectorAll('dock-item');
        
        if (!dockContainer || dockItems.length === 0) return;
        
        const orientation = this.orientation;
        const isVertical = orientation === 'vertical';
        const magnification = parseFloat(this.magnification);
        
        // Listen for mouse movement over the dock
        dockContainer.addEventListener('mousemove', (e) => {
            const rect = dockContainer.getBoundingClientRect();
            
            // Process each dock item for magnification
            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                
                // Calculate distance from mouse to center of item
                let distance;
                if (isVertical) {
                    const itemCenterY = itemRect.top + itemRect.height / 2;
                    distance = Math.abs(e.clientY - itemCenterY) / (rect.height / 2);
                } else {
                    const itemCenterX = itemRect.left + itemRect.width / 2;
                    distance = Math.abs(e.clientX - itemCenterX) / (rect.width / 2);
                }
                
                // Calculate scale based on distance (closer = larger)
                let scale = 1 + (magnification - 1) * Math.max(0, 1 - distance);
                
                // Apply scale and transition
                item.style.transform = `scale(${scale})`;
                item.style.zIndex = Math.round(scale * 10);
            });
        });
        
        // Reset scales when mouse leaves dock
        dockContainer.addEventListener('mouseleave', () => {
            dockItems.forEach(item => {
                item.style.transform = 'scale(1)';
                item.style.zIndex = '1';
            });
        });
    }

    static get observedAttributes() {
        return ['orientation', 'magnification', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get orientation() {
        return this.getAttribute('orientation') || 'horizontal';
    }

    set orientation(value) {
        this.setAttribute('orientation', value);
    }

    get magnification() {
        return this.getAttribute('magnification') || '2';
    }

    set magnification(value) {
        this.setAttribute('magnification', value);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Dock Item Component
class DockItem extends BaseWebComponent {
    constructor() {
        super();
        this._tooltipVisible = false;
        this._tooltipElement = null;
    }

    render() {
        const label = this.label;
        const tooltip = this.tooltip || label;
        const href = this.href;
        
        // Create the dock item HTML
        let itemHTML;
        
        // Determine if this is a link or button
        if (href) {
            // Link item
            itemHTML = `
                <a href="${href}" class="${this.getItemClasses()}" role="link">
                    <slot></slot>
                </a>
            `;
        } else {
            // Button item
            itemHTML = `
                <button type="button" class="${this.getItemClasses()}" role="button">
                    <slot></slot>
                </button>
            `;
        }
        
        this.innerHTML = itemHTML;
        
        // Attach event listeners for tooltip and click
        this.setupEventListeners();
    }

    getItemClasses() {
        let classes = 'dock-item flex items-center justify-center p-2 transition-all duration-200 relative ';
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    setupEventListeners() {
        const itemElement = this.querySelector('a, button');
        if (!itemElement) return;
        
        // Tooltip functionality
        if (this.tooltip || this.label) {
            itemElement.addEventListener('mouseenter', () => this.showTooltip());
            itemElement.addEventListener('mouseleave', () => this.hideTooltip());
            itemElement.addEventListener('focus', () => this.showTooltip());
            itemElement.addEventListener('blur', () => this.hideTooltip());
        }
        
        // Click handler for button items
        if (itemElement.tagName === 'BUTTON') {
            itemElement.addEventListener('click', (e) => {
                this.dispatchEvent(new CustomEvent('dock-item:click', {
                    bubbles: true,
                    detail: {
                        item: this,
                        label: this.label,
                        originalEvent: e
                    }
                }));
            });
        }
    }

    showTooltip() {
        const tooltip = this.tooltip || this.label;
        if (!tooltip) return;
        
        // Create tooltip element if not already present
        if (!this._tooltipElement) {
            this._tooltipElement = document.createElement('div');
            this._tooltipElement.className = 'dock-tooltip absolute bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none z-50';
            this._tooltipElement.textContent = tooltip;
            
            // Determine tooltip position based on dock orientation
            const dockParent = this.closest('dock-component');
            const isVertical = dockParent && dockParent.orientation === 'vertical';
            
            if (isVertical) {
                this._tooltipElement.style.left = '100%';
                this._tooltipElement.style.top = '50%';
                this._tooltipElement.style.transform = 'translateY(-50%)';
                this._tooltipElement.style.marginLeft = '8px';
            } else {
                this._tooltipElement.style.bottom = '100%';
                this._tooltipElement.style.left = '50%';
                this._tooltipElement.style.transform = 'translateX(-50%)';
                this._tooltipElement.style.marginBottom = '8px';
            }
            
            document.body.appendChild(this._tooltipElement);
        }
        
        // Position tooltip relative to item
        const itemRect = this.getBoundingClientRect();
        const dockParent = this.closest('dock-component');
        const isVertical = dockParent && dockParent.orientation === 'vertical';
        
        if (isVertical) {
            this._tooltipElement.style.top = `${itemRect.top + itemRect.height / 2}px`;
            this._tooltipElement.style.left = `${itemRect.right + 8}px`;
        } else {
            this._tooltipElement.style.left = `${itemRect.left + itemRect.width / 2}px`;
            this._tooltipElement.style.top = `${itemRect.top - 8 - this._tooltipElement.offsetHeight}px`;
        }
        
        // Show tooltip with slight delay
        setTimeout(() => {
            if (this._tooltipElement) {
                this._tooltipElement.style.opacity = '1';
            }
        }, 200);
        
        this._tooltipVisible = true;
    }

    hideTooltip() {
        if (this._tooltipElement) {
            this._tooltipElement.style.opacity = '0';
            
            // Remove tooltip after animation
            setTimeout(() => {
                if (this._tooltipElement && this._tooltipElement.parentNode) {
                    this._tooltipElement.parentNode.removeChild(this._tooltipElement);
                    this._tooltipElement = null;
                }
            }, 200);
        }
        
        this._tooltipVisible = false;
    }

    disconnectedCallback() {
        // Clean up tooltip if component is removed
        if (this._tooltipElement && this._tooltipElement.parentNode) {
            this._tooltipElement.parentNode.removeChild(this._tooltipElement);
            this._tooltipElement = null;
        }
    }

    static get observedAttributes() {
        return ['label', 'tooltip', 'href', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get label() {
        return this.getAttribute('label');
    }

    set label(value) {
        value ? this.setAttribute('label', value) : this.removeAttribute('label');
    }

    get tooltip() {
        return this.getAttribute('tooltip');
    }

    set tooltip(value) {
        value ? this.setAttribute('tooltip', value) : this.removeAttribute('tooltip');
    }

    get href() {
        return this.getAttribute('href');
    }

    set href(value) {
        value ? this.setAttribute('href', value) : this.removeAttribute('href');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom elements
customElements.define('dock-component', DockComponent);
customElements.define('dock-item', DockItem);