class QRCode extends BaseWebComponent {
    constructor() {
        super();
        this._value = '';
        this._size = 200;
        this._foreground = '#000000';
        this._background = '#ffffff';
        this._errorCorrection = 'M';
    }

    connectedCallback() {
        super.connectedCallback();
    }

    static get observedAttributes() {
        return ['value', 'size', 'foreground', 'background', 'error-correction'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'value':
                    this._value = newValue;
                    break;
                case 'size':
                    this._size = parseInt(newValue) || 200;
                    break;
                case 'foreground':
                    this._foreground = newValue || '#000000';
                    break;
                case 'background':
                    this._background = newValue || '#ffffff';
                    break;
                case 'error-correction':
                    const validLevels = ['L', 'M', 'Q', 'H'];
                    this._errorCorrection = validLevels.includes(newValue) ? newValue : 'M';
                    break;
            }
            this.render();
        }
    }

    render() {
        if (!this._value) {
            this.innerHTML = `<div class="qr-error">Please provide a value for the QR code</div>`;
            return;
        }

        try {
            // Create QR Code using the QRious library
            const qr = new QRious({
                value: this._value,
                size: this._size,
                foreground: this._foreground,
                background: this._background,
                level: this._errorCorrection
            });

            // Set the innerHTML to the generated QR code
            this.innerHTML = `<img src="${qr.toDataURL()}" alt="QR Code: ${this.escapeHTML(this._value)}" width="${this._size}" height="${this._size}">`;
        } catch (error) {
            this.innerHTML = `<div class="qr-error">Error generating QR code: ${this.escapeHTML(error.message)}</div>`;
        }
    }

    // Helper method to escape HTML to prevent XSS
    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Getters and setters for properties
    get value() {
        return this._value;
    }

    set value(newValue) {
        this.setAttribute('value', newValue);
    }

    get size() {
        return this._size;
    }

    set size(newValue) {
        this.setAttribute('size', newValue);
    }

    get foreground() {
        return this._foreground;
    }

    set foreground(newValue) {
        this.setAttribute('foreground', newValue);
    }

    get background() {
        return this._background;
    }

    set background(newValue) {
        this.setAttribute('background', newValue);
    }

    get errorCorrection() {
        return this._errorCorrection;
    }

    set errorCorrection(newValue) {
        this.setAttribute('error-correction', newValue);
    }
}

// Register the custom element
customElements.define('dry-qr-code', QRCode);