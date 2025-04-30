function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
class BaseWebComponent extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // Override this method in subclasses to define the component's HTML structure
    }
}


class AjaxDialog extends HTMLElement {
    // Web component for creating a dialog that fetches content via AJAX
    connectedCallback() {
        if (!this.hasAttribute('data-rendered')) {
            this.render();
            this.attachEventListeners();
            this.setAttribute('data-rendered', '');
        } else {
            this.attachEventListeners();
        }
    }

    render() {
        const originalChildren = this.innerHTML;
        this.innerHTML = `
        <div class="relative">
          <a id="${this.triggerId}" class="${this.buttonClass}" href="${this.url}" hx-get="${this.url}" hx-trigger="${this.triggerType}" hx-target="#${this.dialogInnerId}">
            <slot>${originalChildren}</slot>
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
    }

    attachEventListeners() {
        const dialog = this.querySelector('dialog');
        const trigger = this.querySelector('a');
        const closer = this.querySelector('svg#closer');

        trigger.addEventListener('click', () => {
            dialog.open ? dialog.close() : dialog.showModal();
        });

        closer.addEventListener('click', () => {
            dialog.close();
        });

        document.body.addEventListener('htmx:afterOnLoad', (event) => {
            const { finalRequestPath, responsePath } = event.detail.pathInfo;
            if (finalRequestPath !== responsePath || event.detail.xhr.getResponseHeader('HX-CloseDialog') === 'close') {
                dialog.close();
            }
        });
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

customElements.define('ajax-dialog', AjaxDialog);

class DatePicker extends HTMLElement {
    constructor() {
        super();
        this.currentViewDate = new Date();
    }

    sanitizeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    connectedCallback() {
        this.render();
        this.input = this.querySelector('input');
        this.calendarElement = this.querySelector('.calendar');
        this.selectedDate = null;

        if (this.input) {
            this.input.addEventListener('click', () => this.show());
            this.input.addEventListener('focus', () => this.show());
            this.input.addEventListener('input', (e) => this.handleInputChange(e));
            this.input.addEventListener('blur', () => this.validateInput());
        }

        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        const initialValue = this.getAttribute('value') || (this.input ? this.input.value : '');
        if (initialValue) {
            this.selectedDate = this.parseDate(initialValue);
            if (this.input) {
                this.input.value = this.formatDate(this.selectedDate);
            }
            this.currentViewDate = new Date(this.selectedDate);
        }
    }

    render() {
        const placeholder = this.sanitizeHTML(this.getAttribute('placeholder') || 'YYYY-MM-DD');
        const inputId = this.sanitizeHTML(this.getAttribute('input-id') || '');
        const inputName = this.sanitizeHTML(this.getAttribute('input-name') || '');
        const inputClass = this.sanitizeHTML(this.getAttribute('input-class') || 'block w-full rounded-md border-0 py-1.5 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6');
        const calendarClass = this.sanitizeHTML(this.getAttribute('calendar-class') || 'absolute z-10 bg-white border border-solid border-gray-200 rounded p-3 hidden shadow-lg w-64 left-0 mt-1');
        const initialValue = this.sanitizeHTML(this.getAttribute('value') || '');

        if (!this.hasChildNodes()) {
            const container = document.createElement('div');
            container.className = 'relative';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = placeholder;
            input.id = inputId;
            input.name = inputName;
            input.className = inputClass;
            input.value = initialValue;

            const calendar = document.createElement('div');
            calendar.className = `calendar ${calendarClass}`;

            container.appendChild(input);
            container.appendChild(calendar);
            this.appendChild(container);
        }
    }

    show() {
        if (!this.calendarElement) {
            this.calendarElement = this.querySelector('.calendar');
            if (!this.calendarElement) return;
        }

        if (!this.calendarElement.innerHTML) {
            this.renderCalendar();
        } else {
            this.updateCalendarView();
        }
        this.calendarElement.classList.remove('hidden');
    }

    hide() {
        if (this.calendarElement) {
            this.calendarElement.classList.add('hidden');
        }
    }

    updateCalendarView() {
        const viewDate = this.selectedDate || this.currentViewDate;
        this.currentViewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        this.renderCalendar();
    }

    renderCalendar() {
        if (!this.calendarElement) return;

        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();

        const headerClass = this.sanitizeHTML(this.getAttribute('header-class') || 'flex justify-between items-center mb-4');
        const buttonClass = this.sanitizeHTML(this.getAttribute('button-class') || 'text-blue-500 hover:bg-blue-100 rounded px-2 py-1');

        const headerHtml = `
            <div class="${headerClass}">
                <button class="prev-month ${buttonClass}">&lt;</button>
                <span class="font-bold">${this.sanitizeHTML(this.getMonthName(month))} ${year}</span>
                <button class="next-month ${buttonClass}">&gt;</button>
            </div>
        `;

        const daysHtml = this.generateDaysHtml(year, month);

        this.calendarElement.innerHTML = headerHtml + daysHtml;

        this.calendarElement.querySelector('.prev-month').addEventListener('click', (e) => {
            e.stopPropagation();
            this.prevMonth();
        });
        this.calendarElement.querySelector('.next-month').addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextMonth();
        });
        this.calendarElement.querySelectorAll('.day').forEach(day => {
            day.addEventListener('click', (e) => this.selectDate(e.target));
        });
    }

    generateDaysHtml(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const today = new Date();

        const dayNameClass = this.sanitizeHTML(this.getAttribute('day-name-class') || 'text-gray-500 font-bold text-xs');
        const dayClass = this.sanitizeHTML(this.getAttribute('day-class') || 'flex justify-center items-center p-1 text-sm rounded cursor-pointer hover:bg-blue-100');
        const selectedDayClass = this.sanitizeHTML(this.getAttribute('selected-day-class') || 'bg-blue-500 text-white hover:bg-blue-600');
        const todayClass = this.sanitizeHTML(this.getAttribute('today-class') || 'border border-blue-500 font-bold');

        let html = `<div class="${this.sanitizeHTML(this.getAttribute('calendar-grid-class') || 'grid grid-cols-7 gap-1 text-center')}">`;
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            html += `<div class="${dayNameClass}">${this.sanitizeHTML(day)}</div>`;
        });

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="p-1"></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = this.selectedDate &&
                date.toDateString() === this.selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();

            let classes = `day ${dayClass} `;
            if (isSelected) classes += `${selectedDayClass} `;
            if (isToday) classes += `${todayClass} `;

            html += `<div class="${this.sanitizeHTML(classes)}" data-date="${this.sanitizeHTML(date.toISOString())}">${day}</div>`;
        }

        html += '</div>';
        return html;
    }

    prevMonth() {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
        this.renderCalendar();
    }

    selectDate(dayElement) {
        this.selectedDate = new Date(dayElement.dataset.date);
        if (this.input) {
            this.input.value = this.formatDate(this.selectedDate);
        }
        this.currentViewDate = new Date(this.selectedDate);
        this.renderCalendar();
        this.hide();
        this.dispatchEvent(new Event('change', { bubbles: true }));
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    parseDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    getMonthName(month) {
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July',
            'August', 'September', 'October', 'November', 'December'][month];
    }

    handleOutsideClick(e) {
        if (!this.contains(e.target) && this.calendarElement && !this.calendarElement.classList.contains('hidden')) {
            this.hide();
        }
    }

    handleInputChange(e) {
        const input = e.target.value;
        if (this.isValidDateFormat(input)) {
            const date = this.parseDate(input);
            if (this.isValidDate(date)) {
                this.selectedDate = date;
                this.currentViewDate = new Date(date);
                this.updateCalendarView();
            }
        }
    }

    validateInput() {
        if (!this.input) return;

        const input = this.input.value;
        if (input && !this.isValidDateFormat(input)) {
            this.input.value = this.selectedDate ? this.formatDate(this.selectedDate) : '';
        } else if (this.isValidDateFormat(input)) {
            const date = this.parseDate(input);
            if (!this.isValidDate(date)) {
                this.input.value = this.selectedDate ? this.formatDate(this.selectedDate) : '';
            }
        }
    }

    isValidDateFormat(dateString) {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    }

    isValidDate(date) {
        return date instanceof Date && !isNaN(date);
    }
}


// Define the custom element
customElements.define('date-picker', DatePicker);

class ToggleSwitch extends HTMLElement {
    //
    constructor() {
        super();
        // Do not use shadow DOM
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const id = this.getAttribute('id') || '';
        const name = encodeURI(this.getAttribute('name') || '');
        const checked = this.hasAttribute('checked');
        const activeColor = this.getAttribute('active-color') || 'bg-green-500';
        const inactiveColor = this.getAttribute('inactive-color') || 'bg-gray-300';

        this.innerHTML = `
            <div class="relative inline-block w-10 mr-2 align-middle select-none" x-data="{ checked: ${checked} }">
                <input type="checkbox" name="${name}" id="${id}" x-model="checked" value="y"
                       class="outline-none focus:outline-none right-4 checked:right-0 duration-200 ease-in absolute block w-6 h-6 rounded-full bg-white border-gray-300 checked:border-green-500 border-2 shadow-xs appearance-none cursor-pointer"/>
                <label for="${id}" class="block overflow-hidden h-6 rounded-full cursor-pointer" :class="checked ? '${activeColor}' : '${inactiveColor}'"></label>
            </div>
        `;
    }

    setupEventListeners() {
        // Alpine.js will handle the reactivity, so we don't need additional event listeners
    }

    static get observedAttributes() {
        return ['checked', 'active-color', 'inactive-color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }
}

customElements.define('toggle-switch', ToggleSwitch);


class SuperSelect extends HTMLElement {
    constructor() {
        super();
        this.selectedOptions = new Set();
    }

    connectedCallback() {
        if (!this.hasAttribute('data-rendered')) {
            this.render();
            this.setupEventListeners();
            this.setAttribute('data-rendered', '');
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

        const selectedOption = options.find(opt => opt.selected) || options[0];
        if (selectedOption.selected) {
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
            : `<input type="hidden" name="${escapeHtml(this.getAttribute('name'))}" value="${selectedOption.value}">`
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

        button.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains('hidden')) {
                searchInput.focus();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            Array.from(optionsList.children).forEach(option => {
                const text = option.textContent.toLowerCase();
                option.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });

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
        this.querySelector('input[type="hidden"]').value = value;
        this.updateButtonText(label);
        this.highlightSelectedOptions();
        this.dispatchEvent(new Event('change', { bubbles: true }));
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
        const pill = this.querySelector(`span button[data-value="${value}"]`).parentNode;
        pill.remove();
    }

    updateButtonText(text) {
        const button = this.querySelector('button');
        const buttonText = button.querySelector('span');
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
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    }

    get buttonClass() {
        return this.getAttribute('button-class') || 'w-full flex items-center justify-between px-4 py-1-75 text-sm bg-white border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500';
    }

    get dropdownClass() {
        return this.getAttribute('dropdown-class') || 'absolute w-full z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg';
    }

    get value() {
        return this.hasAttribute('multiple')
            ? Array.from(this.selectedOptions)
            : this.querySelector('input[type="hidden"]').value;
    }

    set value(newValue) {
        if (this.hasAttribute('multiple')) {
            this.selectedOptions = new Set(Array.isArray(newValue) ? newValue : [newValue]);
            this.updateMultipleSelection();
        } else {
            this.querySelector('input[type="hidden"]').value = newValue;
            this.updateButtonText(this.querySelector(`li[data-value="${newValue}"]`).textContent);
        }
        this.highlightSelectedOptions();
    }

    updateMultipleSelection() {
        this.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());
        this.querySelector('div.flex.flex-wrap').innerHTML = '<input class="flex-grow min-w-0 outline-none" type="text" placeholder="Search options...">';
        this.selectedOptions.forEach(value => {
            const label = this.querySelector(`li[data-value="${value}"]`).textContent;
            this.addHiddenInput(value);
            this.addPill(value, label);
        });
        this.updateButtonText();
        this.highlightSelectedOptions();
    }
}

customElements.define('super-select', SuperSelect);

class WYSIWYGEditor extends BaseWebComponent {
    constructor() {
        super();
        this.actions = [
            { command: 'bold', icon: this.boldIcon() },
            { command: 'italic', icon: this.italicIcon() },
            { command: 'underline', icon: this.underlineIcon() },
            { command: 'insertUnorderedList', icon: this.ulIcon() },
            { command: 'insertOrderedList', icon: this.olIcon() },
            { command: 'createLink', icon: this.linkIcon() },
            { command: 'toggleCode', icon: this.codeIcon() },
        ];
    }

    render() {
        this.innerHTML = `
            <div x-data="editorData()" class="border rounded-lg overflow-hidden">
                <div class="bg-gray-100 p-2 flex space-x-1">
                    ${this.actions.map(action => `
                        <button @click="execCommand('${action.command}')" 
                                class="p-2 bg-white rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150 ease-in-out"
                                :class="{ 'bg-blue-100': isCodeView && '${action.command}' === 'toggleCode' }">
                            ${action.icon}
                        </button>
                    `).join('')}
                </div>
                <div x-ref="editor" 
                     contenteditable="true" 
                     class="p-4 min-h-[200px] focus:outline-none font-mono" 
                     :class="{ 'font-mono bg-gray-50': isCodeView, 'font-normal bg-white': !isCodeView }"
                     @input="updateContent()">
                </div>
            </div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        this.initAlpine();
    }

    initAlpine() {
        window.editorData = () => {
            return {
                content: '',
                isCodeView: false,
                init() {
                    // Set initial content
                    if (this.$refs.editor) {
                        this.$refs.editor.innerHTML = this.safeContent();
                        this.content = this.$refs.editor.innerHTML;
                    }
                },
                execCommand(command) {
                    if (command === 'createLink') {
                        const url = prompt('Enter the URL:');
                        if (url && this.validateURL(url)) {
                            document.execCommand('createLink', false, url);
                        } else {
                            alert('Invalid URL. Please enter a valid http or https URL.');
                        }
                    } else if (command === 'toggleCode') {
                        this.toggleCodeView();
                        return;
                    } else {
                        document.execCommand(command, false, null);
                    }
                    this.$refs.editor.focus();
                    this.updateContent();
                },
                toggleCodeView() {
                    this.isCodeView = !this.isCodeView;

                    if (this.isCodeView) {
                        // Switch to code view - show HTML as text
                        const htmlContent = this.$refs.editor.innerHTML;
                        this.$refs.editor.textContent = htmlContent;
                    } else {
                        // Switch back to WYSIWYG view
                        const htmlSource = this.$refs.editor.textContent;
                        // Sanitize before rendering HTML
                        this.$refs.editor.innerHTML = DOMPurify.sanitize(htmlSource);
                    }

                    this.updateContent();
                },
                updateContent() {
                    if (this.isCodeView) {
                        // In code view mode, just store the raw text content
                        this.content = this.$refs.editor.textContent;
                    } else {
                        // In WYSIWYG mode, sanitize the content first
                        this.content = DOMPurify.sanitize(this.$refs.editor.innerHTML);
                        // Update the editor with sanitized content
                        this.$refs.editor.innerHTML = this.content;
                    }
                    // Dispatch event with current content
                    this.$dispatch('content-updated', this.content);
                },
                validateURL(url) {
                    try {
                        const parsedURL = new URL(url, window.location.origin);
                        return ['http:', 'https:'].includes(parsedURL.protocol);
                    } catch (e) {
                        return false;
                    }
                },
                safeContent() {
                    // Return empty string initially
                    return '';
                }
            }
        }
    }

    boldIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>';
    }

    italicIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>';
    }

    underlineIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>';
    }

    ulIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
    }

    olIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>';
    }

    linkIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
    }

    codeIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    }
}

customElements.define('wysiwyg-editor', WYSIWYGEditor);

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
customElements.define('qr-code', QRCode);

class TabsComponent extends BaseWebComponent {
    constructor() {
        super();
        this._activeTab = 0;
    }

    render() {
        // Extract tab headers and contents from slot elements
        const tabElements = Array.from(this.querySelectorAll('tab-item'));
        const tabHeaders = tabElements.map((tab, index) => {
            const title = tab.getAttribute('title') || `Tab ${index + 1}`;
            const icon = tab.getAttribute('icon') || '';
            const iconHtml = icon ? `<i class="${this.sanitizeHTML(icon)} mr-2"></i>` : '';

            return `
                <button data-tab-index="${index}" 
                        class="tab-header ${this._activeTab === index ? this.activeTabClass : this.inactiveTabClass}">
                    ${iconHtml}${this.sanitizeHTML(title)}
                </button>
            `;
        }).join('');

        const tabContents = tabElements.map((tab, index) => {
            return `
                <div data-tab-content="${index}" 
                     class="tab-content ${this._activeTab === index ? '' : 'hidden'} ${this.contentClass}">
                    ${tab.innerHTML}
                </div>
            `;
        }).join('');

        this.innerHTML = `
            <div class="tabs-container ${this.containerClass}">
                <div class="tabs-header ${this.headerContainerClass}">
                    ${tabHeaders}
                </div>
                <div class="tabs-content ${this.contentContainerClass}">
                    ${tabContents}
                </div>
            </div>
        `;

        // Attach event listeners
        this.querySelectorAll('.tab-header').forEach(tabHeader => {
            tabHeader.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-tab-index'));
                this.setActiveTab(index);
            });
        });
    }

    setActiveTab(index) {
        // Update active tab
        this._activeTab = index;

        // Update tab headers
        this.querySelectorAll('.tab-header').forEach((header, i) => {
            if (i === index) {
                header.classList.remove(...this.inactiveTabClass.split(' '));
                header.classList.add(...this.activeTabClass.split(' '));
            } else {
                header.classList.remove(...this.activeTabClass.split(' '));
                header.classList.add(...this.inactiveTabClass.split(' '));
            }
        });

        // Update tab contents
        this.querySelectorAll('.tab-content').forEach((content, i) => {
            if (i === index) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        // Dispatch event
        this.dispatchEvent(new CustomEvent('tab-changed', {
            bubbles: true,
            detail: { index, tabsComponent: this }
        }));
    }

    // Helper method to sanitize HTML
    sanitizeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Getters for custom attributes with defaults
    get containerClass() {
        return this.getAttribute('container-class') || '';
    }

    get headerContainerClass() {
        return this.getAttribute('header-container-class') || 'flex border-b';
    }

    get activeTabClass() {
        return this.getAttribute('active-tab-class') || 'px-4 py-2 text-blue-500 border-b-2 border-blue-500 -mb-px';
    }

    get inactiveTabClass() {
        return this.getAttribute('inactive-tab-class') || 'px-4 py-2 text-gray-500 hover:text-blue-500';
    }

    get contentContainerClass() {
        return this.getAttribute('content-container-class') || 'pt-4';
    }

    get contentClass() {
        return this.getAttribute('content-class') || '';
    }

    // Allow programmatic access to active tab
    get activeTab() {
        return this._activeTab;
    }

    set activeTab(index) {
        this.setActiveTab(index);
    }
}

class TabItem extends HTMLElement {
    constructor() {
        super();
    }
}

// Register custom elements
customElements.define('tabs-component', TabsComponent);
customElements.define('tab-item', TabItem);

class Toast extends BaseWebComponent {
    constructor() {
        super();
        this.visible = false;
        this.duration = 3000; // Default duration in milliseconds
        this.timeoutId = null;
    }

    render() {
        const type = this.getAttribute('type') || 'info';
        const position = this.getAttribute('position') || 'bottom-right';
        const containerClass = this.getAttribute('container-class') || this.getDefaultContainerClass(position);
        const toastClass = this.getAttribute('toast-class') || this.getDefaultToastClass(type);

        // Create container if it doesn't exist
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = containerClass;
            document.body.appendChild(container);
        } else {
            container.className = containerClass;
        }

        // Create toast element
        this.toastElement = document.createElement('div');
        this.toastElement.className = `toast ${toastClass} transform transition-all duration-300 opacity-0 translate-y-2 flex items-center`;

        // Toast icon based on type
        this.toastElement.innerHTML = `
            <div class="mr-3">
                ${this.getIconForType(type)}
            </div>
            <div class="flex-grow">
                ${this.getAttribute('message') || this.innerHTML}
            </div>
            <button type="button" class="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none">
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;

        // Add the toast to the container
        container.appendChild(this.toastElement);

        // Add event listener to close button
        const closeButton = this.toastElement.querySelector('button');
        closeButton.addEventListener('click', () => this.hide());

        // Show toast if auto-show is enabled
        if (this.hasAttribute('auto-show')) {
            this.show();
        }
    }

    getDefaultContainerClass(position) {
        const positionClasses = {
            'top-left': 'fixed top-4 left-4 z-50 space-y-2',
            'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2',
            'top-right': 'fixed top-4 right-4 z-50 space-y-2',
            'bottom-left': 'fixed bottom-4 left-4 z-50 space-y-2 flex flex-col-reverse',
            'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2 flex flex-col-reverse',
            'bottom-right': 'fixed bottom-4 right-4 z-50 space-y-2 flex flex-col-reverse'
        };

        return positionClasses[position] || positionClasses['bottom-right'];
    }

    getDefaultToastClass(type) {
        const typeClasses = {
            'success': 'bg-green-50 text-green-800 border-l-4 border-green-400 p-4 rounded shadow-md',
            'error': 'bg-red-50 text-red-800 border-l-4 border-red-400 p-4 rounded shadow-md',
            'warning': 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 p-4 rounded shadow-md',
            'info': 'bg-blue-50 text-blue-800 border-l-4 border-blue-400 p-4 rounded shadow-md'
        };

        return typeClasses[type] || typeClasses['info'];
    }

    getIconForType(type) {
        const icons = {
            'success': '<svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
            'error': '<svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
            'warning': '<svg class="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>',
            'info': '<svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>'
        };

        return icons[type] || icons['info'];
    }

    show() {
        if (!this.toastElement) return;

        this.visible = true;

        // Clear any existing timeout
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Make toast visible with animation
        setTimeout(() => {
            this.toastElement.classList.remove('opacity-0', 'translate-y-2');
            this.toastElement.classList.add('opacity-100', 'translate-y-0');
        }, 10);

        // Set timeout to hide toast after duration
        const duration = parseInt(this.getAttribute('duration')) || this.duration;
        if (duration > 0) {
            this.timeoutId = setTimeout(() => {
                this.hide();
            }, duration);
        }

        // Dispatch show event
        this.dispatchEvent(new CustomEvent('toast:show', {
            bubbles: true,
            detail: { toast: this }
        }));
    }

    hide() {
        if (!this.toastElement || !this.visible) return;

        this.visible = false;

        // Hide toast with animation
        this.toastElement.classList.remove('opacity-100', 'translate-y-0');
        this.toastElement.classList.add('opacity-0', 'translate-y-2');

        // Remove toast after animation
        setTimeout(() => {
            if (this.toastElement && this.toastElement.parentNode) {
                this.toastElement.parentNode.removeChild(this.toastElement);

                // Dispatch hide event
                this.dispatchEvent(new CustomEvent('toast:hide', {
                    bubbles: true,
                    detail: { toast: this }
                }));
            }
        }, 300);
    }

    static showToast(message, options = {}) {
        const toast = document.createElement('toast-component');
        toast.setAttribute('message', message);

        if (options.type) toast.setAttribute('type', options.type);
        if (options.position) toast.setAttribute('position', options.position);
        if (options.duration) toast.setAttribute('duration', options.duration);
        if (options.autoShow !== false) toast.setAttribute('auto-show', '');

        document.body.appendChild(toast);
        return toast;
    }

    // Convenience methods for different toast types
    static success(message, options = {}) {
        return Toast.showToast(message, { ...options, type: 'success' });
    }

    static error(message, options = {}) {
        return Toast.showToast(message, { ...options, type: 'error' });
    }

    static warning(message, options = {}) {
        return Toast.showToast(message, { ...options, type: 'warning' });
    }

    static info(message, options = {}) {
        return Toast.showToast(message, { ...options, type: 'info' });
    }
}

customElements.define('toast-component', Toast);

// drawer-components.js

class DryDrawer extends HTMLElement {
    // Web component for creating a basic drawer interface
    constructor() {
        super();
        this._isOpen = false;
    }

    connectedCallback() {
        if (!this.hasAttribute('data-rendered')) {
            this.render();
            this.attachEventListeners();
            this.setAttribute('data-rendered', '');
        } else {
            this.attachEventListeners();
        }
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        const headerContent = this.querySelector('[slot="header"]')?.innerHTML || this.headerContent;
        const contentSlot = this.querySelector('[slot="content"]')?.outerHTML || '<slot name="content"></slot>';

        this.innerHTML = `
        <div class="drawer-container">
            <button type="button" class="trigger-button ${this.buttonClass}">
                ${this.triggerContent}
            </button>
            <div class="drawer-wrapper fixed inset-0 z-50 pointer-events-none">
                <div class="drawer-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out opacity-0 pointer-events-none ${this.backdropClass}"></div>
                <div class="drawer fixed ${this.position === 'left' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 h-full transition-transform duration-300 ease-in-out pointer-events-auto shadow-xl ${this.drawerClass}">
                    <div class="drawer-header flex items-center justify-between p-4 border-b ${this.headerClass}">
                        <div class="drawer-title">${headerContent}</div>
                        <svg viewBox="0 0 24 24" class="drawer-close cursor-pointer h-6 w-6 text-gray-500 hover:text-gray-700">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                        </svg>
                    </div>
                    <div class="drawer-content p-4">
                        ${contentSlot}
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    attachEventListeners() {
        this.triggerButton = this.querySelector('.trigger-button');
        this.drawerElement = this.querySelector('.drawer');
        this.backdrop = this.querySelector('.drawer-backdrop');
        this.closeButton = this.querySelector('.drawer-close');
        this.drawerWrapper = this.querySelector('.drawer-wrapper');

        // Store bound methods as properties
        this.boundOpen = this.open.bind(this);
        this.boundClose = this.close.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);

        if (this.triggerButton) {
            this.triggerButton.addEventListener('click', this.boundOpen);
        }

        if (this.backdrop) {
            this.backdrop.addEventListener('click', this.boundClose);
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.boundClose);
        }

        // Add keyboard listener for ESC key
        document.addEventListener('keydown', this._handleKeyDown);
    }

    removeEventListeners() {
        if (this.triggerButton) {
            this.triggerButton.removeEventListener('click', this.boundOpen);
        }

        if (this.backdrop) {
            this.backdrop.removeEventListener('click', this.boundClose);
        }

        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.boundClose);
        }

        document.removeEventListener('keydown', this._handleKeyDown);
    }

    _handleKeyDown(event) {
        if (event.key === 'Escape' && this._isOpen) {
            this.close();
        }
    }

    open() {
        this._isOpen = true;
        this.drawerWrapper.classList.remove('pointer-events-none');
        this.drawerWrapper.classList.add('pointer-events-auto');
        this.backdrop.classList.remove('pointer-events-none', 'opacity-0');
        this.backdrop.classList.add('pointer-events-auto', 'opacity-100');

        if (this.position === 'left') {
            this.drawerElement.classList.remove('-translate-x-full');
            this.drawerElement.classList.add('translate-x-0');
        } else {
            this.drawerElement.classList.remove('translate-x-full');
            this.drawerElement.classList.add('translate-x-0');
        }

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('drawer:opened', {
            bubbles: true,
            detail: { drawer: this }
        }));
    }

    close() {
        this._isOpen = false;
        this.drawerWrapper.classList.remove('pointer-events-auto');
        this.drawerWrapper.classList.add('pointer-events-none');
        this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
        this.backdrop.classList.add('opacity-0', 'pointer-events-none');

        if (this.position === 'left') {
            this.drawerElement.classList.remove('translate-x-0');
            this.drawerElement.classList.add('-translate-x-full');
        } else {
            this.drawerElement.classList.remove('translate-x-0');
            this.drawerElement.classList.add('translate-x-full');
        }

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('drawer:closed', {
            bubbles: true,
            detail: { drawer: this }
        }));
    }

    // Getters for attributes with defaults
    get position() {
        return this.getAttribute('position') || 'right';
    }

    get drawerClass() {
        return this.getAttribute('drawer-class') || 'bg-white w-80';
    }

    get headerClass() {
        return this.getAttribute('header-class') || '';
    }

    get backdropClass() {
        return this.getAttribute('backdrop-class') || '';
    }

    get buttonClass() {
        return this.getAttribute('button-class') || 'bg-blue-500 text-white px-4 py-2 rounded';
    }

    get triggerContent() {
        return this.getAttribute('trigger-content') || 'Open Drawer';
    }

    get headerContent() {
        return this.getAttribute('header-content') || 'Drawer';
    }
}

customElements.define('dry-drawer', DryDrawer);

class AjaxDrawer extends HTMLElement {
    // Web component for creating a drawer that fetches content via AJAX
    constructor() {
        super();
        this._isOpen = false;
    }

    connectedCallback() {
        if (!this.hasAttribute('data-rendered')) {
            this.render();
            this.attachEventListeners();
            this.setAttribute('data-rendered', '');
        } else {
            this.attachEventListeners();
        }
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        const headerContent = this.querySelector('[slot="header"]')?.innerHTML || this.headerContent;

        this.innerHTML = `
        <div class="drawer-container">
            <button type="button" class="trigger-button ${this.buttonClass}" hx-get="${this.url}" hx-trigger="${this.triggerType}" hx-target="#${this.contentId}">
                ${this.triggerContent}
            </button>
            <div class="drawer-wrapper fixed inset-0 z-50 pointer-events-none">
                <div class="drawer-backdrop fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out opacity-0 pointer-events-none ${this.backdropClass}"></div>
                <div class="drawer fixed ${this.position === 'left' ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 h-full transition-transform duration-300 ease-in-out pointer-events-auto shadow-xl ${this.drawerClass}">
                    <div class="drawer-header flex items-center justify-between p-4 border-b ${this.headerClass}">
                        <div class="drawer-title">${headerContent}</div>
                        <svg viewBox="0 0 24 24" class="drawer-close cursor-pointer h-6 w-6 text-gray-500 hover:text-gray-700">
                            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
                        </svg>
                    </div>
                    <div class="drawer-content p-4">
                        <div id="${this.contentId}" class="drawer-ajax-content"></div>
                        <div class="drawer-loading hidden flex justify-center items-center p-8">
                            <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading...</span>
                        </div>
                        <div class="drawer-error hidden text-red-500 p-4">
                            There was an error loading the content. Please try again.
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    attachEventListeners() {
        this.triggerButton = this.querySelector('.trigger-button');
        this.drawerElement = this.querySelector('.drawer');
        this.backdrop = this.querySelector('.drawer-backdrop');
        this.closeButton = this.querySelector('.drawer-close');
        this.drawerWrapper = this.querySelector('.drawer-wrapper');
        this.loadingElement = this.querySelector('.drawer-loading');
        this.errorElement = this.querySelector('.drawer-error');
        this.contentElement = this.querySelector(`#${this.contentId}`);

        // Store bound methods
        this.boundClose = this.close.bind(this);
        this.boundHandleBeforeRequest = this.handleBeforeRequest.bind(this);
        this.boundHandleAfterRequest = this.handleAfterRequest.bind(this);
        this.boundHandleResponseError = this.handleResponseError.bind(this);
        this.boundHandleAfterOnLoad = this.handleAfterOnLoad.bind(this);
        this._handleKeyDown = this._handleKeyDown.bind(this);

        if (this.closeButton) {
            this.closeButton.addEventListener('click', this.boundClose);
        }

        if (this.backdrop) {
            this.backdrop.addEventListener('click', this.boundClose);
        }

        // HTMX event listeners
        document.body.addEventListener('htmx:beforeRequest', this.boundHandleBeforeRequest);
        document.body.addEventListener('htmx:afterRequest', this.boundHandleAfterRequest);
        document.body.addEventListener('htmx:responseError', this.boundHandleResponseError);
        document.body.addEventListener('htmx:afterOnLoad', this.boundHandleAfterOnLoad);

        // Add keyboard listener for ESC key
        document.addEventListener('keydown', this._handleKeyDown);
    }

    removeEventListeners() {
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', this.boundClose);
        }

        if (this.backdrop) {
            this.backdrop.removeEventListener('click', this.boundClose);
        }

        document.body.removeEventListener('htmx:beforeRequest', this.boundHandleBeforeRequest);
        document.body.removeEventListener('htmx:afterRequest', this.boundHandleAfterRequest);
        document.body.removeEventListener('htmx:responseError', this.boundHandleResponseError);
        document.body.removeEventListener('htmx:afterOnLoad', this.boundHandleAfterOnLoad);

        document.removeEventListener('keydown', this._handleKeyDown);
    }

    _handleKeyDown(event) {
        if (event.key === 'Escape' && this._isOpen) {
            this.close();
        }
    }

    handleBeforeRequest(event) {
        // Only handle events for our content element
        if (event.detail.target && event.detail.target.id === this.contentId) {
            this.open();
            this.contentElement.classList.add('hidden');
            this.loadingElement.classList.remove('hidden');
            this.errorElement.classList.add('hidden');
        }
    }

    handleAfterRequest(event) {
        // Only handle events for our content element
        if (event.detail.target && event.detail.target.id === this.contentId) {
            this.loadingElement.classList.add('hidden');
            this.contentElement.classList.remove('hidden');
        }
    }

    handleResponseError(event) {
        // Only handle events for our content element
        if (event.detail.target && event.detail.target.id === this.contentId) {
            this.loadingElement.classList.add('hidden');
            this.errorElement.classList.remove('hidden');
        }
    }

    handleAfterOnLoad(event) {
        // Check if we should close the drawer based on headers
        if (event.detail.target && event.detail.target.id === this.contentId) {
            if (event.detail.xhr.getResponseHeader('HX-CloseDrawer') === 'close') {
                this.close();
            }
        }
    }

    open() {
        this._isOpen = true;
        this.drawerWrapper.classList.remove('pointer-events-none');
        this.drawerWrapper.classList.add('pointer-events-auto');
        this.backdrop.classList.remove('pointer-events-none', 'opacity-0');
        this.backdrop.classList.add('pointer-events-auto', 'opacity-100');

        if (this.position === 'left') {
            this.drawerElement.classList.remove('-translate-x-full');
            this.drawerElement.classList.add('translate-x-0');
        } else {
            this.drawerElement.classList.remove('translate-x-full');
            this.drawerElement.classList.add('translate-x-0');
        }

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('drawer:opened', {
            bubbles: true,
            detail: { drawer: this }
        }));
    }

    close() {
        this._isOpen = false;
        this.drawerWrapper.classList.remove('pointer-events-auto');
        this.drawerWrapper.classList.add('pointer-events-none');
        this.backdrop.classList.remove('opacity-100', 'pointer-events-auto');
        this.backdrop.classList.add('opacity-0', 'pointer-events-none');

        if (this.position === 'left') {
            this.drawerElement.classList.remove('translate-x-0');
            this.drawerElement.classList.add('-translate-x-full');
        } else {
            this.drawerElement.classList.remove('translate-x-0');
            this.drawerElement.classList.add('translate-x-full');
        }

        // Reset content
        this.errorElement.classList.add('hidden');
        this.loadingElement.classList.add('hidden');

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('drawer:closed', {
            bubbles: true,
            detail: { drawer: this }
        }));
    }

    // Getters for attributes with defaults
    get position() {
        return this.getAttribute('position') || 'right';
    }

    get drawerClass() {
        return this.getAttribute('drawer-class') || 'bg-white w-80';
    }

    get headerClass() {
        return this.getAttribute('header-class') || '';
    }

    get backdropClass() {
        return this.getAttribute('backdrop-class') || '';
    }

    get buttonClass() {
        return this.getAttribute('button-class') || 'bg-blue-500 text-white px-4 py-2 rounded';
    }

    get triggerContent() {
        return this.getAttribute('trigger-content') || 'Load Content';
    }

    get headerContent() {
        return this.getAttribute('header-content') || 'Drawer';
    }

    get url() {
        return this.getAttribute('url') || '';
    }

    get triggerType() {
        return this.getAttribute('trigger-type') || 'click';
    }

    get contentId() {
        return this.getAttribute('content-id') || `drawer-content-${Math.floor(Math.random() * 10000)}`;
    }
}

customElements.define('ajax-drawer', AjaxDrawer);

class SpeedDial extends BaseWebComponent {
    constructor() {
        super();
        this._isOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.attachEventListeners();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        const position = this.position;
        const buttonClass = this.buttonClass;
        const itemClass = this.itemClass;

        // Extract action items from component
        const items = Array.from(this.querySelectorAll('speed-dial-item')).map(item => {
            return {
                icon: item.getAttribute('icon') || '',
                label: item.getAttribute('label') || '',
                color: item.getAttribute('color') || '',
                action: item.getAttribute('action') || '#'
            };
        });

        // Clone the main button icon
        const mainIcon = this.getAttribute('icon') || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        // Determine the position classes
        const positionClasses = this.getPositionClasses(position);

        this.innerHTML = `
            <div class="speed-dial-container ${positionClasses.container}">
                <div class="speed-dial-actions ${positionClasses.actions} ${this._isOpen ? 'active' : ''}">
                    ${items.map((item, index) => `
                        <a href="${this.escapeHTML(item.action)}" 
                           class="speed-dial-item ${itemClass} ${item.color}"
                           data-index="${index}" 
                           style="transition-delay: ${index * 0.05}s;"
                           title="${this.escapeHTML(item.label)}">
                            ${item.icon}
                        </a>
                    `).join('')}
                </div>
                <button type="button" class="speed-dial-button ${buttonClass}">
                    <span class="speed-dial-main-icon ${this._isOpen ? 'hidden' : ''}">${mainIcon}</span>
                    <span class="speed-dial-close-icon ${this._isOpen ? '' : 'hidden'}">${closeIcon}</span>
                </button>
            </div>
        `;
    }

    getPositionClasses(position) {
        const classes = {
            container: 'fixed z-50',
            actions: 'flex transition-all duration-300 ease-in-out opacity-0 scale-90'
        };

        switch (position) {
            case 'top-left':
                classes.container += ' top-4 left-4';
                classes.actions += ' flex-col-reverse mb-2 items-start';
                break;
            case 'top-right':
                classes.container += ' top-4 right-4';
                classes.actions += ' flex-col-reverse mb-2 items-end';
                break;
            case 'bottom-left':
                classes.container += ' bottom-4 left-4';
                classes.actions += ' flex-col mt-2 items-start';
                break;
            case 'bottom-right':
            default:
                classes.container += ' bottom-4 right-4';
                classes.actions += ' flex-col mt-2 items-end';
                break;
        }

        return classes;
    }

    attachEventListeners() {
        this.mainButton = this.querySelector('.speed-dial-button');
        this.actionsContainer = this.querySelector('.speed-dial-actions');
        this.mainIcon = this.querySelector('.speed-dial-main-icon');
        this.closeIcon = this.querySelector('.speed-dial-close-icon');
        this._boundHandleClickOutside = this._handleClickOutside.bind(this);

        if (this.mainButton) {
            this.mainButton.addEventListener('click', () => this.toggle());
        }

        // Add click listeners to action items
        this.querySelectorAll('.speed-dial-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt(item.getAttribute('data-index'));
                // Dispatch custom event with action data
                this.dispatchEvent(new CustomEvent('speed-dial:action', {
                    bubbles: true,
                    detail: {
                        index,
                        action: item.getAttribute('href'),
                        label: item.getAttribute('title')
                    }
                }));

                // If not a real URL, prevent navigation
                if (item.getAttribute('href') === '#') {
                    e.preventDefault();
                }

                // Auto close after action if configured
                if (this.autoClose) {
                    this.close();
                }
            });
        });

        // Add document listener for outside clicks
        document.addEventListener('click', this._boundHandleClickOutside);
    }

    removeEventListeners() {
        document.removeEventListener('click', this._boundHandleClickOutside);
    }

    _handleClickOutside(event) {
        if (this._isOpen && !this.contains(event.target)) {
            this.close();
        }
    }

    toggle() {
        if (this._isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this._isOpen) return;

        this._isOpen = true;
        this.actionsContainer.classList.add('active', 'opacity-100', 'scale-100');
        this.actionsContainer.classList.remove('opacity-0', 'scale-90');

        // Toggle icons
        this.mainIcon.classList.add('hidden');
        this.closeIcon.classList.remove('hidden');

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('speed-dial:opened', {
            bubbles: true,
            detail: { speedDial: this }
        }));
    }

    close() {
        if (!this._isOpen) return;

        this._isOpen = false;
        this.actionsContainer.classList.remove('active', 'opacity-100', 'scale-100');
        this.actionsContainer.classList.add('opacity-0', 'scale-90');

        // Toggle icons
        this.mainIcon.classList.remove('hidden');
        this.closeIcon.classList.add('hidden');

        // Dispatch custom event
        this.dispatchEvent(new CustomEvent('speed-dial:closed', {
            bubbles: true,
            detail: { speedDial: this }
        }));
    }

    // Helper method to escape HTML
    escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Getters for custom attributes with defaults
    get position() {
        return this.getAttribute('position') || 'bottom-right';
    }

    get buttonClass() {
        return this.getAttribute('button-class') || 'w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 focus:outline-none transform transition-transform duration-300 hover:scale-110';
    }

    get itemClass() {
        return this.getAttribute('item-class') || 'w-10 h-10 my-1 rounded-full bg-white text-gray-700 flex items-center justify-center shadow hover:scale-110 transition-all duration-200';
    }

    get autoClose() {
        return this.hasAttribute('auto-close');
    }
}

class SpeedDialItem extends HTMLElement {
    constructor() {
        super();
    }
}

// Register custom elements
customElements.define('speed-dial', SpeedDial);
customElements.define('speed-dial-item', SpeedDialItem);

// Carousel Component for DRY2 Web Components

class CarouselComponent extends BaseWebComponent {
    constructor() {
        super();
        this._currentSlide = 0;
        this._slideCount = 0;
        this._autoplayInterval = null;
        this._touchStartX = 0;
        this._touchEndX = 0;
    }

    render() {
        // Get slides from slotted content
        const slides = this.querySelectorAll('carousel-slide');
        this._slideCount = slides.length;

        if (this._slideCount === 0) {
            this.innerHTML = '<slot></slot>';
            return;
        }

        // Apply container classes
        const containerClasses = `
            carousel-container relative overflow-hidden ${this.class || ''}
        `.trim();

        // Create navigation buttons if enabled
        const navButtons = this.navigation ? this.createNavigationButtons() : '';

        // Create indicator dots if enabled
        const indicators = this.indicators ? this.createIndicators() : '';

        // Create the carousel structure
        const carouselHTML = `
            <div class="${containerClasses}">
                <div class="carousel-track flex transition-transform duration-300" style="transform: translateX(-${this._currentSlide * 100}%)">
                    <slot></slot>
                </div>
                ${navButtons}
                ${indicators}
            </div>
        `;

        this.innerHTML = carouselHTML;

        // Setup event listeners and styling on slides
        this.setupSlides();
        this.setupEventListeners();

        // Start autoplay if enabled
        this.setupAutoplay();
    }

    createNavigationButtons() {
        return `
            <button type="button" class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-opacity-100 ${this.buttonClass}" aria-label="Previous slide">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button type="button" class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow-md z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-opacity-100 ${this.buttonClass}" aria-label="Next slide">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        `;
    }

    createIndicators() {
        let indicatorDots = '';
        for (let i = 0; i < this._slideCount; i++) {
            indicatorDots += `
                <button type="button" class="carousel-indicator ${i === this._currentSlide ? 'bg-blue-500' : 'bg-gray-300'} h-2 w-2 rounded-full mx-1 transition-colors duration-200 focus:outline-none hover:bg-blue-300" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>
            `;
        }

        return `
            <div class="carousel-indicators absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center z-10 ${this.indicatorClass}">
                ${indicatorDots}
            </div>
        `;
    }

    setupSlides() {
        const slides = this.querySelectorAll('carousel-slide');
        slides.forEach((slide, index) => {
            // Make slides full width of carousel container
            slide.style.minWidth = '100%';
            slide.style.maxWidth = '100%';

            // Set aria attributes for accessibility
            slide.setAttribute('aria-hidden', index !== this._currentSlide);
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-label', `Slide ${index + 1} of ${this._slideCount}`);
        });
    }

    setupEventListeners() {
        // Find necessary elements
        const prevButton = this.querySelector('.carousel-prev');
        const nextButton = this.querySelector('.carousel-next');
        const indicators = this.querySelectorAll('.carousel-indicator');
        const carouselTrack = this.querySelector('.carousel-track');

        // Navigation button event listeners
        if (prevButton) {
            prevButton.addEventListener('click', () => this.prevSlide());
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextSlide());
        }

        // Indicator dots event listeners
        indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const slideIndex = parseInt(indicator.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });

        // Touch event listeners for swipe support
        if (carouselTrack) {
            carouselTrack.addEventListener('touchstart', (e) => {
                this._touchStartX = e.changedTouches[0].screenX;
                this.pauseAutoplay(); // Pause autoplay on touch
            });

            carouselTrack.addEventListener('touchend', (e) => {
                this._touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
                this.resumeAutoplay(); // Resume autoplay after touch
            });
        }

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prevSlide();
            } else if (e.key === 'ArrowRight') {
                this.nextSlide();
            }
        });

        // Pause autoplay on hover/focus if enabled
        if (this.pauseOnHover) {
            this.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.addEventListener('mouseleave', () => this.resumeAutoplay());
            this.addEventListener('focusin', () => this.pauseAutoplay());
            this.addEventListener('focusout', () => this.resumeAutoplay());
        }
    }

    handleSwipe() {
        const swipeThreshold = 50; // Minimum swipe distance
        const diff = this._touchStartX - this._touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left, go to next slide
                this.nextSlide();
            } else {
                // Swipe right, go to previous slide
                this.prevSlide();
            }
        }
    }

    setupAutoplay() {
        if (this.autoplay && this._slideCount > 1) {
            this.startAutoplay();
        }
    }

    startAutoplay() {
        if (this._autoplayInterval) {
            clearInterval(this._autoplayInterval);
        }

        this._autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, this.interval);
    }

    pauseAutoplay() {
        if (this._autoplayInterval) {
            clearInterval(this._autoplayInterval);
            this._autoplayInterval = null;
        }
    }

    resumeAutoplay() {
        if (this.autoplay && !this._autoplayInterval) {
            this.startAutoplay();
        }
    }

    prevSlide() {
        let newIndex = this._currentSlide - 1;
        if (newIndex < 0) {
            newIndex = this._slideCount - 1;
        }
        this.goToSlide(newIndex);
    }

    nextSlide() {
        let newIndex = this._currentSlide + 1;
        if (newIndex >= this._slideCount) {
            newIndex = 0;
        }
        this.goToSlide(newIndex);
    }

    goToSlide(index) {
        // Validate index
        if (index < 0 || index >= this._slideCount || index === this._currentSlide) {
            return;
        }

        // Update current slide
        const oldIndex = this._currentSlide;
        this._currentSlide = index;

        // Update carousel track position
        const carouselTrack = this.querySelector('.carousel-track');
        if (carouselTrack) {
            carouselTrack.style.transform = `translateX(-${this._currentSlide * 100}%)`;
        }

        // Update indicators
        const indicators = this.querySelectorAll('.carousel-indicator');
        indicators.forEach((indicator, i) => {
            if (i === this._currentSlide) {
                indicator.classList.remove('bg-gray-300');
                indicator.classList.add('bg-blue-500');
            } else {
                indicator.classList.remove('bg-blue-500');
                indicator.classList.add('bg-gray-300');
            }
        });

        // Update slide aria-hidden attributes
        const slides = this.querySelectorAll('carousel-slide');
        slides.forEach((slide, i) => {
            slide.setAttribute('aria-hidden', i !== this._currentSlide);
        });

        // Dispatch event for slide change
        this.dispatchEvent(new CustomEvent('carousel:slide', {
            bubbles: true,
            detail: {
                carousel: this,
                currentSlide: this._currentSlide,
                previousSlide: oldIndex
            }
        }));
    }

    disconnectedCallback() {
        // Clear autoplay on disconnect
        if (this._autoplayInterval) {
            clearInterval(this._autoplayInterval);
        }
    }

    static get observedAttributes() {
        return [
            'autoplay', 'interval', 'pause-on-hover', 'navigation', 'indicators',
            'class', 'button-class', 'indicator-class'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            if ((name === 'autoplay' || name === 'interval') && this.autoplay) {
                this.pauseAutoplay();
                this.setupAutoplay();
            } else {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get autoplay() {
        return this.hasAttribute('autoplay');
    }

    set autoplay(value) {
        value ? this.setAttribute('autoplay', '') : this.removeAttribute('autoplay');
    }

    get interval() {
        const value = this.getAttribute('interval');
        return value ? parseInt(value, 10) : 5000; // Default to 5 seconds
    }

    set interval(value) {
        this.setAttribute('interval', value);
    }

    get pauseOnHover() {
        return this.hasAttribute('pause-on-hover');
    }

    set pauseOnHover(value) {
        value ? this.setAttribute('pause-on-hover', '') : this.removeAttribute('pause-on-hover');
    }

    get navigation() {
        return this.hasAttribute('navigation');
    }

    set navigation(value) {
        value ? this.setAttribute('navigation', '') : this.removeAttribute('navigation');
    }

    get indicators() {
        return this.hasAttribute('indicators');
    }

    set indicators(value) {
        value ? this.setAttribute('indicators', '') : this.removeAttribute('indicators');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    get buttonClass() {
        return this.getAttribute('button-class') || '';
    }

    set buttonClass(value) {
        value ? this.setAttribute('button-class', value) : this.removeAttribute('button-class');
    }

    get indicatorClass() {
        return this.getAttribute('indicator-class') || '';
    }

    set indicatorClass(value) {
        value ? this.setAttribute('indicator-class', value) : this.removeAttribute('indicator-class');
    }
}

// Carousel Slide Component
class CarouselSlide extends BaseWebComponent {
    render() {
        // If there's no content, add a slot
        if (!this.hasChildNodes()) {
            this.innerHTML = '<slot></slot>';
            return;
        }
    }

    static get observedAttributes() {
        return ['class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom elements
customElements.define('carousel-component', CarouselComponent);
customElements.define('carousel-slide', CarouselSlide);

// Avatar Component for DRY2 Web Components

class AvatarComponent extends BaseWebComponent {
    constructor() {
        super();
        this._imageLoaded = false;
        this._imageError = false;
    }

    render() {
        const size = this.size;
        const shape = this.shape;
        const containerClasses = this.getContainerClasses(size, shape);

        // Create avatar content (image or initials)
        let avatarContent;

        if (this.image && !this._imageError) {
            // Image avatar
            avatarContent = `
                <img 
                    src="${this.image}" 
                    alt="${this.alt || 'Avatar'}" 
                    class="w-full h-full object-cover"
                    ${this._imageLoaded ? '' : 'style="display: none;"'}
                />
                ${!this._imageLoaded ? this.getInitialsAvatar() : ''}
            `;
        } else {
            // Initials avatar
            avatarContent = this.getInitialsAvatar();
        }

        // Create avatar HTML
        const avatarHTML = `
            <div class="${containerClasses}" role="img" aria-label="${this.alt || 'Avatar'}">
                ${avatarContent}
            </div>
        `;

        this.innerHTML = avatarHTML;

        // Setup image load/error handlers if needed
        if (this.image && !this._imageLoaded && !this._imageError) {
            this.setupImageHandlers();
        }
    }

    getContainerClasses(size, shape) {
        let classes = 'avatar-container inline-flex items-center justify-center overflow-hidden ';

        // Add size classes
        switch (size) {
            case 'xs':
                classes += 'h-6 w-6 text-xs ';
                break;
            case 'sm':
                classes += 'h-8 w-8 text-sm ';
                break;
            case 'lg':
                classes += 'h-12 w-12 text-lg ';
                break;
            case 'xl':
                classes += 'h-16 w-16 text-xl ';
                break;
            default:
                // Default to medium size
                classes += 'h-10 w-10 text-base ';
        }

        // Add shape classes
        switch (shape) {
            case 'square':
                classes += 'rounded-none ';
                break;
            case 'rounded':
                classes += 'rounded-md ';
                break;
            default:
                // Default to circle
                classes += 'rounded-full ';
        }

        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }

        return classes.trim();
    }

    getInitialsAvatar() {
        const initials = this.getInitials();
        const backgroundColor = this.getBackgroundColor(initials);

        return `
            <div class="flex items-center justify-center w-full h-full text-white bg-${backgroundColor}">
                ${initials}
            </div>
        `;
    }

    getInitials() {
        // Use provided initials or generate from name
        if (this.initials) {
            return this.initials.substring(0, 2).toUpperCase();
        } else if (this.name) {
            // Generate initials from name (up to 2 characters)
            return this.name
                .split(' ')
                .map(part => part.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
        }

        // Default if no name or initials provided
        return 'U';
    }

    getBackgroundColor(initials) {
        // Generate consistent color based on initials
        const colors = [
            'blue-500', 'green-500', 'red-500', 'yellow-500', 'purple-500',
            'pink-500', 'indigo-500', 'gray-500', 'teal-500', 'orange-500'
        ];

        // Simple hash function to deterministically pick a color
        let hash = 0;
        for (let i = 0; i < initials.length; i++) {
            hash = initials.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }

    setupImageHandlers() {
        const imageElement = this.querySelector('img');
        if (imageElement) {
            imageElement.onload = () => {
                this._imageLoaded = true;
                this._imageError = false;
                this.render();
            };

            imageElement.onerror = () => {
                this._imageLoaded = false;
                this._imageError = true;
                this.render();
            };
        }
    }

    static get observedAttributes() {
        return ['image', 'name', 'initials', 'size', 'shape', 'alt', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'image') {
                this._imageLoaded = false;
                this._imageError = false;
            }

            if (this.isConnected) {
                this.render();
            }
        }
    }

    // Getters and setters for attributes
    get image() {
        return this.getAttribute('image');
    }

    set image(value) {
        value ? this.setAttribute('image', value) : this.removeAttribute('image');
    }

    get name() {
        return this.getAttribute('name');
    }

    set name(value) {
        value ? this.setAttribute('name', value) : this.removeAttribute('name');
    }

    get initials() {
        return this.getAttribute('initials');
    }

    set initials(value) {
        value ? this.setAttribute('initials', value) : this.removeAttribute('initials');
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    set size(value) {
        this.setAttribute('size', value);
    }

    get shape() {
        return this.getAttribute('shape') || 'circle';
    }

    set shape(value) {
        this.setAttribute('shape', value);
    }

    get alt() {
        return this.getAttribute('alt');
    }

    set alt(value) {
        value ? this.setAttribute('alt', value) : this.removeAttribute('alt');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Avatar Group Component
class AvatarGroupComponent extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        // Apply container classes
        const containerClasses = `
            avatar-group inline-flex items-center ${this.class || ''}
        `.trim();

        // Process child avatars or use slot
        if (!this.hasChildNodes() || (this.firstElementChild && this.firstElementChild.tagName === 'SLOT')) {
            this.innerHTML = `
                <div class="${containerClasses}">
                    <slot></slot>
                    ${this.max && this.childAvatarCount > this.max ? this.renderMoreIndicator() : ''}
                </div>
            `;
        } else {
            const avatars = Array.from(this.querySelectorAll('avatar-component'));
            let visibleAvatars = avatars;

            // If max is set, limit the number of visible avatars
            if (this.max && avatars.length > this.max) {
                visibleAvatars = avatars.slice(0, this.max);
            }

            // Create container with positioned avatars
            const avatarElements = visibleAvatars.map((avatar, index) => {
                // Make a clone to avoid modifying the original
                const clone = avatar.cloneNode(true);

                // Add margin styling for overlap
                clone.style.marginLeft = index === 0 ? '0' : `-${this.overlap}px`;
                clone.style.zIndex = visibleAvatars.length - index;

                return clone.outerHTML;
            }).join('');

            this.innerHTML = `
                <div class="${containerClasses}">
                    ${avatarElements}
                    ${this.max && avatars.length > this.max ? this.renderMoreIndicator() : ''}
                </div>
            `;
        }
    }

    renderMoreIndicator() {
        const size = this.size || 'md';
        let dimension;

        // Match size of avatars
        switch (size) {
            case 'xs': dimension = 'h-6 w-6 text-xs'; break;
            case 'sm': dimension = 'h-8 w-8 text-sm'; break;
            case 'lg': dimension = 'h-12 w-12 text-lg'; break;
            case 'xl': dimension = 'h-16 w-16 text-xl'; break;
            default: dimension = 'h-10 w-10 text-base';
        }

        const count = this.childAvatarCount - this.max;

        return `
            <div class="avatar-more-indicator ${dimension} rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 ml-[-${this.overlap}px]" title="${count} more">
                +${count}
            </div>
        `;
    }

    get childAvatarCount() {
        return this.querySelectorAll('avatar-component').length;
    }

    connectedCallback() {
        super.connectedCallback();
        this.setupMutationObserver();
    }

    disconnectedCallback() {
        this.disconnectMutationObserver();
    }

    setupMutationObserver() {
        // Watch for changes to child avatars
        this.observer = new MutationObserver(() => {
            this.render();
        });

        this.observer.observe(this, { childList: true, subtree: true });
    }

    disconnectMutationObserver() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    static get observedAttributes() {
        return ['max', 'overlap', 'size', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get max() {
        const maxValue = this.getAttribute('max');
        return maxValue ? parseInt(maxValue, 10) : null;
    }

    set max(value) {
        value ? this.setAttribute('max', value) : this.removeAttribute('max');
    }

    get overlap() {
        return this.getAttribute('overlap') || '8';
    }

    set overlap(value) {
        this.setAttribute('overlap', value);
    }

    get size() {
        return this.getAttribute('size') || 'md';
    }

    set size(value) {
        this.setAttribute('size', value);
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }
}

// Define the custom elements
customElements.define('avatar-component', AvatarComponent);
customElements.define('avatar-group', AvatarGroupComponent);