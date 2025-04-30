// Collapse Component for DRY2 Web Components

class CollapseComponent extends BaseWebComponent {
    constructor() {
        super();
        this._expanded = false;
        this._transitioning = false;
        this._contentHeight = 0;
    }

    render() {
        const expanded = this._expanded;
        
        // Create container for content if not already present
        if (!this.querySelector('.collapse-content')) {
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'collapse-content overflow-hidden transition-all';
            
            // Move all child content into this wrapper
            while (this.firstChild) {
                contentWrapper.appendChild(this.firstChild);
            }
            
            this.appendChild(contentWrapper);
        }
        
        // Set initial height based on expanded state
        const contentContainer = this.querySelector('.collapse-content');
        if (contentContainer) {
            if (expanded) {
                contentContainer.style.height = 'auto';
                contentContainer.style.opacity = '1';
                contentContainer.style.visibility = 'visible';
            } else {
                contentContainer.style.height = '0';
                contentContainer.style.opacity = '0';
                contentContainer.style.visibility = 'hidden';
            }
            
            // Set transition duration
            contentContainer.style.transitionDuration = `${this.duration}ms`;
        }
        
        // Set ARIA attributes for accessibility
        this.setAttribute('aria-expanded', expanded.toString());
    }

    setupEventListeners() {
        // Listen for window resize to adjust content height if expanded
        this._boundResizeHandler = this._handleResize.bind(this);
        window.addEventListener('resize', this._boundResizeHandler);
    }

    disconnectedCallback() {
        // Remove event listeners
        window.removeEventListener('resize', this._boundResizeHandler);
    }

    _handleResize() {
        // Update content height on window resize if expanded
        if (this._expanded && !this._transitioning) {
            this._updateContentHeight();
        }
    }

    _updateContentHeight() {
        const contentContainer = this.querySelector('.collapse-content');
        if (!contentContainer) return;
        
        // Temporarily set height to auto to measure actual height
        contentContainer.style.height = 'auto';
        this._contentHeight = contentContainer.scrollHeight;
        
        // If expanded, keep it at auto height, otherwise collapse it
        if (this._expanded) {
            contentContainer.style.height = 'auto';
        } else {
            contentContainer.style.height = '0';
        }
    }

    toggle() {
        if (this._transitioning) return;
        
        this._expanded ? this.collapse() : this.expand();
    }

    expand() {
        if (this._expanded || this._transitioning) return;
        
        const contentContainer = this.querySelector('.collapse-content');
        if (!contentContainer) return;
        
        this._transitioning = true;
        
        // Update content height before animation
        this._updateContentHeight();
        
        // Start animation
        requestAnimationFrame(() => {
            contentContainer.style.height = `${this._contentHeight}px`;
            contentContainer.style.opacity = '1';
            contentContainer.style.visibility = 'visible';
            
            // After transition completes
            const onExpanded = () => {
                contentContainer.style.height = 'auto'; // Allow content to grow/shrink naturally
                contentContainer.removeEventListener('transitionend', onExpanded);
                this._transitioning = false;
                
                // Dispatch expanded event
                this.dispatchEvent(new CustomEvent('collapse:expanded', {
                    bubbles: true,
                    detail: { collapse: this }
                }));
            };
            
            contentContainer.addEventListener('transitionend', onExpanded);
            
            // Update state
            this._expanded = true;
            this.setAttribute('aria-expanded', 'true');
            
            // Dispatch expanding event
            this.dispatchEvent(new CustomEvent('collapse:expanding', {
                bubbles: true,
                detail: { collapse: this }
            }));
        });
    }

    collapse() {
        if (!this._expanded || this._transitioning) return;
        
        const contentContainer = this.querySelector('.collapse-content');
        if (!contentContainer) return;
        
        this._transitioning = true;
        
        // Set explicit height before collapsing (from auto to specific height)
        this._contentHeight = contentContainer.scrollHeight;
        contentContainer.style.height = `${this._contentHeight}px`;
        
        // Force browser to acknowledge the height before we change it
        window.getComputedStyle(contentContainer).height;
        
        // Start animation
        requestAnimationFrame(() => {
            contentContainer.style.height = '0';
            contentContainer.style.opacity = '0';
            
            // After transition completes
            const onCollapsed = () => {
                contentContainer.style.visibility = 'hidden';
                contentContainer.removeEventListener('transitionend', onCollapsed);
                this._transitioning = false;
                
                // Dispatch collapsed event
                this.dispatchEvent(new CustomEvent('collapse:collapsed', {
                    bubbles: true,
                    detail: { collapse: this }
                }));
            };
            
            contentContainer.addEventListener('transitionend', onCollapsed);
            
            // Update state
            this._expanded = false;
            this.setAttribute('aria-expanded', 'false');
            
            // Dispatch collapsing event
            this.dispatchEvent(new CustomEvent('collapse:collapsing', {
                bubbles: true,
                detail: { collapse: this }
            }));
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupEventListeners();
        
        // Update content height on initial render
        this._updateContentHeight();
    }

    static get observedAttributes() {
        return ['expanded', 'duration', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'expanded') {
                const shouldExpand = newValue !== null;
                
                if (shouldExpand !== this._expanded) {
                    this._expanded = shouldExpand;
                    if (this.isConnected) {
                        shouldExpand ? this.expand() : this.collapse();
                    }
                }
            } else if (this.isConnected) {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get expanded() {
        return this._expanded;
    }

    set expanded(value) {
        this._expanded = Boolean(value);
        this._expanded ? this.setAttribute('expanded', '') : this.removeAttribute('expanded');
        
        if (this.isConnected) {
            this._expanded ? this.expand() : this.collapse();
        }
    }

    get duration() {
        return parseInt(this.getAttribute('duration') || '300', 10);
    }

    set duration(value) {
        this.setAttribute('duration', value.toString());
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom element
customElements.define('collapse-component', CollapseComponent);