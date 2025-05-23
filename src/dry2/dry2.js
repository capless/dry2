// Enhanced BaseWebComponent for dry2.js library
class BaseWebComponent extends HTMLElement {
    constructor() {
        super();

        // Internal state management
        this._state = new Proxy({}, {
            set: (target, prop, value) => {
                const oldValue = target[prop];
                target[prop] = value;
                if (oldValue !== value) {
                    this._onStateChange(prop, oldValue, value);
                }
                return true;
            }
        });

        // Event listeners registry for cleanup
        this._eventListeners = new Map();
        this._documentListeners = new Map();

        // Render tracking
        this._isRendered = false;
        this._renderCount = 0;

        // Mixin registry
        this._mixins = new Set();

        // Debounced render function
        this._debouncedRender = this._debounce(this._performRender.bind(this), 16);

        // Content management
        this._originalContent = null;
        this._namedSlots = new Map();
        this._preservedContent = null;
    }

    // ===== LIFECYCLE METHODS =====

    connectedCallback() {
        // Preserve original content before first render
        if (!this._isRendered) {
            this._preserveOriginalContent();
            this._performRender();
            this._onFirstConnect();
        }
        this._onConnect();
    }

    disconnectedCallback() {
        this._cleanupAllListeners();
        this._onDisconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._onAttributeChange(name, oldValue, newValue);
            this.scheduleRender();
        }
    }

    adoptedCallback() {
        this._onAdopted();
    }

    // ===== CORE RENDERING SYSTEM =====

    render() {
        // Override this method in subclasses
        return '';
    }

    _performRender() {
        try {
            this._beforeRender();
            const content = this.render();
            if (typeof content === 'string') {
                this.innerHTML = content;
            }
            this._isRendered = true;
            this._renderCount++;
            this._afterRender();
            this._emitEvent('rendered', { renderCount: this._renderCount });
        } catch (error) {
            this._handleRenderError(error);
        }
    }

    scheduleRender() {
        this._debouncedRender();
    }

    forceRender() {
        this._performRender();
    }

    // ===== STATE MANAGEMENT =====

    get state() {
        return this._state;
    }

    setState(newState, shouldRender = true) {
        Object.assign(this._state, newState);
        if (shouldRender) {
            this.scheduleRender();
        }
    }

    _onStateChange(prop, oldValue, newValue) {
        this._emitEvent('state-changed', { prop, oldValue, newValue });
    }

    // ===== ATTRIBUTE MANAGEMENT =====

    _onAttributeChange(name, oldValue, newValue) {
        // Convert kebab-case to camelCase for property mapping
        const propName = this._kebabToCamel(name);
        if (this[`_handle${this._capitalize(propName)}Change`]) {
            this[`_handle${this._capitalize(propName)}Change`](oldValue, newValue);
        }
        this._emitEvent('attribute-changed', { name, oldValue, newValue });
    }

    // ===== EVENT MANAGEMENT =====

    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, options);
        if (!this._eventListeners.has(type)) {
            this._eventListeners.set(type, []);
        }
        this._eventListeners.get(type).push({ listener, options });
    }

    addDocumentListener(type, listener, options) {
        document.addEventListener(type, listener, options);
        if (!this._documentListeners.has(type)) {
            this._documentListeners.set(type, []);
        }
        this._documentListeners.get(type).push({ listener, options });
    }

    _cleanupAllListeners() {
        // Clean up component listeners
        this._eventListeners.forEach((listeners, type) => {
            listeners.forEach(({ listener, options }) => {
                this.removeEventListener(type, listener, options);
            });
        });
        this._eventListeners.clear();

        // Clean up document listeners
        this._documentListeners.forEach((listeners, type) => {
            listeners.forEach(({ listener, options }) => {
                document.removeEventListener(type, listener, options);
            });
        });
        this._documentListeners.clear();
    }

    _emitEvent(name, detail = {}) {
        this.dispatchEvent(new CustomEvent(name, {
            bubbles: true,
            cancelable: true,
            detail: { component: this, ...detail }
        }));
    }

    // ===== CONTENT MANAGEMENT =====

    _preserveOriginalContent() {
        // Capture the original innerHTML before we modify it
        this._originalContent = this.innerHTML;
        console.log('BaseWebComponent _preserveOriginalContent called for:', this.constructor.name);
        console.log('Original innerHTML:', `"${this.innerHTML}"`);

        // Parse named slots
        this._parseNamedSlots();

        // Create a preserved content fragment for restoration
        const template = document.createElement('template');
        template.innerHTML = this._originalContent;
        this._preservedContent = template.content.cloneNode(true);
    }

    _parseNamedSlots() {
        this._namedSlots.clear();

        // Find all elements with slot attributes first
        const slottedElements = this.querySelectorAll('[slot]');
        slottedElements.forEach(element => {
            const slotName = element.getAttribute('slot');
            this._namedSlots.set(slotName, element.outerHTML);
        });

        // Handle default content (everything without a slot attribute)
        // We need to preserve both text nodes and elements
        let defaultContent = '';

        Array.from(this.childNodes).forEach(node => {
            // Skip elements that have a slot attribute (already processed)
            if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('slot')) {
                return;
            }

            // Handle element nodes
            if (node.nodeType === Node.ELEMENT_NODE) {
                defaultContent += node.outerHTML;
            }
            // Handle text nodes (preserve significant whitespace)
            else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                // Preserve any text that has content after trimming
                if (text.trim()) {
                    defaultContent += text;
                }
            }
            // Handle comment nodes and other types if needed
            else if (node.nodeType === Node.COMMENT_NODE) {
                defaultContent += `<!--${node.textContent}-->`;
            }
        });

        // Trim leading/trailing whitespace but preserve internal structure
        defaultContent = defaultContent.replace(/^\s+|\s+$/g, '');

        if (defaultContent) {
            this._namedSlots.set('default', defaultContent);
        }
    }

    // Enhanced method to get processed content
    getSlotContent(slotName = 'default', options = {}) {
        const {
            trim = true,
            preserveWhitespace = false,
            processText = null
        } = options;

        let content = this._namedSlots.get(slotName) || '';

        if (content && trim && !preserveWhitespace) {
            content = content.trim();
        }

        if (content && processText && typeof processText === 'function') {
            content = processText(content);
        }

        return content;
    }

    // Method to get only text content from a slot (strips HTML)
    getSlotTextContent(slotName = 'default') {
        const content = this.getSlotContent(slotName);
        if (!content) return '';

        // Create a temporary element to extract text content
        const temp = document.createElement('div');
        temp.innerHTML = content;
        return temp.textContent || temp.innerText || '';
    }

    // Method to check if slot contains only text (no HTML elements)
    isSlotTextOnly(slotName = 'default') {
        const content = this.getSlotContent(slotName);
        if (!content) return false;

        const temp = document.createElement('div');
        temp.innerHTML = content;
        return temp.children.length === 0;
    }

    // Enhanced render slot with better content handling
    renderSlot(slotName = 'default', fallback = '', options = {}) {
        const {
            wrapper = null,
            wrapperClass = '',
            processContent = null,
            escapeHtml = false
        } = options;

        let content = this.getSlotContent(slotName);

        if (!content && fallback) {
            content = fallback;
        }

        if (!content) return '';

        // Process content if processor provided
        if (processContent && typeof processContent === 'function') {
            content = processContent(content);
        }

        // Escape HTML if requested
        if (escapeHtml) {
            content = this.escapeHtml(content);
        }

        // Wrap content if wrapper specified
        if (wrapper) {
            const classAttr = wrapperClass ? ` class="${wrapperClass}"` : '';
            content = `<${wrapper}${classAttr}>${content}</${wrapper}>`;
        }

        return content;
    }

    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static sanitizeHtml(str) {
        return BaseWebComponent.escapeHtml(str);
    }

    escapeHtml(unsafe) {
        return BaseWebComponent.escapeHtml(unsafe);
    }

    sanitizeHtml(str) {
        return BaseWebComponent.sanitizeHtml(str);
    }

    _debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    _kebabToCamel(str) {
        return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
    }

    _camelToKebab(str) {
        return str.replace(/([A-Z])/g, '-$1').toLowerCase();
    }

    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ===== QUERY UTILITIES =====

    $(selector) {
        return this.querySelector(selector);
    }

    $$(selector) {
        return Array.from(this.querySelectorAll(selector));
    }

    findById(id) {
        return this.querySelector(`#${id}`);
    }

    findByClass(className) {
        return this.querySelector(`.${className}`);
    }

    findAllByClass(className) {
        return Array.from(this.querySelectorAll(`.${className}`));
    }

    // ===== ATTRIBUTE HELPERS =====

    getBooleanAttribute(name, defaultValue = false) {
        return this.hasAttribute(name) ?
            (this.getAttribute(name) !== 'false') : defaultValue;
    }

    getNumericAttribute(name, defaultValue = 0) {
        const value = this.getAttribute(name);
        return value ? Number(value) || defaultValue : defaultValue;
    }

    getArrayAttribute(name, delimiter = ',', defaultValue = []) {
        const value = this.getAttribute(name);
        return value ? value.split(delimiter).map(s => s.trim()) : defaultValue;
    }

    // ===== MIXIN SYSTEM =====

    static defineMixin(name, mixinObject) {
        if (!BaseWebComponent._mixinRegistry) {
            BaseWebComponent._mixinRegistry = new Map();
        }
        BaseWebComponent._mixinRegistry.set(name, mixinObject);
    }

    useMixin(name) {
        if (!BaseWebComponent._mixinRegistry || !BaseWebComponent._mixinRegistry.has(name)) {
            console.warn(`Mixin '${name}' not found`);
            return this;
        }

        if (this._mixins.has(name)) {
            return this; // Already applied
        }

        const mixin = BaseWebComponent._mixinRegistry.get(name);

        // Apply mixin methods
        Object.getOwnPropertyNames(mixin).forEach(prop => {
            if (prop !== 'constructor' && typeof mixin[prop] === 'function') {
                this[prop] = mixin[prop].bind(this);
            }
        });

        // Apply mixin properties
        if (mixin.properties) {
            Object.assign(this, mixin.properties);
        }

        // Call mixin initializer if it exists
        if (mixin.init && typeof mixin.init === 'function') {
            mixin.init.call(this);
        }

        this._mixins.add(name);
        return this;
    }

    // ===== LIFECYCLE HOOKS (Override in subclasses) =====

    _onFirstConnect() {
        // Called only on first connection
    }

    _onConnect() {
        // Called every time component is connected
    }

    _onDisconnect() {
        // Called when component is disconnected
    }

    _onAdopted() {
        // Called when component is moved to a new document
    }

    _beforeRender() {
        // Called before each render
    }

    _afterRender() {
        // Called after each render
    }

    _handleRenderError(error) {
        console.error('Render error in component:', this.constructor.name, error);
        this._emitEvent('render-error', { error });
    }
}

// ===== BUILT-IN MIXINS =====

// Keyboard navigation mixin
BaseWebComponent.defineMixin('keyboard', {
    init() {
        this._keyboardHandlers = new Map();
        this._boundHandleKeydown = this._handleKeydown.bind(this);
        this.addDocumentListener('keydown', this._boundHandleKeydown);
    },

    onKey(key, handler, options = {}) {
        const normalizedKey = key.toLowerCase();
        if (!this._keyboardHandlers.has(normalizedKey)) {
            this._keyboardHandlers.set(normalizedKey, []);
        }
        this._keyboardHandlers.get(normalizedKey).push({ handler, options });
        return this;
    },

    _handleKeydown(event) {
        const key = event.key.toLowerCase();
        if (this._keyboardHandlers.has(key)) {
            const handlers = this._keyboardHandlers.get(key);
            handlers.forEach(({ handler, options }) => {
                if (options.preventDefault !== false) {
                    event.preventDefault();
                }
                if (options.stopPropagation) {
                    event.stopPropagation();
                }
                handler.call(this, event);
            });
        }
    }
});

// Click outside mixin
BaseWebComponent.defineMixin('clickOutside', {
    init() {
        this._boundHandleClickOutside = this._handleClickOutside.bind(this);
        this.addDocumentListener('click', this._boundHandleClickOutside);
    },

    onClickOutside(handler) {
        this._clickOutsideHandler = handler;
        return this;
    },

    _handleClickOutside(event) {
        if (this._clickOutsideHandler && !this.contains(event.target)) {
            this._clickOutsideHandler.call(this, event);
        }
    }
});

// Animation mixin
BaseWebComponent.defineMixin('animation', {
    animate(element, keyframes, options = {}) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (!element) return Promise.resolve();

        return element.animate(keyframes, {
            duration: 300,
            easing: 'ease-in-out',
            ...options
        }).finished;
    },

    fadeIn(element, duration = 300) {
        return this.animate(element, [
            { opacity: 0 },
            { opacity: 1 }
        ], { duration });
    },

    fadeOut(element, duration = 300) {
        return this.animate(element, [
            { opacity: 1 },
            { opacity: 0 }
        ], { duration });
    },

    slideDown(element, duration = 300) {
        return this.animate(element, [
            { height: 0, overflow: 'hidden' },
            { height: `${element.scrollHeight}px`, overflow: 'hidden' }
        ], { duration });
    },

    slideUp(element, duration = 300) {
        return this.animate(element, [
            { height: `${element.scrollHeight}px`, overflow: 'hidden' },
            { height: 0, overflow: 'hidden' }
        ], { duration });
    }
});

// Validation mixin
BaseWebComponent.defineMixin('validation', {
    properties: {
        _validators: new Map(),
        _validationErrors: new Map()
    },

    addValidator(field, validator, message) {
        if (!this._validators.has(field)) {
            this._validators.set(field, []);
        }
        this._validators.get(field).push({ validator, message });
        return this;
    },

    validate(field) {
        if (!this._validators.has(field)) {
            return { valid: true, errors: [] };
        }

        const validators = this._validators.get(field);
        const errors = [];
        const value = this[field] || this.getAttribute(field) || '';

        validators.forEach(({ validator, message }) => {
            if (!validator(value)) {
                errors.push(message);
            }
        });

        const valid = errors.length === 0;
        if (valid) {
            this._validationErrors.delete(field);
        } else {
            this._validationErrors.set(field, errors);
        }

        this._emitEvent('validation', { field, valid, errors, value });
        return { valid, errors };
    },

    validateAll() {
        const fields = Array.from(this._validators.keys());
        const results = fields.map(field => ({ field, ...this.validate(field) }));
        const allValid = results.every(result => result.valid);

        this._emitEvent('validation-complete', { valid: allValid, results });
        return { valid: allValid, results };
    },

    getErrors(field) {
        return this._validationErrors.get(field) || [];
    },

    hasErrors(field) {
        return this._validationErrors.has(field);
    },

    clearErrors(field) {
        if (field) {
            this._validationErrors.delete(field);
        } else {
            this._validationErrors.clear();
        }
        this._emitEvent('errors-cleared', { field });
    }
});