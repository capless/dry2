// Breadcrumbs Component for DRY2 Web Components

class BreadcrumbsComponent extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        // Apply container classes
        const containerClasses = `
            breadcrumbs-container flex flex-wrap items-center ${this.class || ''}
        `.trim();
        
        // Check if we have direct children or need to set up for slotted content
        if (!this.hasChildNodes() || (this.firstElementChild && this.firstElementChild.tagName === 'SLOT')) {
            this.innerHTML = `<nav class="${containerClasses}" aria-label="Breadcrumbs"><slot></slot></nav>`;
            return;
        }
        
        // Process breadcrumb items
        const items = Array.from(this.querySelectorAll('breadcrumb-item'));
        
        // If no items found, set up for slotted content
        if (items.length === 0) {
            this.innerHTML = `<nav class="${containerClasses}" aria-label="Breadcrumbs"><slot></slot></nav>`;
            return;
        }
        
        // Mark the last item as active if not explicitly set
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (!lastItem.hasAttribute('active')) {
                lastItem.setAttribute('active', '');
            }
        }
        
        // Create the breadcrumbs with processed items
        const breadcrumbsHTML = `
            <nav class="${containerClasses}" aria-label="Breadcrumbs">
                <ol class="flex flex-wrap items-center w-full">
                    ${items.map((item, index) => {
                        // Add separator between items
                        const separator = index > 0 ? this.createSeparator() : '';
                        return `${separator}${item.outerHTML}`;
                    }).join('')}
                </ol>
            </nav>
        `;
        
        this.innerHTML = breadcrumbsHTML;
    }

    createSeparator() {
        // Get custom separator from attribute or use default
        const separator = this.separator;
        
        if (separator === 'chevron') {
            return `
                <li class="breadcrumb-separator mx-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </li>
            `;
        } else if (separator === 'slash') {
            return `
                <li class="breadcrumb-separator mx-2 text-gray-400">/</li>
            `;
        } else if (separator === 'bullet') {
            return `
                <li class="breadcrumb-separator mx-2 text-gray-400">•</li>
            `;
        } else if (separator.startsWith('<')) {
            // Custom HTML/SVG separator
            return `
                <li class="breadcrumb-separator mx-2 text-gray-400">${separator}</li>
            `;
        } else {
            // Text separator
            return `
                <li class="breadcrumb-separator mx-2 text-gray-400">${separator}</li>
            `;
        }
    }

    static get observedAttributes() {
        return ['separator', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get separator() {
        return this.getAttribute('separator') || 'chevron';
    }

    set separator(value) {
        this.setAttribute('separator', value);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Breadcrumb Item Component
class BreadcrumbItem extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const href = this.href;
        const icon = this.icon;
        const active = this.active;
        
        // Create the breadcrumb item HTML
        let itemHTML;
        
        // Add icon if provided
        const iconHTML = icon ? `<span class="breadcrumb-icon mr-1">${icon}</span>` : '';
        
        // Determine if this is a link or text item
        if (active) {
            // Active (current) item is not a link
            itemHTML = `
                <li class="breadcrumb-item ${this.getItemClasses(active)}">
                    <span class="flex items-center" aria-current="page">
                        ${iconHTML}
                        <slot></slot>
                    </span>
                </li>
            `;
        } else if (href) {
            // Link item
            itemHTML = `
                <li class="breadcrumb-item ${this.getItemClasses(active)}">
                    <a href="${href}" class="flex items-center hover:text-blue-600">
                        ${iconHTML}
                        <slot></slot>
                    </a>
                </li>
            `;
        } else {
            // Text item (no link)
            itemHTML = `
                <li class="breadcrumb-item ${this.getItemClasses(active)}">
                    <span class="flex items-center">
                        ${iconHTML}
                        <slot></slot>
                    </span>
                </li>
            `;
        }
        
        this.innerHTML = itemHTML;
    }

    getItemClasses(active) {
        let classes = '';
        
        if (active) {
            classes += 'text-gray-700 font-medium ';
        } else {
            classes += 'text-gray-500 ';
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    static get observedAttributes() {
        return ['href', 'icon', 'active', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
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

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom elements
customElements.define('breadcrumbs-component', BreadcrumbsComponent);
customElements.define('breadcrumb-item', BreadcrumbItem);