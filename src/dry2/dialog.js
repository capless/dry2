class Dialog extends BaseWebComponent {
    // Web component for creating a dialog that fetches content via AJAX
    
    static get observedAttributes() {
        return ['url', 'button-class', 'dialog-class', 'dialog-inner-id', 'trigger-id', 'trigger-type'];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    render() {
        // Get the original content - fallback to _originalContent if slot system fails
        let originalChildren = this.getSlotContent('default');
        if (!originalChildren && this._originalContent) {
            originalChildren = this._originalContent;
        }
        
        // DEBUG: Log what we're actually rendering
        console.log('DIALOG RENDER DEBUG:');
        console.log('originalChildren:', `"${originalChildren}"`);
        console.log('_originalContent:', `"${this._originalContent}"`);
        console.log('_namedSlots:', this._namedSlots);
        
        const rendered = `
        <div class="relative">
          <a id="${this.triggerId}" class="${this.buttonClass}" href="${this.url}" hx-get="${this.url}" hx-trigger="${this.triggerType}" hx-target="#${this.dialogInnerId}">
            ${originalChildren}
          </a>
          <dialog class="${this.dialogClass} ajax-modal">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" id="closer"
     class="cursor-pointer h-6 absolute opacity-30 hover:opacity-80 transition-all duration-75 top-8 right-8">
    <line x1="10" y1="10" x2="90" y2="90" stroke="black" stroke-width="20"/>
    <line x1="90" y1="10" x2="10" y2="90" stroke="black" stroke-width="20"/>
</svg>
              <div class="dialog-inner pt-2" id="${this.dialogInnerId}"></div>
           </dialog>
        </div>
      `;
      
      console.log('Final rendered HTML:', rendered);
      return rendered;
    }

    _afterRender() {
        // Attach event listeners after render, but avoid duplicates
        this._attachEventListeners();
    }

    _attachEventListeners() {
        const dialog = this.querySelector('dialog');
        const trigger = this.querySelector('a');
        const closer = this.querySelector('svg#closer');

        if (trigger && !trigger.hasAttribute('data-listeners-attached')) {
            trigger.setAttribute('data-listeners-attached', 'true');
            
            // Add a click listener that prevents default and opens modal
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                dialog.showModal();
                
                // Then trigger HTMX manually
                if (window.htmx) {
                    htmx.ajax('GET', this.url, {
                        target: `#${this.dialogInnerId}`,
                        source: trigger
                    });
                }
            });
        }

        if (closer && !closer.hasAttribute('data-listeners-attached')) {
            closer.setAttribute('data-listeners-attached', 'true');
            closer.addEventListener('click', () => {
                dialog.close();
            });
        }

        // Set up HTMX close listener (only once)
        if (!this.hasAttribute('data-htmx-listeners-attached')) {
            this.setAttribute('data-htmx-listeners-attached', 'true');
            this.addDocumentListener('htmx:afterRequest', (event) => {
                // Close dialog if server sends the close header
                if (event.detail.xhr.getResponseHeader('HX-CloseDialog') === 'close') {
                    dialog.close();
                }
            });
        }
    }

    get url() {
        return this.getAttribute('url') || '';
    }

    get buttonClass() {
        return this.getAttribute('button-class') || '';
    }

    get dialogClass() {
        return this.getAttribute('dialog-class') || 'bg-white';
    }

    get dialogInnerId() {
        return this.getAttribute('dialog-inner-id') || 'dialog-inner';
    }

    get triggerId() {
        return this.getAttribute('trigger-id') || 'trigger';
    }

    get triggerType() {
        return this.getAttribute('trigger-type') || 'click';
    }
}

customElements.define('dry-dialog', Dialog);