// Timeline Component for DRY2 Web Components

class Timeline extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const layout = this.layout;
        const containerClasses = this.getContainerClasses(layout);
        
        // Check if we have direct children or need to set up for slotted content
        if (!this.hasChildNodes() || (this.firstElementChild && this.firstElementChild.tagName === 'SLOT')) {
            this.innerHTML = `<div class="${containerClasses}"><slot></slot></div>`;
            return;
        }
        
        // Process timeline items
        const timelineItems = Array.from(this.querySelectorAll('timeline-item'));
        
        // If no items found, set up for slotted content
        if (timelineItems.length === 0) {
            this.innerHTML = `<div class="${containerClasses}"><slot></slot></div>`;
            return;
        }
        
        // Create the timeline with processed items
        this.innerHTML = `
            <div class="${containerClasses}">
                ${timelineItems.map(item => item.outerHTML).join('')}
            </div>
        `;
    }

    getContainerClasses(layout) {
        let classes = 'timeline-container relative ';
        
        // Layout-specific classes
        if (layout === 'horizontal') {
            classes += 'flex overflow-x-auto ';
        } else {
            // Default vertical layout
            classes += 'flex flex-col ';
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    static get observedAttributes() {
        return ['layout', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
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
}

// Timeline Item Component
class TimelineItem extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const layout = this.determineLayout();
        const variant = this.variant;
        const date = this.date;
        const title = this.title;
        const isLast = this.isLast; // Last item in timeline
        
        // Get appropriate classes based on layout and variant
        const itemClasses = this.getItemClasses(layout, variant, isLast);
        
        // Create marker/icon element
        const marker = this.createMarker(layout, variant);
        
        // Create date display if provided
        const dateDisplay = date ? `<div class="timeline-date text-sm text-gray-500">${date}</div>` : '';
        
        // Create title display if provided
        const titleDisplay = title ? `<div class="timeline-title font-medium">${title}</div>` : '';
        
        // Arrange content based on layout
        let timelineItemHTML;
        
        if (layout === 'horizontal') {
            timelineItemHTML = `
                <div class="${itemClasses}">
                    <div class="timeline-item-content p-4 flex flex-col min-w-[200px]">
                        ${dateDisplay}
                        ${titleDisplay}
                        <div class="timeline-body mt-2">
                            <slot></slot>
                        </div>
                    </div>
                    ${marker}
                </div>
            `;
        } else {
            // Vertical layout
            timelineItemHTML = `
                <div class="${itemClasses}">
                    <div class="timeline-marker-container">
                        ${marker}
                    </div>
                    <div class="timeline-item-content ml-4 p-4">
                        ${dateDisplay}
                        ${titleDisplay}
                        <div class="timeline-body mt-2">
                            <slot></slot>
                        </div>
                    </div>
                </div>
            `;
        }
        
        this.innerHTML = timelineItemHTML;
    }

    determineLayout() {
        // First check if this item has a layout override
        if (this.hasAttribute('layout')) {
            return this.getAttribute('layout');
        }
        
        // Otherwise use the parent timeline's layout
        const timelineParent = this.closest('timeline-component');
        return timelineParent ? timelineParent.layout : 'vertical';
    }

    get isLast() {
        const timelineParent = this.closest('timeline-component');
        if (!timelineParent) return false;
        
        const items = Array.from(timelineParent.querySelectorAll('timeline-item'));
        return items[items.length - 1] === this;
    }

    getItemClasses(layout, variant, isLast) {
        let classes = 'timeline-item relative ';
        
        // Layout-specific classes
        if (layout === 'horizontal') {
            classes += 'inline-block flex-shrink-0 ';
            
            // Add line connectors for horizontal layout
            if (!isLast) {
                classes += 'after:content-[""] after:absolute after:top-1/2 after:right-0 after:w-8 after:h-0.5 after:bg-gray-300 after:-mr-4 ';
            }
        } else {
            // Vertical layout
            classes += 'flex pb-6 ';
            
            // Add line connectors for vertical layout
            if (!isLast) {
                classes += 'before:content-[""] before:absolute before:left-[18px] before:top-[28px] before:bottom-0 before:w-0.5 before:bg-gray-300 ';
            }
        }
        
        // Variant-specific classes
        switch (variant) {
            case 'success':
                classes += 'timeline-success ';
                break;
            case 'error':
                classes += 'timeline-error ';
                break;
            case 'warning':
                classes += 'timeline-warning ';
                break;
            case 'info':
                classes += 'timeline-info ';
                break;
            default:
                classes += 'timeline-default ';
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    createMarker(layout, variant) {
        // Get marker color based on variant
        let markerColor;
        switch (variant) {
            case 'success': markerColor = 'bg-green-500'; break;
            case 'error': markerColor = 'bg-red-500'; break;
            case 'warning': markerColor = 'bg-yellow-500'; break;
            case 'info': markerColor = 'bg-blue-500'; break;
            default: markerColor = 'bg-gray-500';
        }
        
        // Use custom icon if provided, otherwise use a dot/circle
        let markerContent;
        if (this.icon) {
            markerContent = this.icon;
        } else {
            markerContent = `<div class="${markerColor} rounded-full h-3 w-3"></div>`;
        }
        
        // Create marker element with appropriate positioning
        if (layout === 'horizontal') {
            return `
                <div class="timeline-marker absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-white border-2 border-gray-300 z-10">
                    ${markerContent}
                </div>
            `;
        } else {
            return `
                <div class="timeline-marker absolute left-0 top-1 flex items-center justify-center h-8 w-8 rounded-full bg-white border-2 border-gray-300 z-10">
                    ${markerContent}
                </div>
            `;
        }
    }

    static get observedAttributes() {
        return ['variant', 'date', 'title', 'icon', 'layout', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get variant() {
        return this.getAttribute('variant') || 'default';
    }

    set variant(value) {
        this.setAttribute('variant', value);
    }

    get date() {
        return this.getAttribute('date');
    }

    set date(value) {
        value ? this.setAttribute('date', value) : this.removeAttribute('date');
    }

    get title() {
        return this.getAttribute('title');
    }

    set title(value) {
        value ? this.setAttribute('title', value) : this.removeAttribute('title');
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(value) {
        value ? this.setAttribute('icon', value) : this.removeAttribute('icon');
    }

    get layout() {
        return this.getAttribute('layout');
    }

    set layout(value) {
        value ? this.setAttribute('layout', value) : this.removeAttribute('layout');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom elements
customElements.define('timeline-component', Timeline);
customElements.define('timeline-item', TimelineItem);