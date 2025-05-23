class ToggleSwitch extends BaseWebComponent {
    constructor() {
        super();

        // Initialize state
        this.setState({
            checked: false,
            disabled: false
        });

        // Bind event handlers
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handleKeydown = this._handleKeydown.bind(this);
    }

    static get observedAttributes() {
        return [
            'checked',
            'disabled',
            'name',
            'value',
            'size',
            'label',
            'active-color',
            'inactive-color',
            'active-bg',
            'inactive-bg',
            'switch-color',
            'class'
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        this._initializeState();
        this._setupAccessibility();
    }

    render() {
        const containerClasses = this._getContainerClasses();
        const switchClasses = this._getSwitchClasses();
        const trackClasses = this._getTrackClasses();
        const thumbClasses = this._getThumbClasses();

        const inputId = this._generateInputId();
        const name = this.getAttribute('name') || '';
        const value = this.getAttribute('value') || 'true';
        const label = this.getAttribute('label');

        return `
            <div class="${containerClasses}">
                ${label ? `<label for="${inputId}" class="toggle-label text-sm font-medium text-gray-700 mr-3">${this.escapeHtml(label)}</label>` : ''}
                <div class="${switchClasses}">
                    <input 
                        type="checkbox" 
                        id="${inputId}"
                        name="${this.escapeHtml(name)}"
                        value="${this.escapeHtml(value)}"
                        ${this.state.checked ? 'checked' : ''}
                        ${this.state.disabled ? 'disabled' : ''}
                        class="toggle-input sr-only"
                    />
                    <div class="${trackClasses}">
                        <div class="${thumbClasses}"></div>
                    </div>
                </div>
                ${this._renderSlotContent()}
            </div>
        `;
    }

    _renderSlotContent() {
        const slotContent = this.getSlotContent('default');
        if (!slotContent) return '';

        return `<div class="toggle-slot ml-3">${slotContent}</div>`;
    }

    _getContainerClasses() {
        const customClasses = this.getAttribute('class') || '';
        const label = this.getAttribute('label');

        const baseFlex = 'flex items-center';

        return `toggle-switch ${baseFlex} ${customClasses}`.trim();
    }

    _getSwitchClasses() {
        return 'toggle-switch-container relative inline-flex items-center';
    }

    _getTrackClasses() {
        const size = this.size;
        const disabled = this.state.disabled;

        const sizeClasses = {
            'sm': 'w-8 h-4',
            'md': 'w-10 h-6',
            'lg': 'w-12 h-7'
        };

        const activeColor = this.getAttribute('active-bg') || this.getAttribute('active-color') || 'bg-blue-500';
        const inactiveColor = this.getAttribute('inactive-bg') || this.getAttribute('inactive-color') || 'bg-gray-300';

        const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
        const sizeClass = sizeClasses[size] || sizeClasses['md'];
        const colorClass = this.state.checked ? activeColor : inactiveColor;

        return `toggle-track relative inline-block rounded-full transition-colors duration-800 ease-in-out ${sizeClass} ${colorClass} ${disabledClass}`;
    }

    _getThumbClasses() {
        const size = this.size;
        const disabled = this.state.disabled;

        const sizeSpecs = {
            'sm': {
                size: 'w-3 h-3',
                translateChecked: 'translate-x-4',
                translateUnchecked: 'translate-x-0',
                position: 'top-0.5 left-0.5'
            },
            'md': {
                size: 'w-4 h-4',
                translateChecked: 'translate-x-4',
                translateUnchecked: 'translate-x-0',
                position: 'top-1 left-1'
            },
            'lg': {
                size: 'w-5 h-5',
                translateChecked: 'translate-x-5',
                translateUnchecked: 'translate-x-0',
                position: 'top-1 left-1'
            }
        };

        const specs = sizeSpecs[size] || sizeSpecs['md'];
        const switchColor = this.getAttribute('switch-color') || 'bg-white';
        const shadowClass = disabled ? '' : 'shadow-sm';
        const translateClass = this.state.checked ? specs.translateChecked : specs.translateUnchecked;

        return `toggle-thumb absolute ${specs.position} rounded-full transition-all duration-300 ease-out ${switchColor} ${specs.size} ${translateClass} ${shadowClass}`;
    }

    _afterRender() {
        super._afterRender();
        this._attachEventListeners();
    }

    _attachEventListeners() {
        const input = this.$('.toggle-input');
        const track = this.$('.toggle-track');

        if (input) {
            input.removeEventListener('change', this._handleInputChange);
            input.addEventListener('change', this._handleInputChange);

            input.removeEventListener('keydown', this._handleKeydown);
            input.addEventListener('keydown', this._handleKeydown);
        }

        if (track) {
            track.removeEventListener('click', this._handleTrackClick.bind(this));
            track.addEventListener('click', this._handleTrackClick.bind(this));
        }
    }

    _handleTrackClick(event) {
        if (this.state.disabled) return;

        // Find and focus the input to trigger the change
        const input = this.$('.toggle-input');
        if (input) {
            input.focus();
            input.click();
        }
    }

    _handleInputChange(event) {
        if (this.state.disabled) {
            event.preventDefault();
            return;
        }

        const newChecked = event.target.checked;
        this.setState({ checked: newChecked });

        // Emit custom event
        this._emitEvent('toggle:changed', {
            checked: newChecked,
            value: newChecked ? this.getAttribute('value') || 'true' : 'false',
            name: this.getAttribute('name')
        });
    }

    _handleKeydown(event) {
        if (this.state.disabled) return;

        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            this.toggle();
        }
    }

    // Attribute change handlers
    _handleCheckedChange(oldValue, newValue) {
        this.setState({ checked: this.getBooleanAttribute('checked') });
    }

    _handleDisabledChange(oldValue, newValue) {
        this.setState({ disabled: this.getBooleanAttribute('disabled') });
        this._updateAccessibility();
    }

    _handleSizeChange(oldValue, newValue) {
        // Validate size
        const validSizes = ['sm', 'md', 'lg'];
        if (newValue && !validSizes.includes(newValue)) {
            console.warn(`Invalid size "${newValue}". Valid sizes are: ${validSizes.join(', ')}`);
        }
    }

    // Private helper methods
    _initializeState() {
        const checked = this.getBooleanAttribute('checked');
        const disabled = this.getBooleanAttribute('disabled');

        this.setState({ checked, disabled }, false);
    }

    _setupAccessibility() {
        this.setAttribute('role', 'switch');
        this._updateAccessibility();
    }

    _updateAccessibility() {
        this.setAttribute('aria-checked', this.state.checked.toString());
        this.setAttribute('aria-disabled', this.state.disabled.toString());

        const label = this.getAttribute('label');
        if (label && !this.getAttribute('aria-label')) {
            this.setAttribute('aria-label', label);
        }
    }

    _generateInputId() {
        if (this.id) {
            return `${this.id}-input`;
        }
        return `toggle-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API methods
    toggle() {
        if (this.state.disabled) return this;

        const newChecked = !this.state.checked;
        this.checked = newChecked;
        return this;
    }

    check() {
        if (this.state.disabled) return this;
        this.checked = true;
        return this;
    }

    uncheck() {
        if (this.state.disabled) return this;
        this.checked = false;
        return this;
    }

    enable() {
        this.disabled = false;
        return this;
    }

    disable() {
        this.disabled = true;
        return this;
    }

    // Getters and setters
    get checked() {
        return this.state.checked;
    }

    set checked(value) {
        const boolValue = Boolean(value);
        this.setState({ checked: boolValue });

        if (boolValue) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }

        this._updateAccessibility();

        // Update the actual input element
        const input = this.$('.toggle-input');
        if (input) {
            input.checked = boolValue;
        }
    }

    get disabled() {
        return this.state.disabled;
    }

    set disabled(value) {
        const boolValue = Boolean(value);
        this.setState({ disabled: boolValue });

        if (boolValue) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }

        this._updateAccessibility();
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    set size(value) {
        if (value) {
            this.setAttribute('size', value);
        } else {
            this.removeAttribute('size');
        }
    }

    get value() {
        return this.state.checked ? (this.getAttribute('value') || 'true') : 'false';
    }

    get name() {
        return this.getAttribute('name') || '';
    }

    set name(value) {
        if (value) {
            this.setAttribute('name', value);
        } else {
            this.removeAttribute('name');
        }
    }

    // Form integration
    get form() {
        return this.closest('form');
    }

    // For form data collection
    get type() {
        return 'checkbox';
    }

    // Validation integration
    _onFirstConnect() {
        super._onFirstConnect();

        // Use validation mixin for form validation
        this.useMixin('validation');

        // Add size validator
        this.addValidator('size', (value) => {
            return !value || ['sm', 'md', 'lg'].includes(value);
        }, 'Size must be one of: sm, md, lg');
    }
}

// Register the component
customElements.define('toggle-switch', ToggleSwitch);