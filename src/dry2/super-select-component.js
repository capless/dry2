class SuperSelect extends HTMLElement {
    constructor() {
        super();
        this.selectedOptions = new Set();
    }

    connectedCallback() {
        if (!this.hasAttribute('data-rendered')) {
            // Use requestAnimationFrame to ensure DOM is fully parsed
            requestAnimationFrame(() => {
                this.render();
                this.setupEventListeners();
                this.setAttribute('data-rendered', '');
            });
        } else {
            this.setupEventListeners();
        }
    }

    render() {
        const options = Array.from(this.querySelectorAll('option')).map(option => ({
            value: option.value,
            label: option.textContent,
            selected: option.selected
        }));

        // Fix: Check if options array is empty
        if (options.length === 0) {
            // Try to parse innerHTML manually as fallback
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.innerHTML;
            const fallbackOptions = Array.from(tempDiv.querySelectorAll('option')).map(option => ({
                value: option.value,
                label: option.textContent,
                selected: option.selected
            }));

            if (fallbackOptions.length === 0) {
                console.warn('SuperSelect: No options found. Make sure to include <option> elements inside <super-select>.');
                this.innerHTML = `
                    <div class="relative inline-block w-full">
                        <button type="button" class="${this.buttonClass}" disabled>
                            <span class="truncate block max-w-[200px]">No options available</span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                    </div>
                `;
                return;
            } else {
                // Use fallback options
                options.splice(0, 0, ...fallbackOptions);
            }
        }

        const selectedOption = options.find(opt => opt.selected) || options[0];
        if (selectedOption && selectedOption.selected) {
            this.selectedOptions.add(selectedOption.value);
        }

        const isMultiple = this.hasAttribute('multiple');

        this.innerHTML = `
            <div class="relative inline-block w-full">
                <button type="button" class="${this.buttonClass}" title="${selectedOption.label}">
                    <span class="truncate block max-w-[200px]">${this.truncateText(selectedOption.label, 15)}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="${this.dropdownClass} hidden">
                    <div class="flex flex-wrap gap-2 p-2 border-b">
                        <input class="flex-grow min-w-0 outline-none" type="text" placeholder="Search options...">
                    </div>
                    <ul class="max-h-60 overflow-y-auto">
                        ${options.map(option => `
                            <li class="px-3 py-2 cursor-pointer hover:bg-gray-100 ${option.selected ? 'bg-blue-500 text-white' : ''}" data-value="${option.value}">${option.label}</li>
                        `).join('')}
                    </ul>
                </div>
                ${isMultiple
            ? this.selectedOptions.size > 0
                ? Array.from(this.selectedOptions).map(value => `<input type="hidden" name="${escapeHtml(this.getAttribute('name'))}" value="${value}">`).join('')
                : `<input type="hidden" name="${escapeHtml(this.getAttribute('name'))}" value="">`
            : `<input type="hidden" name="${escapeHtml(this.getAttribute('name'))}" value="${selectedOption ? selectedOption.value : ''}">`
        }
            </div>
        `;
    }

    setupEventListeners() {
        const button = this.querySelector('button');
        const dropdown = this.querySelector('div > div');
        const searchInput = this.querySelector('input[type="text"]');
        const optionsList = this.querySelector('ul');
        const isMultiple = this.hasAttribute('multiple');

        // Check if elements exist before adding listeners
        if (!button || !dropdown) return;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains('hidden') && searchInput) {
                searchInput.focus();
            }
        });

        if (searchInput && optionsList) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                Array.from(optionsList.children).forEach(option => {
                    const text = option.textContent.toLowerCase();
                    option.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }

        if (optionsList) {
            optionsList.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    const value = e.target.dataset.value;
                    const label = e.target.textContent;
                    if (isMultiple) {
                        this.toggleOption(value, label);
                    } else {
                        this.selectOption(value, label);
                        dropdown.classList.add('hidden');
                    }
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!this.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    }

    toggleOption(value, label) {
        if (this.selectedOptions.has(value)) {
            this.selectedOptions.delete(value);
            this.removeHiddenInput(value);
            this.removePill(value);
        } else {
            this.selectedOptions.add(value);
            this.addHiddenInput(value);
            this.addPill(value, label);
        }
        this.updateButtonText();
        this.highlightSelectedOptions();
    }

    selectOption(value, label) {
        this.selectedOptions.clear();
        this.selectedOptions.add(value);
        const hiddenInput = this.querySelector('input[type="hidden"]');
        if (hiddenInput) {
            hiddenInput.value = value;
        }
        this.updateButtonText(label);
        this.highlightSelectedOptions();
        this.dispatchEvent(new Event('change', {bubbles: true}));
    }

    addHiddenInput(value) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = this.getAttribute('name');
        input.value = value;
        this.appendChild(input);
    }

    removeHiddenInput(value) {
        const input = this.querySelector(`input[type="hidden"][value="${value}"]`);
        if (input) input.remove();
    }

    addPill(value, label) {
        const pillsContainer = this.querySelector('div.flex.flex-wrap');
        if (!pillsContainer) return;

        const pill = document.createElement('span');
        pill.className = 'bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded flex items-center';
        pill.innerHTML = `
            ${this.truncateText(escapeHtml(label), 15)}
            <button type="button" class="ml-1 text-blue-600 hover:text-blue-900" data-value="${escapeHtml(value)}">&times;</button>
        `;
        pill.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleOption(value, label);
        });
        pillsContainer.insertBefore(pill, pillsContainer.lastElementChild);
    }

    removePill(value) {
        const pillButton = this.querySelector(`span button[data-value="${value}"]`);
        if (pillButton && pillButton.parentNode) {
            pillButton.parentNode.remove();
        }
    }

    updateButtonText(text) {
        const button = this.querySelector('button');
        const buttonText = button?.querySelector('span');
        if (!button || !buttonText) return;

        if (this.hasAttribute('multiple')) {
            const newText = this.selectedOptions.size > 0
                ? `${this.selectedOptions.size} selected`
                : 'Select options';
            buttonText.textContent = newText;
            button.title = newText;
        } else {
            const newText = text || 'Select an option';
            buttonText.textContent = this.truncateText(newText, 15);
            button.title = newText;
        }
    }

    highlightSelectedOptions() {
        const optionsList = this.querySelector('ul');
        if (!optionsList) return;

        Array.from(optionsList.children).forEach(option => {
            if (this.selectedOptions.has(option.dataset.value)) {
                option.classList.add('bg-blue-500', 'text-white');
                option.classList.remove('hover:bg-gray-100');
            } else {
                option.classList.remove('bg-blue-500', 'text-white');
                option.classList.add('hover:bg-gray-100');
            }
        });
    }

    truncateText(text, maxLength) {
        return text && text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text || '';
    }

    get buttonClass() {
        return this.getAttribute('button-class') || 'w-full flex items-center justify-between px-4 py-1-75 text-sm bg-white border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500';
    }

    get dropdownClass() {
        return this.getAttribute('dropdown-class') || 'absolute w-full z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg';
    }

    get value() {
        if (this.hasAttribute('multiple')) {
            return Array.from(this.selectedOptions);
        } else {
            const hiddenInput = this.querySelector('input[type="hidden"]');
            return hiddenInput ? hiddenInput.value : '';
        }
    }

    set value(newValue) {
        if (this.hasAttribute('multiple')) {
            this.selectedOptions = new Set(Array.isArray(newValue) ? newValue : [newValue]);
            this.updateMultipleSelection();
        } else {
            const hiddenInput = this.querySelector('input[type="hidden"]');
            if (hiddenInput) {
                hiddenInput.value = newValue;
                const option = this.querySelector(`li[data-value="${newValue}"]`);
                this.updateButtonText(option ? option.textContent : '');
            }
        }
        this.highlightSelectedOptions();
    }

    updateMultipleSelection() {
        this.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());
        const pillsContainer = this.querySelector('div.flex.flex-wrap');
        if (pillsContainer) {
            pillsContainer.innerHTML = '<input class="flex-grow min-w-0 outline-none" type="text" placeholder="Search options...">';
        }
        this.selectedOptions.forEach(value => {
            const option = this.querySelector(`li[data-value="${value}"]`);
            if (option) {
                const label = option.textContent;
                this.addHiddenInput(value);
                this.addPill(value, label);
            }
        });
        this.updateButtonText();
        this.highlightSelectedOptions();
    }

    // Method to refresh the component (useful for dynamic content)
    refresh() {
        this.removeAttribute('data-rendered');
        this.selectedOptions.clear();
        this.connectedCallback();
    }
}

// Helper function for escaping HTML (add this if not already defined elsewhere)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

customElements.define('super-select', SuperSelect);