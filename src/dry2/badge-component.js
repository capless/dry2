// Badge Component for DRY2 Web Components

class BadgeComponent extends BaseWebComponent {
    constructor() {
        super();
        this._visible = true;
    }

    render() {
        const variant = this.variant;
        const size = this.size;
        const position = this.position;
        const dot = this.dot;
        const visible = this._visible;
        
        // Check if badge should wrap content or stand alone
        const hasSlottedContent = this.hasChildNodes() && 
            (this.firstElementChild?.tagName !== 'SPAN' || 
            !this.firstElementChild?.classList.contains('badge-content'));
        
        // Badge classes based on variant, size, and position
        const badgeClasses = this.getBadgeClasses(variant, size, position, dot);
        
        // Generate badge content HTML
        let badgeHTML;
        let badgeContent = '';
        
        // If dot mode, just show a dot
        if (dot) {
            badgeContent = '';
        } else if (this.max && !isNaN(parseInt(this.textContent)) && parseInt(this.textContent) > this.max) {
            // If value exceeds max, show max+ format
            badgeContent = `${this.max}+`;
        } else {
            // Otherwise use the text content or capture content from slots
            badgeContent = this.textContent || '';
        }
        
        // Create badge element
        const badgeElement = `
            <span class="badge-content ${badgeClasses} ${!visible ? 'hidden' : ''}">
                ${badgeContent}
            </span>
        `;
        
        // If has slotted content, create a wrapper with positioned badge
        if (hasSlottedContent) {
            badgeHTML = `
                <span class="badge-wrapper inline-block relative">
                    <slot></slot>
                    ${badgeElement}
                </span>
            `;
        } else {
            // Standalone badge
            badgeHTML = badgeElement;
        }
        
        this.innerHTML = badgeHTML;
    }

    getBadgeClasses(variant, size, position, dot) {
        let classes = 'inline-flex items-center justify-center ';
        
        // Add variant classes
        switch (variant) {
            case 'success':
                classes += 'bg-green-500 text-white ';
                break;
            case 'danger':
                classes += 'bg-red-500 text-white ';
                break;
            case 'warning':
                classes += 'bg-yellow-500 text-gray-900 ';
                break;
            case 'info':
                classes += 'bg-blue-500 text-white ';
                break;
            default:
                // Default to primary
                classes += 'bg-blue-500 text-white ';
        }
        
        // Add size classes
        if (dot) {
            // Dot sizing
            switch (size) {
                case 'sm':
                    classes += 'h-2 w-2 ';
                    break;
                case 'lg':
                    classes += 'h-4 w-4 ';
                    break;
                default:
                    // Medium dot
                    classes += 'h-3 w-3 ';
            }
        } else {
            // Regular badge sizing
            switch (size) {
                case 'sm':
                    classes += 'text-xs px-1.5 min-w-[18px] h-[18px] ';
                    break;
                case 'lg':
                    classes += 'text-sm px-2.5 min-w-[24px] h-[24px] ';
                    break;
                default:
                    // Medium badge
                    classes += 'text-xs px-2 min-w-[20px] h-[20px] ';
            }
        }
        
        // Always rounded for badges
        classes += 'rounded-full ';
        
        // If has position, add appropriate positioning classes
        if (position && position !== 'standalone') {
            classes += 'absolute ';
            
            switch (position) {
                case 'top-right':
                    classes += 'top-0 right-0 transform translate-x-1/2 -translate-y-1/2 ';
                    break;
                case 'top-left':
                    classes += 'top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 ';
                    break;
                case 'bottom-right':
                    classes += 'bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 ';
                    break;
                case 'bottom-left':
                    classes += 'bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2 ';
                    break;
            }
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    static get observedAttributes() {
        return ['variant', 'size', 'position', 'dot', 'max', 'visible', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'visible') {
                this._visible = newValue !== 'false' && newValue !== null;
            }
            
            if (this.isConnected) {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get variant() {
        return this.getAttribute('variant') || 'primary';
    }

    set variant(value) {
        this.setAttribute('variant', value);
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    set size(value) {
        this.setAttribute('size', value);
    }

    get position() {
        return this.getAttribute('position') || 'standalone';
    }

    set position(value) {
        this.setAttribute('position', value);
    }

    get dot() {
        return this.hasAttribute('dot');
    }

    set dot(value) {
        value ? this.setAttribute('dot', '') : this.removeAttribute('dot');
    }

    get max() {
        return this.getAttribute('max');
    }

    set max(value) {
        value ? this.setAttribute('max', value) : this.removeAttribute('max');
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        this._visible = Boolean(value);
        this._visible ? this.removeAttribute('visible') : this.setAttribute('visible', 'false');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    // Methods for programmatically showing/hiding badge
    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this._visible;
    }
}

// Define the custom element
customElements.define('badge-component', BadgeComponent);