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
            detail: {toast: this}
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
                    detail: {toast: this}
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
        return Toast.showToast(message, {...options, type: 'success'});
    }

    static error(message, options = {}) {
        return Toast.showToast(message, {...options, type: 'error'});
    }

    static warning(message, options = {}) {
        return Toast.showToast(message, {...options, type: 'warning'});
    }

    static info(message, options = {}) {
        return Toast.showToast(message, {...options, type: 'info'});
    }
}

customElements.define('dry-toast', Toast);