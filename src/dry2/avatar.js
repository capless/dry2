class Avatar extends BaseWebComponent {
    constructor() {
        super();

        // State initialization
        this.setState({
            imageLoaded: false,
            imageError: false,
            isLoading: false
        });

        // Track current image loading
        this._currentImageSrc = null;
        this._imageLoader = null;

        // Bind methods
        this._handleImageLoad = this._handleImageLoad.bind(this);
        this._handleImageError = this._handleImageError.bind(this);
    }

    static get observedAttributes() {
        return ['src', 'name', 'initials', 'size', 'shape', 'alt', 'class'];
    }

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute('role', 'img');
        this._updateAriaLabel();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._cleanupImageLoader();
    }

    render() {
        const containerClasses = this._getContainerClasses();
        const src = this.getAttribute('src');
        const hasImage = src && !this.state.imageError;

        return `
            <div class="${containerClasses}">
                ${hasImage ? this._renderImage() : ''}
                ${!hasImage ? this._renderFallback() : ''}
                ${this._renderSlotContent()}
                ${this.state.isLoading ? this._renderLoadingState() : ''}
            </div>
        `;
    }

    _renderImage() {
        const src = this.getAttribute('src');
        const alt = this.getAttribute('alt') || this._getGeneratedAltText();

        return `
            <img 
                class="avatar-image w-full h-full object-cover" 
                src="${this.escapeHtml(src)}" 
                alt="${this.escapeHtml(alt)}"
                style="display: ${this.state.imageLoaded ? 'block' : 'none'}"
            />
        `;
    }

    _renderFallback() {
        const initials = this._getInitials();
        const fallbackClasses = this._getFallbackClasses();

        if (initials) {
            return `
                <div class="${fallbackClasses}">
                    <span class="avatar-initials font-medium select-none">
                        ${this.escapeHtml(initials)}
                    </span>
                </div>
            `;
        }

        // Default icon fallback
        return `
            <div class="${fallbackClasses}">
                <svg class="avatar-icon" fill="currentColor" viewBox="0 0 24 24" width="60%" height="60%">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>
        `;
    }

    _renderSlotContent() {
        const slotContent = this.getSlotContent('default');
        if (!slotContent) return '';

        return `
            <div class="avatar-slot absolute inset-0 flex items-center justify-center">
                ${slotContent}
            </div>
        `;
    }

    _renderLoadingState() {
        return `
            <div class="avatar-loading absolute inset-0 flex items-center justify-center bg-gray-100">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            </div>
        `;
    }

    _getContainerClasses() {
        const size = this.size;
        const shape = this.shape;
        const customClasses = this.getAttribute('class') || '';

        const sizeClasses = {
            'xs': 'h-6 w-6 text-xs',
            'sm': 'h-8 w-8 text-sm',
            'md': 'h-10 w-10 text-base',
            'lg': 'h-12 w-12 text-lg',
            'xl': 'h-16 w-16 text-xl'
        };

        const shapeClasses = {
            'circle': 'rounded-full',
            'square': 'rounded-none',
            'rounded': 'rounded-lg'
        };

        const baseClasses = 'avatar-component relative inline-flex items-center justify-center overflow-hidden bg-gray-100 text-gray-600';
        const dimensionClass = sizeClasses[size] || sizeClasses['md'];
        const shapeClass = shapeClasses[shape] || shapeClasses['circle'];

        return `${baseClasses} ${dimensionClass} ${shapeClass} ${customClasses}`.trim();
    }

    _getFallbackClasses() {
        return 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white';
    }

    _getInitials() {
        // Priority: explicit initials > generated from name
        const explicitInitials = this.getAttribute('initials');
        if (explicitInitials) {
            return explicitInitials.toUpperCase().substring(0, 2);
        }

        const name = this.getAttribute('name');
        if (name) {
            return this._generateInitialsFromName(name);
        }

        return null;
    }

    _generateInitialsFromName(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            // Single name - take first two characters
            return parts[0].substring(0, 2).toUpperCase();
        } else {
            // Multiple names - take first letter of first and last name
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    }

    _getGeneratedAltText() {
        const name = this.getAttribute('name');
        if (name) {
            return `Avatar for ${name}`;
        }

        const initials = this.getAttribute('initials');
        if (initials) {
            return `Avatar with initials ${initials}`;
        }

        return 'User avatar';
    }

    _updateAriaLabel() {
        if (!this.getAttribute('aria-label')) {
            this.setAttribute('aria-label', this._getGeneratedAltText());
        }
    }

    // Event handlers
    _handleImageLoad() {
        // Only process if this is for the current image
        if (this._imageLoader && this._imageLoader.src === this._currentImageSrc) {
            this.setState({
                imageLoaded: true,
                imageError: false,
                isLoading: false
            });
            this._emitEvent('image-loaded');
            this._cleanupImageLoader();
        }
    }

    _handleImageError() {
        // Only process if this is for the current image
        if (this._imageLoader && this._imageLoader.src === this._currentImageSrc) {
            this.setState({
                imageLoaded: false,
                imageError: true,
                isLoading: false
            });
            this._emitEvent('image-error');
            this._cleanupImageLoader();
        }
    }

    // Attribute change handlers
    _handleSrcChange(oldValue, newValue) {
        // Clean up any existing image loader
        this._cleanupImageLoader();

        if (newValue && newValue !== this._currentImageSrc) {
            this._currentImageSrc = newValue;
            this.setState({
                imageLoaded: false,
                imageError: false,
                isLoading: true
            });
            this._loadImage(newValue);
        } else if (!newValue) {
            this._currentImageSrc = null;
            this.setState({
                imageLoaded: false,
                imageError: false,
                isLoading: false
            });
        }
    }

    _handleNameChange(oldValue, newValue) {
        this._updateAriaLabel();
    }

    _handleInitialsChange(oldValue, newValue) {
        this._updateAriaLabel();
    }

    _handleAltChange(oldValue, newValue) {
        const imageElement = this.$('.avatar-image');
        if (imageElement) {
            imageElement.alt = newValue || this._getGeneratedAltText();
        }
    }

    // Private methods
    _loadImage(src) {
        // Don't load the same image twice
        if (this._currentImageSrc !== src) {
            return;
        }

        this._imageLoader = new Image();
        this._imageLoader.onload = this._handleImageLoad;
        this._imageLoader.onerror = this._handleImageError;
        this._imageLoader.src = src;
    }

    _cleanupImageLoader() {
        if (this._imageLoader) {
            this._imageLoader.onload = null;
            this._imageLoader.onerror = null;
            this._imageLoader = null;
        }
    }

    _afterRender() {
        super._afterRender();

        // Handle initial image load if src is present and we haven't started loading
        const src = this.getAttribute('src');
        if (src && !this.state.imageLoaded && !this.state.imageError && !this.state.isLoading && !this._imageLoader) {
            this._currentImageSrc = src;
            this.setState({ isLoading: true });
            this._loadImage(src);
        }
    }

    // Getters for common properties
    get size() {
        return this.getAttribute('size') || 'md';
    }

    get shape() {
        return this.getAttribute('shape') || 'circle';
    }

    get src() {
        return this.getAttribute('src');
    }

    get name() {
        return this.getAttribute('name');
    }

    get initials() {
        return this.getAttribute('initials');
    }

    // Public API methods
    setImage(src, alt = null) {
        this.setAttribute('src', src);
        if (alt) {
            this.setAttribute('alt', alt);
        }
        return this;
    }

    setName(name) {
        this.setAttribute('name', name);
        return this;
    }

    setInitials(initials) {
        this.setAttribute('initials', initials);
        return this;
    }

    setSize(size) {
        this.setAttribute('size', size);
        return this;
    }

    setShape(shape) {
        this.setAttribute('shape', shape);
        return this;
    }

    // Add validation mixin for common validations
    _onFirstConnect() {
        super._onFirstConnect();

        // Use validation mixin
        this.useMixin('validation');

        // Add common validators
        this.addValidator('size', (value) => {
            return ['xs', 'sm', 'md', 'lg', 'xl'].includes(value);
        }, 'Size must be one of: xs, sm, md, lg, xl');

        this.addValidator('shape', (value) => {
            return ['circle', 'square', 'rounded'].includes(value);
        }, 'Shape must be one of: circle, square, rounded');
    }
}

// Register the component
customElements.define('dry-avatar', Avatar);