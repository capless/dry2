class Stat extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const layout = this.layout;
        const value = this.value;
        const label = this.label;
        const trend = this.trend;
        const comparison = this.comparison;
        const icon = this.icon;

        // Get container classes based on layout
        const containerClasses = this.getContainerClasses(layout);

        // Format the value
        const formattedValue = this.formatValue(value);

        // Create trend indicator if provided
        const trendIndicator = trend ? this.createTrendIndicator(trend) : '';

        // Create comparison text if provided
        const comparisonText = comparison ?
            `<div class="stat-comparison text-sm text-gray-500">${comparison}</div>` : '';

        // Create icon if provided
        const iconElement = icon ?
            `<div class="stat-icon ${layout === 'horizontal' ? 'mr-4' : 'mb-2'}">${icon}</div>` : '';

        // Create the stat component HTML
        const statHTML = `
            <div class="${containerClasses}">
                ${iconElement}
                <div class="stat-content">
                    <div class="stat-header ${trend ? 'flex items-center' : ''}">
                        <div class="stat-value text-xl font-bold">${formattedValue}</div>
                        ${trendIndicator}
                    </div>
                    <div class="stat-label text-sm text-gray-600">${label}</div>
                    ${comparisonText}
                </div>
            </div>
        `;

        this.innerHTML = statHTML;
    }

    getContainerClasses(layout) {
        let classes = 'stat-container ';

        // Layout classes
        if (layout === 'horizontal') {
            classes += 'flex items-center ';
        } else {
            classes += 'flex flex-col ';
        }

        // Add additional classes
        if (this.class) {
            classes += this.class + ' ';
        }

        return classes.trim();
    }

    formatValue(value) {
        if (!value) return '0';

        let formattedValue = value;

        // Apply formatting based on type
        const type = this.type.toLowerCase();

        try {
            if (type === 'number') {
                // Number formatting
                const parsedNumber = parseFloat(value);
                const options = {
                    minimumFractionDigits: parseInt(this.getAttribute('decimal-places') || '0', 10),
                    maximumFractionDigits: parseInt(this.getAttribute('decimal-places') || '2', 10)
                };

                // Add thousand separators
                formattedValue = parsedNumber.toLocaleString(undefined, options);
            } else if (type === 'percentage') {
                // Percentage formatting
                let parsedPercentage = parseFloat(value);

                // If value is already in percentage format (e.g., 75 instead of 0.75)
                if (this.hasAttribute('percentage-value')) {
                    formattedValue = `${parsedPercentage.toFixed(parseInt(this.getAttribute('decimal-places') || '0', 10))}%`;
                } else {
                    // Convert decimal to percentage (e.g., 0.75 to 75%)
                    parsedPercentage *= 100;
                    formattedValue = `${parsedPercentage.toFixed(parseInt(this.getAttribute('decimal-places') || '0', 10))}%`;
                }
            } else if (type === 'currency') {
                // Currency formatting
                const parsedAmount = parseFloat(value);
                const currencyCode = this.getAttribute('currency') || 'USD';

                formattedValue = parsedAmount.toLocaleString(undefined, {
                    style: 'currency',
                    currency: currencyCode,
                    minimumFractionDigits: parseInt(this.getAttribute('decimal-places') || '2', 10),
                    maximumFractionDigits: parseInt(this.getAttribute('decimal-places') || '2', 10)
                });
            }
        } catch (e) {
            // If any error occurs, return the original value
            console.error('Error formatting stat value:', e);
        }

        return formattedValue;
    }

    createTrendIndicator(trend) {
        const direction = trend.toLowerCase();
        let trendHTML = '';

        if (direction === 'up' || direction === 'increase') {
            // Up/increase trend - green arrow up
            trendHTML = `
                <div class="stat-trend-indicator ml-2 text-green-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                    ${this.trendValue ? `<span class="ml-1">${this.trendValue}</span>` : ''}
                </div>
            `;
        } else if (direction === 'down' || direction === 'decrease') {
            // Down/decrease trend - red arrow down
            trendHTML = `
                <div class="stat-trend-indicator ml-2 text-red-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                    ${this.trendValue ? `<span class="ml-1">${this.trendValue}</span>` : ''}
                </div>
            `;
        } else if (direction === 'neutral' || direction === 'unchanged') {
            // Neutral/unchanged trend - gray line
            trendHTML = `
                <div class="stat-trend-indicator ml-2 text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14" />
                    </svg>
                    ${this.trendValue ? `<span class="ml-1">${this.trendValue}</span>` : ''}
                </div>
            `;
        }

        return trendHTML;
    }

    static get observedAttributes() {
        return [
            'value', 'label', 'trend', 'trend-value', 'comparison', 'icon',
            'type', 'decimal-places', 'currency', 'percentage-value',
            'layout', 'class'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get value() {
        return this.getAttribute('value') || '0';
    }

    set value(val) {
        this.setAttribute('value', val);
    }

    get label() {
        return this.getAttribute('label') || 'Statistic';
    }

    set label(val) {
        this.setAttribute('label', val);
    }

    get trend() {
        return this.getAttribute('trend');
    }

    set trend(val) {
        val ? this.setAttribute('trend', val) : this.removeAttribute('trend');
    }

    get trendValue() {
        return this.getAttribute('trend-value');
    }

    set trendValue(val) {
        val ? this.setAttribute('trend-value', val) : this.removeAttribute('trend-value');
    }

    get comparison() {
        return this.getAttribute('comparison');
    }

    set comparison(val) {
        val ? this.setAttribute('comparison', val) : this.removeAttribute('comparison');
    }

    get icon() {
        return this.getAttribute('icon');
    }

    set icon(val) {
        val ? this.setAttribute('icon', val) : this.removeAttribute('icon');
    }

    get type() {
        return this.getAttribute('type') || 'number';
    }

    set type(val) {
        this.setAttribute('type', val);
    }

    get layout() {
        return this.getAttribute('layout') || 'vertical';
    }

    set layout(val) {
        this.setAttribute('layout', val);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(val) {
        val ? this.setAttribute('class', val) : this.removeAttribute('class');
    }
}

// Define the custom element
customElements.define('dry-stat', Stat);