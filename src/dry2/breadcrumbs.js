// Working Breadcrumbs Component for DRY2 Web Components

class Breadcrumbs extends HTMLElement {
    constructor() {
        super();
        this._items = [];
        this._isConnected = false;
    }

    static get observedAttributes() {
        return ['separator', 'breadcrumb_class'];
    }

    connectedCallback() {
        if (!this._isConnected) {
            this._isConnected = true;
            // Give the DOM time to parse child elements
            setTimeout(() => {
                this._processItems();
                this._render();
            }, 0);
        }
    }

    disconnectedCallback() {
        this._isConnected = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._isConnected) {
            setTimeout(() => this._render(), 0);
        }
    }

    _processItems() {
        // Find all breadcrumb-item children
        this._items = Array.from(this.querySelectorAll('breadcrumb-item'));

        // Mark the last item as active if not explicitly set
        if (this._items.length > 0) {
            const lastItem = this._items[this._items.length - 1];
            if (!lastItem.hasAttribute('active')) {
                lastItem.setAttribute('active', '');
            }
        }
    }

    _render() {
        if (!this._isConnected) return;

        // Apply container classes
        const containerClasses = `
            breadcrumbs-container flex flex-wrap items-center ${this.getAttribute('breadcrumb_class') || ''}
        `.trim();

        // If no processed items, just render empty structure
        if (this._items.length === 0) {
            this.innerHTML = `
                <nav class="${containerClasses}" aria-label="Breadcrumbs">
                    <ol class="flex flex-wrap items-center w-full">
                        <slot></slot>
                    </ol>
                </nav>
            `;
            this._processFontAwesome();
            return;
        }

        // Create breadcrumbs HTML with separators
        const breadcrumbsHTML = this._items.map((item, index) => {
            const separator = index > 0 ? this._createSeparator() : '';
            return separator + this._renderItem(item, index);
        }).join('');

        this.innerHTML = `
            <nav class="${containerClasses}" aria-label="Breadcrumbs">
                <ol class="flex flex-wrap items-center w-full">
                    ${breadcrumbsHTML}
                </ol>
            </nav>
        `;

        // Process Font Awesome icons after DOM update
        this._processFontAwesome();
    }

    _renderItem(item, index) {
        const href = item.getAttribute('href');
        const icon = item.getAttribute('icon');
        const active = item.hasAttribute('active');
        const content = item.innerHTML || item.textContent || '';

        // Simple icon handling - only support CSS class icons (HTML)
        const iconHTML = icon ? `<span class="breadcrumb-icon mr-2">${icon}</span>` : '';

        // Determine classes
        const itemClasses = active
            ? 'text-gray-700 font-medium'
            : 'text-gray-500 hover:text-blue-600';

        if (active) {
            return `<li class="breadcrumb-item"><span class="flex items-center ${itemClasses}" aria-current="page">${iconHTML}${content}</span></li>`;
        } else if (href) {
            return `<li class="breadcrumb-item"><a href="${href}" class="flex items-center ${itemClasses}">${iconHTML}${content}</a></li>`;
        } else {
            return `<li class="breadcrumb-item"><span class="flex items-center ${itemClasses}">${iconHTML}${content}</span></li>`;
        }
    }

    _createSeparator() {
        const separator = this.getAttribute('separator') || 'chevron';

        if (separator === 'chevron') {
            return `<li class="breadcrumb-separator mx-2 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>`;
        } else if (separator === 'slash') {
            return `<li class="breadcrumb-separator mx-2 text-gray-400">/</li>`;
        } else if (separator === 'bullet') {
            return `<li class="breadcrumb-separator mx-2 text-gray-400">•</li>`;
        } else if (separator === 'arrow') {
            return `<li class="breadcrumb-separator mx-2 text-gray-400">→</li>`;
        } else {
            // Custom text separator
            return `<li class="breadcrumb-separator mx-2 text-gray-400">${separator}</li>`;
        }
    }

    // Public methods
    addItem(text, href = null, active = false) {
        const item = document.createElement('breadcrumb-item');
        item.textContent = text;
        if (href) item.setAttribute('href', href);
        if (active) item.setAttribute('active', '');
        this.appendChild(item);
        this._processItems();
        this._render();
        return this;
    }

    setActive(index) {
        this._items.forEach((item, i) => {
            if (i === index) {
                item.setAttribute('active', '');
            } else {
                item.removeAttribute('active');
            }
        });
        this._render();
        return this;
    }

    // Getters for common properties
    get separator() {
        return this.getAttribute('separator') || 'chevron';
    }

    set separator(value) {
        this.setAttribute('separator', value);
    }

    get itemCount() {
        return this._items.length;
    }

    get activeIndex() {
        return this._items.findIndex(item => item.hasAttribute('active'));
    }

    // Force re-render (useful for dynamic content)
    refresh() {
        this._processItems();
        this._render();
    }

    // Process Font Awesome icons after DOM update
    _processFontAwesome() {
        // Multiple strategies to ensure Font Awesome icons render
        if (typeof window !== 'undefined') {
            // Strategy 1: Font Awesome 6 SVG method
            if (window.FontAwesome && window.FontAwesome.dom && window.FontAwesome.dom.i2svg) {
                try {
                    window.FontAwesome.dom.i2svg({ node: this });
                } catch (e) {
                    // Ignore FA processing errors
                }
            }

            // Strategy 2: Search pseudo elements
            if (window.FontAwesome && window.FontAwesome.searchPseudoElements) {
                setTimeout(() => {
                    try {
                        window.FontAwesome.searchPseudoElements();
                    } catch (e) {
                        // Ignore FA processing errors
                    }
                }, 10);
            }

            // Strategy 3: Manual DOM observation trigger for CSS-based FA
            setTimeout(() => {
                const icons = this.querySelectorAll('i[class*="fa"]');
                icons.forEach(icon => {
                    // Force a micro-update to trigger FA processing
                    const parent = icon.parentNode;
                    if (parent) {
                        const next = icon.nextSibling;
                        parent.removeChild(icon);
                        parent.insertBefore(icon, next);
                    }
                });
            }, 50);
        }
    }
}

// Simple Breadcrumb Item Component
class BreadcrumbItem extends HTMLElement {
    static get observedAttributes() {
        return ['href', 'icon', 'active', 'class'];
    }

    connectedCallback() {
        // Notify parent to reprocess items when a new item is added
        setTimeout(() => {
            const parent = this.closest('dry-breadcrumbs');
            if (parent && parent.refresh) {
                parent.refresh();
            }
        }, 0);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // Notify parent to re-render when attributes change
            setTimeout(() => {
                const parent = this.closest('dry-breadcrumbs');
                if (parent && parent.refresh) {
                    parent.refresh();
                }
            }, 0);
        }
    }

    // Getters and setters
    get href() {
        return this.getAttribute('href');
    }

    set href(value) {
        value ? this.setAttribute('href', value) : this.removeAttribute('href');
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        value ? this.setAttribute('icon', value) : this.removeAttribute('icon');
    }

    get active() {
        return this.hasAttribute('active');
    }

    set active(value) {
        value ? this.setAttribute('active', '') : this.removeAttribute('active');
    }

    get text() {
        return this.textContent;
    }

    set text(value) {
        this.textContent = value;
    }
}

// Define the custom elements
customElements.define('dry-breadcrumbs', Breadcrumbs);
customElements.define('breadcrumb-item', BreadcrumbItem);