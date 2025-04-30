// Card Component for DRY2 Web Components

class CardComponent extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const elevation = this.elevation;
        const variant = this.variant;
        const interactive = this.interactive;
        const layout = this.layout;
        
        // Get card classes
        const cardClasses = this.getCardClasses(elevation, variant, interactive, layout);
        
        // Process slotted content
        const headerSlot = `<div class="card-header ${this.headerClass}"><slot name="header"></slot></div>`;
        const mediaSlot = `<div class="card-media ${this.mediaClass}"><slot name="media"></slot></div>`;
        const bodySlot = `<div class="card-body ${this.bodyClass}"><slot name="body"></slot></div>`;
        const footerSlot = `<div class="card-footer ${this.footerClass}"><slot name="footer"></slot></div>`;
        
        // Default slot goes to body if no specific slot is provided
        const defaultSlot = `<div class="card-body ${this.bodyClass}"><slot></slot></div>`;
        
        // Create layout based on configuration
        let cardContent;
        
        // Determine if we have each type of content
        const hasHeader = this.querySelector('[slot="header"]') !== null;
        const hasMedia = this.querySelector('[slot="media"]') !== null;
        const hasBody = this.querySelector('[slot="body"]') !== null || !hasHeader || !hasMedia || !this.querySelector('[slot="footer"]');
        const hasFooter = this.querySelector('[slot="footer"]') !== null;
        
        if (layout === 'horizontal') {
            cardContent = `
                <div class="card-container flex ${cardClasses}">
                    ${hasMedia ? mediaSlot : ''}
                    <div class="card-content flex flex-col flex-grow">
                        ${hasHeader ? headerSlot : ''}
                        ${hasBody ? (hasBody ? bodySlot : defaultSlot) : ''}
                        ${hasFooter ? footerSlot : ''}
                    </div>
                </div>
            `;
        } else {
            cardContent = `
                <div class="card-container flex flex-col ${cardClasses}">
                    ${hasHeader ? headerSlot : ''}
                    ${hasMedia ? mediaSlot : ''}
                    ${hasBody ? (hasBody ? bodySlot : defaultSlot) : ''}
                    ${hasFooter ? footerSlot : ''}
                </div>
            `;
        }
        
        this.innerHTML = cardContent;
        
        // If interactive, add event listeners
        if (interactive) {
            this.setupInteractivity();
        }
    }

    getCardClasses(elevation, variant, interactive, layout) {
        let classes = 'card overflow-hidden ';
        
        // Add elevation/shadow classes
        switch (elevation) {
            case 'none':
                classes += 'shadow-none ';
                break;
            case 'sm':
                classes += 'shadow-sm ';
                break;
            case 'lg':
                classes += 'shadow-lg ';
                break;
            case 'xl':
                classes += 'shadow-xl ';
                break;
            default:
                // Default medium shadow
                classes += 'shadow ';
        }
        
        // Add variant/color classes
        switch (variant) {
            case 'outlined':
                classes += 'border border-gray-200 bg-white ';
                break;
            case 'filled':
                classes += 'bg-gray-100 ';
                break;
            default:
                // Default is white background
                classes += 'bg-white ';
        }
        
        // Add classes for interactivity
        if (interactive) {
            classes += 'cursor-pointer transition-shadow duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ';
        }
        
        // Add border radius
        classes += 'rounded-lg ';
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    setupInteractivity() {
        this.setAttribute('tabindex', '0');
        
        this.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('card:click', {
                bubbles: true,
                detail: { card: this }
            }));
        });
        
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.dispatchEvent(new CustomEvent('card:click', {
                    bubbles: true,
                    detail: { card: this }
                }));
            }
        });
    }

    static get observedAttributes() {
        return [
            'elevation', 'variant', 'interactive', 'layout', 'class',
            'header-class', 'media-class', 'body-class', 'footer-class'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get elevation() {
        return this.getAttribute('elevation') || 'md';
    }

    set elevation(value) {
        this.setAttribute('elevation', value);
    }

    get variant() {
        return this.getAttribute('variant') || 'default';
    }

    set variant(value) {
        this.setAttribute('variant', value);
    }

    get interactive() {
        return this.hasAttribute('interactive');
    }

    set interactive(value) {
        value ? this.setAttribute('interactive', '') : this.removeAttribute('interactive');
    }

    get layout() {
        return this.getAttribute('layout') || 'vertical';
    }

    set layout(value) {
        this.setAttribute('layout', value);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    get headerClass() {
        return this.getAttribute('header-class') || 'p-4 border-b border-gray-200 font-medium';
    }

    set headerClass(value) {
        value ? this.setAttribute('header-class', value) : this.removeAttribute('header-class');
    }

    get mediaClass() {
        return this.getAttribute('media-class') || '';
    }

    set mediaClass(value) {
        value ? this.setAttribute('media-class', value) : this.removeAttribute('media-class');
    }

    get bodyClass() {
        return this.getAttribute('body-class') || 'p-4';
    }

    set bodyClass(value) {
        value ? this.setAttribute('body-class', value) : this.removeAttribute('body-class');
    }

    get footerClass() {
        return this.getAttribute('footer-class') || 'p-4 border-t border-gray-200 bg-gray-50';
    }

    set footerClass(value) {
        value ? this.setAttribute('footer-class', value) : this.removeAttribute('footer-class');
    }
}

// Define the custom element
customElements.define('card-component', CardComponent);