class Dialog extends BaseElement {
  // Web component for creating a dialog that fetches content via AJAX

  _initializeComponent() {
    if (!this.hasAttribute('data-rendered')) {
      // Use setTimeout to capture content after DOM parsing is complete
      // Also add a longer delay for the first component to ensure scripts are loaded
      const delay = document.readyState === 'loading' ? 100 : 0;
      setTimeout(() => {
        this._originalContent = this.textContent.trim();
        // If content is still empty, try again with a longer delay
        if (!this._originalContent) {
          setTimeout(() => {
            this._originalContent = this.textContent.trim();
            this.render();
            this.attachEventListeners();
            this.setAttribute('data-rendered', '');
          }, 100);
        } else {
          this.render();
          this.attachEventListeners();
          this.setAttribute('data-rendered', '');
        }
      }, delay);
    } else {
      this.attachEventListeners();
    }
  }

  render() {
    const originalChildren = (this._originalContent || '').trim();
    this.innerHTML = `
        <div class="relative">
          <a id="${this.triggerId}" class="${this.buttonClass}" href="${this.url}" hx-get="${this.url}" hx-trigger="${this.triggerType}" hx-target="#${this.dialogInnerId}">${originalChildren}</a>
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
  }

  attachEventListeners() {
    const dialog = this.querySelector('dialog');
    const trigger = this.querySelector('a');
    const closer = this.querySelector('svg#closer');

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

    closer.addEventListener('click', () => {
      dialog.close();
    });

    document.body.addEventListener('htmx:afterRequest', (event) => {
      // Close dialog if server sends the close header
      if (event.detail.xhr.getResponseHeader('HX-CloseDialog') === 'close') {
        dialog.close();
      }
    });
  }

  get url() {
    return this._getAttributeWithDefault('url', '');
  }

  get buttonClass() {
    return this._getAttributeWithDefault('button-class', '');
  }

  get dialogClass() {
    return this._getAttributeWithDefault('dialog-class', 'bg-white');
  }

  get dialogInnerId() {
    return this._getAttributeWithDefault('dialog-inner-id', 'dialog-inner');
  }

  get triggerId() {
    return this._getAttributeWithDefault('trigger-id', 'trigger');
  }

  get triggerType() {
    return this._getAttributeWithDefault('trigger-type', 'click');
  }
}

customElements.define('dry-dialog', Dialog);
