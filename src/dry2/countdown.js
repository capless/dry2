class DryCountdown extends BaseElement {
  constructor() {
    super();
    this.interval = null;
    this.isPaused = false;
    this.remainingTime = 0;
    this.initialTime = 0;
    this.pausedTime = 0;
  }

  _initializeComponent() {
    this.calculateInitialTime();
    this.render();
    if (this._getBooleanAttribute('autostart')) {
      this.startCountdown();
    }
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  static get observedAttributes() {
    return [
      'target-date', 'duration', 'format', 'autostart', 'expiry-text',
      'leading-zeros', 'show-zeros', 'unit-class',
      'days-label', 'hours-label', 'minutes-label', 'seconds-label'
    ];
  }

  _handleAttributeChange(name, oldValue, newValue) {
    if (this.isConnected && oldValue !== newValue) {
      if (name === 'target-date' || name === 'duration') {
        this.calculateInitialTime();
      }
      this.render();
    }
  }

  get targetDate() {
    return this.getAttribute('target-date');
  }

  set targetDate(value) {
    this._setAttribute('target-date', value);
  }

  get duration() {
    return this._getNumericAttribute('duration', 0);
  }

  set duration(value) {
    this._setNumericAttribute('duration', value);
  }

  get format() {
    return this._getAttributeWithDefault('format', 'days,hours,minutes,seconds');
  }

  get unitClass() {
    return this._getAttributeWithDefault('unit-class', 'mx-2');
  }

  get leadingZeros() {
    return this._getBooleanAttribute('leading-zeros');
  }

  get showZeros() {
    return this._getBooleanAttribute('show-zeros');
  }

  get expiryText() {
    return this._getAttributeWithDefault('expiry-text', '');
  }

  getLabel(unit, value) {
    const labelAttr = this.getAttribute(`${unit}-label`);
    const defaultLabels = {
      days: 'Day|Days',
      hours: 'Hour|Hours',
      minutes: 'Minute|Minutes',
      seconds: 'Second|Seconds'
    };

    const label = labelAttr || defaultLabels[unit];
    const [singular, plural] = label.split('|');
    return value === 1 ? singular : plural;
  }

  calculateInitialTime() {
    if (this.targetDate) {
      const target = new Date(this.targetDate);
      const now = new Date();
      this.initialTime = Math.max(0, Math.floor((target - now) / 1000));
    } else if (this.duration) {
      this.initialTime = this.duration;
    } else {
      this.initialTime = 0;
    }
    this.remainingTime = this.initialTime;
  }

  formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { days, hours, minutes, seconds: secs };
  }

  formatValue(value) {
    return this.leadingZeros ? value.toString().padStart(2, '0') : value.toString();
  }

  shouldShowUnit(unit, value) {
    if (this.showZeros) return true;
    return value > 0;
  }

  render() {
    // Check for expiry first
    if (this.remainingTime <= 0 && this.expiryText) {
      this.innerHTML = `<div class="text-center">${this.expiryText}</div>`;
      return;
    }

    if (this.remainingTime <= 0) {
      const expiredSlot = this.querySelector('[slot="expired"]');
      if (expiredSlot) {
        this.innerHTML = expiredSlot.outerHTML.replace(' slot="expired"', '');
        return;
      }
    }

    const timeUnits = this.formatTime(this.remainingTime);
    const formatUnits = this.format.split(',').map(u => u.trim());
    const unitClass = this.unitClass;

    let html = '<div class="flex items-center justify-center">';

    formatUnits.forEach((unit, index) => {
      const value = timeUnits[unit];
      if (this.shouldShowUnit(unit, value) || formatUnits.length === 1) {
        html += `
                    <div class="${unitClass}">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${this.formatValue(value)}</div>
                            <div class="text-sm text-gray-600">${this.getLabel(unit, value)}</div>
                        </div>
                    </div>
                `;
      }
    });

    html += '</div>';
    this.innerHTML = html;
  }

  startCountdown() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Only recalculate initial time if not already running
    if (this.remainingTime === 0) {
      this.calculateInitialTime();
    }

    this.isPaused = false;

    this.interval = setInterval(() => {
      if (this.isPaused) return;

      if (this.targetDate) {
        // For target dates, always recalculate from current time
        const target = new Date(this.targetDate);
        const now = new Date();
        this.remainingTime = Math.max(0, Math.floor((target - now) / 1000));
      } else {
        // For duration-based, just decrement
        this.remainingTime--;
      }

      this.render();

      if (this.remainingTime <= 0) {
        this.complete();
      }
    }, 1000);

    this._dispatchEvent('countdown:started', { remainingTime: this.remainingTime });
  }

  pause() {
    this.isPaused = true;
    this._dispatchEvent('countdown:paused', { remainingTime: this.remainingTime });
  }

  resume() {
    this.isPaused = false;
    this._dispatchEvent('countdown:resumed', { remainingTime: this.remainingTime });
  }

  reset() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isPaused = false;
    this.calculateInitialTime();
    this.render();

    if (this._getBooleanAttribute('autostart')) {
      this.startCountdown();
    }

    this._dispatchEvent('countdown:reset', { remainingTime: this.remainingTime });
  }

  complete() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.render();

    this._dispatchEvent('countdown:completed', { completedAt: new Date() });
  }
}

// Register the custom element
customElements.define('dry-countdown', DryCountdown);
