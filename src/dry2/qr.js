class DryQRCode extends BaseElement {
  constructor() {
    super();
    this.qr = null;
    this.canvas = null;
  }

  _initializeComponent() {
    this.initializeCanvas();
    this.render();
  }

  static get observedAttributes() {
    return ['value', 'size', 'foreground', 'background', 'error-correction'];
  }

  _handleAttributeChange(name, oldValue, newValue) {
    if (this.isConnected && oldValue !== newValue) {
      this.render();
    }
  }

  // Getters and setters for JavaScript API
  get value() {
    return this._getAttributeWithDefault('value', '');
  }

  set value(val) {
    this._setAttribute('value', val);
  }

  get size() {
    return this._getNumericAttribute('size', 200);
  }

  set size(val) {
    this._setNumericAttribute('size', val);
  }

  get foreground() {
    return this._getAttributeWithDefault('foreground', '#000000');
  }

  set foreground(val) {
    this._setAttribute('foreground', val);
  }

  get background() {
    return this._getAttributeWithDefault('background', '#ffffff');
  }

  set background(val) {
    this._setAttribute('background', val);
  }

  get errorCorrection() {
    return this._getAttributeWithDefault('error-correction', 'M');
  }

  set errorCorrection(val) {
    this._setAttribute('error-correction', val);
  }

  initializeCanvas() {
    // Create canvas element if it doesn't exist
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.appendChild(this.canvas);
    }
  }

  render() {
    // Check if QRious library is available
    if (typeof QRious === 'undefined') {
      console.error('QRious library not found. Please include QRious before using dry-qr-code.');
      this.innerHTML = '<div style="border: 1px solid #ccc; padding: 10px; color: #666;">QRious library not loaded</div>';
      return;
    }

    // Ensure canvas exists
    this.initializeCanvas();

    // Set canvas size
    const size = this.size;
    this.canvas.width = size;
    this.canvas.height = size;

    // Initialize or update QRious instance
    try {
      if (!this.qr) {
        this.qr = new QRious({
          element: this.canvas,
          value: this.value,
          size: size,
          foreground: this.foreground,
          background: this.background,
          level: this.errorCorrection
        });
      } else {
        // Update existing QR code
        this.qr.value = this.value;
        this.qr.size = size;
        this.qr.foreground = this.foreground;
        this.qr.background = this.background;
        this.qr.level = this.errorCorrection;
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.innerHTML = '<div style="border: 1px solid #f00; padding: 10px; color: #f00;">Error generating QR code</div>';
    }
  }

  // Method to get the QR code as data URL
  toDataURL(type = 'image/png') {
    if (this.canvas) {
      return this.canvas.toDataURL(type);
    }
    return null;
  }

  // Method to download the QR code as an image
  download(filename = 'qrcode.png') {
    const dataURL = this.toDataURL();
    if (dataURL) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataURL;
      link.click();
    }
  }
}

// Register the custom element
customElements.define('dry-qr-code', DryQRCode);
