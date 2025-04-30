// Countdown Component for DRY2 Web Components

class CountdownComponent extends BaseWebComponent {
    constructor() {
        super();
        this._intervalId = null;
        this._isPaused = false;
        this._isCompleted = false;
        this._remainingTime = 0;
        this._endTime = null;
    }

    render() {
        // Create container for countdown display
        const containerClasses = `countdown-container ${this.class || ''}`.trim();
        
        let content;
        
        if (this._isCompleted) {
            // Show expiry content if countdown is completed
            content = this.expiryText ? 
                `<div class="countdown-expired">${this.expiryText}</div>` : 
                `<slot name="expired">Expired</slot>`;
        } else {
            // Show countdown timer
            content = this.createCountdownDisplay();
        }
        
        const countdownHTML = `
            <div class="${containerClasses}" aria-live="polite">
                ${content}
            </div>
        `;
        
        this.innerHTML = countdownHTML;
    }

    createCountdownDisplay() {
        // Calculate time units from remaining time
        const timeUnits = this.calculateTimeUnits(this._remainingTime);
        
        // Determine which units to display based on format
        const format = this.format.toLowerCase().split(',');
        
        let displayHTML = '<div class="countdown-units flex">';
        
        // Create display for each enabled unit
        if (format.includes('days') && (timeUnits.days > 0 || this.showZeros)) {
            displayHTML += this.createTimeUnit('days', timeUnits.days);
        }
        
        if (format.includes('hours') && (timeUnits.hours > 0 || this.showZeros || timeUnits.days > 0)) {
            displayHTML += this.createTimeUnit('hours', timeUnits.hours);
        }
        
        if (format.includes('minutes') && (timeUnits.minutes > 0 || this.showZeros || timeUnits.hours > 0 || timeUnits.days > 0)) {
            displayHTML += this.createTimeUnit('minutes', timeUnits.minutes);
        }
        
        if (format.includes('seconds') && (timeUnits.seconds > 0 || this.showZeros || timeUnits.minutes > 0 || timeUnits.hours > 0 || timeUnits.days > 0)) {
            displayHTML += this.createTimeUnit('seconds', timeUnits.seconds);
        }
        
        displayHTML += '</div>';
        
        return displayHTML;
    }

    createTimeUnit(unit, value) {
        // Format the value with leading zeros if needed
        const formattedValue = this.formatValue(value);
        
        // Get unit label (singular or plural based on value)
        const label = value === 1 ? 
            this.getUnitLabel(unit, true) : 
            this.getUnitLabel(unit, false);
        
        // Create the HTML for this time unit
        return `
            <div class="countdown-unit countdown-${unit} ${this.unitClass}">
                <div class="countdown-value text-center text-xl font-bold">${formattedValue}</div>
                <div class="countdown-label text-center text-sm">${label}</div>
            </div>
        `;
    }

    formatValue(value) {
        // Add leading zeros if enabled
        return this.leadingZeros ? value.toString().padStart(2, '0') : value.toString();
    }

    getUnitLabel(unit, singular) {
        // Custom labels from attributes
        const labelAttribute = `${unit}-label`;
        const customLabel = this.getAttribute(labelAttribute);
        
        if (customLabel) {
            // If custom label contains a pipe, split into singular|plural
            if (customLabel.includes('|')) {
                const [singularLabel, pluralLabel] = customLabel.split('|');
                return singular ? singularLabel : pluralLabel;
            }
            return customLabel;
        }
        
        // Default labels
        switch (unit) {
            case 'days': return singular ? 'Day' : 'Days';
            case 'hours': return singular ? 'Hour' : 'Hours';
            case 'minutes': return singular ? 'Minute' : 'Minutes';
            case 'seconds': return singular ? 'Second' : 'Seconds';
            default: return unit;
        }
    }

    calculateTimeUnits(milliseconds) {
        // Convert milliseconds to days, hours, minutes, seconds
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        return {
            days: days,
            hours: hours % 24,
            minutes: minutes % 60,
            seconds: seconds % 60
        };
    }

    startCountdown() {
        if (this._intervalId) return; // Already running
        
        // Set the end time if target date is provided
        if (this.targetDate && !this._endTime) {
            this._endTime = new Date(this.targetDate).getTime();
        }
        
        // Calculate initial remaining time
        this.updateRemainingTime();
        
        // Start the interval
        const intervalMs = 1000; // Update every second
        this._intervalId = setInterval(() => {
            if (this._isPaused) return;
            
            this.updateRemainingTime();
            this.render();
            
            // Check if countdown is complete
            if (this._remainingTime <= 0) {
                this.completeCountdown();
            }
        }, intervalMs);
        
        // Initial render
        this.render();
    }

    updateRemainingTime() {
        if (this._endTime) {
            // Calculate remaining time until end date
            const now = new Date().getTime();
            this._remainingTime = Math.max(0, this._endTime - now);
        } else if (this.duration) {
            // Count down from a specific duration (already set in _remainingTime)
            this._remainingTime = Math.max(0, this._remainingTime - 1000);
        }
    }

    pause() {
        this._isPaused = true;
        
        // Dispatch paused event
        this.dispatchEvent(new CustomEvent('countdown:paused', {
            bubbles: true,
            detail: { countdown: this }
        }));
    }

    resume() {
        this._isPaused = false;
        
        // Dispatch resumed event
        this.dispatchEvent(new CustomEvent('countdown:resumed', {
            bubbles: true,
            detail: { countdown: this }
        }));
    }

    reset() {
        // Stop current countdown
        this.stopCountdown();
        
        // Reset state
        this._isCompleted = false;
        this._isPaused = false;
        this._endTime = null;
        
        // Set new end time if target date is provided
        if (this.targetDate) {
            this._endTime = new Date(this.targetDate).getTime();
        }
        
        // Reset remaining time for duration-based countdown
        if (this.duration) {
            this._remainingTime = parseInt(this.duration, 10) * 1000;
        }
        
        // Start the countdown again
        this.startCountdown();
        
        // Dispatch reset event
        this.dispatchEvent(new CustomEvent('countdown:reset', {
            bubbles: true,
            detail: { countdown: this }
        }));
    }

    stopCountdown() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    completeCountdown() {
        this.stopCountdown();
        this._isCompleted = true;
        this._remainingTime = 0;
        this.render();
        
        // Dispatch completed event
        this.dispatchEvent(new CustomEvent('countdown:completed', {
            bubbles: true,
            detail: { countdown: this }
        }));
    }

    connectedCallback() {
        super.connectedCallback();
        
        // Determine countdown mode (target date or duration)
        if (this.targetDate) {
            this._endTime = new Date(this.targetDate).getTime();
        } else if (this.duration) {
            this._remainingTime = parseInt(this.duration, 10) * 1000;
        }
        
        // Start countdown automatically if autostart is enabled
        if (this.autostart) {
            this.startCountdown();
        }
    }

    disconnectedCallback() {
        this.stopCountdown();
    }

    static get observedAttributes() {
        return [
            'target-date', 'duration', 'format', 'autostart', 'expiry-text',
            'leading-zeros', 'show-zeros', 'class', 'unit-class',
            'days-label', 'hours-label', 'minutes-label', 'seconds-label'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'target-date') {
                // Update the end time
                this._endTime = new Date(newValue).getTime();
                this._isCompleted = false;
            } else if (name === 'duration') {
                // Update the duration
                this._remainingTime = parseInt(newValue, 10) * 1000;
                this._isCompleted = false;
            } else if (name === 'autostart' && newValue !== null && !this._intervalId) {
                // Start countdown if autostart is enabled
                this.startCountdown();
            }
            
            if (this.isConnected && this._intervalId) {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get targetDate() {
        return this.getAttribute('target-date');
    }

    set targetDate(value) {
        value ? this.setAttribute('target-date', value) : this.removeAttribute('target-date');
    }

    get duration() {
        return this.getAttribute('duration');
    }

    set duration(value) {
        value ? this.setAttribute('duration', value) : this.removeAttribute('duration');
    }

    get format() {
        return this.getAttribute('format') || 'days,hours,minutes,seconds';
    }

    set format(value) {
        this.setAttribute('format', value);
    }

    get autostart() {
        return this.hasAttribute('autostart');
    }

    set autostart(value) {
        value ? this.setAttribute('autostart', '') : this.removeAttribute('autostart');
    }

    get expiryText() {
        return this.getAttribute('expiry-text');
    }

    set expiryText(value) {
        value ? this.setAttribute('expiry-text', value) : this.removeAttribute('expiry-text');
    }

    get leadingZeros() {
        return this.hasAttribute('leading-zeros');
    }

    set leadingZeros(value) {
        value ? this.setAttribute('leading-zeros', '') : this.removeAttribute('leading-zeros');
    }

    get showZeros() {
        return this.hasAttribute('show-zeros');
    }

    set showZeros(value) {
        value ? this.setAttribute('show-zeros', '') : this.removeAttribute('show-zeros');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    get unitClass() {
        return this.getAttribute('unit-class') || 'mx-2';
    }

    set unitClass(value) {
        value ? this.setAttribute('unit-class', value) : this.removeAttribute('unit-class');
    }
}

// Define the custom element
customElements.define('countdown-component', CountdownComponent);