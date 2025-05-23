class BadgeComponent extends BaseWebComponent {
    constructor() {
        super();
        this._visible = true;
        this._isInitialized = false;
    }

    static get observedAttributes() {
        // Only observe attributes we actually need
        return ['variant', 'size', 'position', 'dot', 'max', 'visible'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Prevent infinite loops by checking if component is ready
        if (oldValue !== newValue && this._isInitialized) {
            this._handleAttributeChange(name, oldValue, newValue);
        }
    }

    _handleAttributeChange(name, oldValue, newValue) {
        if (name === 'visible') {
            this._visible = newValue !== 'false';
        }

        // Use a timeout to batch updates and prevent excessive renders
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }

        this._updateTimeout = setTimeout(() => {
            this._updateDisplay();
            this._updateTimeout = null;
        }, 0);
    }

    connectedCallback() {
        // Don't call super.connectedCallback() to avoid the innerHTML issue
        if (!this._isInitialized) {
            this._initialize();
        }
    }

    _initialize() {
        // Store original content
        this._originalContent = this.textContent || this.innerHTML;

        // Set up the badge
        this._updateDisplay();
        this._isInitialized = true;
    }

    _updateDisplay() {
        const variant = this.getAttribute('variant') || 'primary';
        const size = this.getAttribute('size') || 'md';
        const position = this.getAttribute('position') || 'standalone';
        const isDot = this.hasAttribute('dot');
        const max = this.getAttribute('max');
        const visible = this._visible;

        // Variant styles
        const variantStyles = {
            primary: 'bg-blue-500 text-white',
            success: 'bg-green-500 text-white',
            danger: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-cyan-500 text-white'
        };

        // Size styles
        const sizeStyles = {
            sm: isDot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
            md: isDot ? 'w-3 h-3' : 'px-2.5 py-1 text-sm',
            lg: isDot ? 'w-4 h-4' : 'px-3 py-1.5 text-base'
        };

        // Position styles
        const positionStyles = {
            standalone: 'relative',
            'top-right': 'absolute -top-1 -right-1',
            'top-left': 'absolute -top-1 -left-1',
            'bottom-right': 'absolute -bottom-1 -right-1',
            'bottom-left': 'absolute -bottom-1 -left-1'
        };

        // Handle content and max values
        let displayContent = this._originalContent;
        if (max && !isDot && displayContent) {
            const numericContent = parseInt(displayContent, 10);
            if (!isNaN(numericContent) && numericContent > parseInt(max, 10)) {
                displayContent = `${max}+`;
            }
        }

        // Build classes
        const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full';
        const classes = [
            baseClasses,
            variantStyles[variant] || variantStyles.primary,
            sizeStyles[size] || sizeStyles.md,
            positionStyles[position] || positionStyles.standalone
        ].join(' ');

        // Update the element safely
        this.className = classes;
        this.style.display = visible ? '' : 'none';

        // Update content without triggering DOM mutations
        if (!isDot && displayContent) {
            // Only update if content actually changed
            if (this.textContent !== displayContent) {
                this.textContent = displayContent;
            }
        } else if (isDot) {
            // Clear content for dot badges
            if (this.textContent !== '') {
                this.textContent = '';
            }
        }

        // Handle parent positioning
        if (position !== 'standalone' && this.parentElement) {
            const parentStyle = getComputedStyle(this.parentElement);
            if (parentStyle.position === 'static') {
                this.parentElement.style.position = 'relative';
            }
        }
    }

    // Public API methods
    show() {
        this._visible = true;
        this.setAttribute('visible', 'true');
    }

    hide() {
        this._visible = false;
        this.setAttribute('visible', 'false');
    }

    toggle() {
        if (this._visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Getters and setters
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

    get isDot() {
        return this.hasAttribute('dot');
    }

    set isDot(value) {
        if (value) {
            this.setAttribute('dot', '');
        } else {
            this.removeAttribute('dot');
        }
    }

    get max() {
        return this.getAttribute('max');
    }

    set max(value) {
        this.setAttribute('max', value);
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        if (value) {
            this.show();
        } else {
            this.hide();
        }
    }

    // Override render to prevent BaseWebComponent from interfering
    render() {
        // Return empty string to prevent innerHTML manipulation
        return '';
    }

    // Cleanup
    disconnectedCallback() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
            this._updateTimeout = null;
        }
    }
}

// Register the custom element
customElements.define('dry-badge', BadgeComponent);