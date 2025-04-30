// Swap Component for DRY2 Web Components

class SwapComponent extends BaseWebComponent {
    constructor() {
        super();
        this._active = false;
    }

    render() {
        // Get container classes based on attributes
        const containerClasses = this.getContainerClasses(this.size, this.disabled);

        // Create the swap component HTML structure without Alpine.js
        const swapHTML = `
            <div 
                class="${containerClasses}" 
                role="button" 
                tabindex="${this.disabled ? -1 : 0}"
                data-swap-container
            >
                <div class="swap-icon-container transition-all duration-300 ease-in-out">
                    <div class="swap-icon ${this._active ? 'hidden' : ''}">${this.iconOff}</div>
                    <div class="swap-icon ${this._active ? '' : 'hidden'}">${this.iconOn}</div>
                </div>
            </div>
        `;

        this.innerHTML = swapHTML;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const container = this.querySelector('[data-swap-container]');
        if (container) {
            container.addEventListener('click', this.handleClick.bind(this));
            container.addEventListener('keydown', this.handleKeydown.bind(this));
        }
    }

    handleClick(event) {
        if (!this.disabled) {
            this.toggle();
        }
    }

    handleKeydown(event) {
        if (!this.disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            this.toggle();
        }
    }

    toggle() {
        this.active = !this._active;
    }

    getContainerClasses(size, disabled) {
        let classes = 'inline-flex items-center justify-center ';
        
        // Add disabled styling
        if (disabled) {
            classes += 'opacity-50 cursor-not-allowed ';
        } else {
            classes += 'cursor-pointer hover:scale-110 transition-transform duration-200 ';
        }
        
        // Add size classes
        switch (size) {
            case 'small':
                classes += 'h-4 w-4 ';
                break;
            case 'large':
                classes += 'h-8 w-8 ';
                break;
            default:
                // Default to medium size
                classes += 'h-6 w-6 ';
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    static get observedAttributes() {
        return ['icon-on', 'icon-off', 'active', 'disabled', 'size', 'class', 'transition'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'active') {
                this._active = newValue !== null;
            }
            if (name === 'disabled') {
                this._disabled = newValue !== null;
            }
            
            // Re-render to update the DOM
            if (this.isConnected) {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get iconOn() {
        return this.getAttribute('icon-on') || 
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>';
    }

    set iconOn(value) {
        this.setAttribute('icon-on', value);
    }

    get iconOff() {
        return this.getAttribute('icon-off') || 
            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>';
    }

    set iconOff(value) {
        this.setAttribute('icon-off', value);
    }

    get active() {
        return this._active;
    }

    set active(value) {
        const shouldActivate = Boolean(value);
        if (this._active !== shouldActivate) {
            this._active = shouldActivate;
            
            // Update attribute
            if (this._active) {
                this.setAttribute('active', '');
            } else {
                this.removeAttribute('active');
            }
            
            // Update DOM if connected
            if (this.isConnected) {
                const iconOff = this.querySelector('.swap-icon:first-child');
                const iconOn = this.querySelector('.swap-icon:last-child');
                
                if (iconOff && iconOn) {
                    if (this._active) {
                        iconOff.classList.add('hidden');
                        iconOn.classList.remove('hidden');
                    } else {
                        iconOff.classList.remove('hidden');
                        iconOn.classList.add('hidden');
                    }
                }
                
                // Dispatch event for state change
                this.dispatchEvent(new CustomEvent('swap:change', {
                    bubbles: true,
                    detail: { active: this._active }
                }));
            }
        }
    }

    get disabled() {
        return this.hasAttribute('disabled');
    }

    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
        
        // Update tabindex if connected
        if (this.isConnected) {
            const container = this.querySelector('[data-swap-container]');
            if (container) {
                container.setAttribute('tabindex', value ? '-1' : '0');
            }
        }
    }

    get size() {
        return this.getAttribute('size') || 'medium';
    }

    set size(value) {
        this.setAttribute('size', value);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    get transition() {
        return this.getAttribute('transition') || 'fade';
    }

    set transition(value) {
        this.setAttribute('transition', value);
    }
}

// Define the custom element
customElements.define('swap-component', SwapComponent);