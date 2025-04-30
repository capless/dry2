// Chat Bubble Component for DRY2 Web Components

class ChatBubbleComponent extends BaseWebComponent {
    constructor() {
        super();
    }

    render() {
        const type = this.type;
        const timestamp = this.timestamp;
        const status = this.status;
        const sender = this.sender;
        const grouped = this.grouped;
        
        // Determine bubble classes based on type and grouping
        const bubbleClasses = this.getBubbleClasses(type, grouped);
        
        // Create the timestamp display if provided
        const timestampDisplay = timestamp ? this.formatTimestamp(timestamp) : '';
        
        // Create status indicator for sent messages
        const statusIndicator = type === 'sent' && status ? this.createStatusIndicator(status) : '';
        
        // Create sender name for received messages with sender
        const senderDisplay = type === 'received' && sender && !grouped ? 
            `<div class="chat-sender text-xs text-gray-500 mb-1">${sender}</div>` : '';
        
        // Create the chat bubble HTML
        const chatBubbleHTML = `
            <div class="chat-bubble ${bubbleClasses}">
                ${senderDisplay}
                <div class="chat-content relative p-3 rounded-lg">
                    <slot></slot>
                </div>
                <div class="chat-metadata flex items-center text-xs ${type === 'sent' ? 'justify-end' : 'justify-start'}">
                    ${timestampDisplay}
                    ${statusIndicator}
                </div>
            </div>
        `;
        
        this.innerHTML = chatBubbleHTML;
    }

    getBubbleClasses(type, grouped) {
        let classes = 'max-w-[80%] mb-2 ';
        
        // Add type-specific classes
        if (type === 'sent') {
            classes += 'ml-auto '; // Float right for sent messages
            classes += this.sentClass || 'bg-blue-100 text-blue-900 ';
        } else {
            // Default to received
            classes += 'mr-auto '; // Float left for received messages
            classes += this.receivedClass || 'bg-gray-100 text-gray-900 ';
        }
        
        // Add grouped message classes if needed
        if (grouped) {
            classes += 'mt-0.5 '; // Reduced margin when grouped
        }
        
        // Add custom classes
        if (this.class) {
            classes += this.class + ' ';
        }
        
        return classes.trim();
    }

    formatTimestamp(timestamp) {
        let formattedTime = '';
        
        try {
            const date = new Date(timestamp);
            
            // Check if it's a valid date
            if (!isNaN(date.getTime())) {
                // Format time as H:MM (12-hour format with AM/PM)
                formattedTime = date.toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                });
            } else {
                // If not a valid date object, use the provided string
                formattedTime = timestamp;
            }
        } catch (e) {
            // If any error occurs, fallback to the provided string
            formattedTime = timestamp;
        }
        
        return `<span class="chat-time text-gray-500">${formattedTime}</span>`;
    }

    createStatusIndicator(status) {
        let indicator = '';
        
        switch (status) {
            case 'sent':
                indicator = `
                    <span class="chat-status ml-1 text-gray-400" title="Sent">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                `;
                break;
            case 'delivered':
                indicator = `
                    <span class="chat-status ml-1 text-gray-400" title="Delivered">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7M5 13l4 4L19 7" />
                        </svg>
                    </span>
                `;
                break;
            case 'read':
                indicator = `
                    <span class="chat-status ml-1 text-blue-500" title="Read">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7M5 13l4 4L19 7" />
                        </svg>
                    </span>
                `;
                break;
            default:
                // No indicator for unknown status
                break;
        }
        
        return indicator;
    }

    static get observedAttributes() {
        return [
            'type', 'timestamp', 'status', 'sender', 'grouped',
            'class', 'sent-class', 'received-class'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
        }
    }

    // Getters and setters for attributes
    get type() {
        return this.getAttribute('type') || 'received';
    }

    set type(value) {
        this.setAttribute('type', value);
    }

    get timestamp() {
        return this.getAttribute('timestamp');
    }

    set timestamp(value) {
        value ? this.setAttribute('timestamp', value) : this.removeAttribute('timestamp');
    }

    get status() {
        return this.getAttribute('status');
    }

    set status(value) {
        value ? this.setAttribute('status', value) : this.removeAttribute('status');
    }

    get sender() {
        return this.getAttribute('sender');
    }

    set sender(value) {
        value ? this.setAttribute('sender', value) : this.removeAttribute('sender');
    }

    get grouped() {
        return this.hasAttribute('grouped');
    }

    set grouped(value) {
        value ? this.setAttribute('grouped', '') : this.removeAttribute('grouped');
    }

    get class() {
        return this.getAttribute('class') || '';
    }

    set class(value) {
        value ? this.setAttribute('class', value) : this.removeAttribute('class');
    }

    get sentClass() {
        return this.getAttribute('sent-class');
    }

    set sentClass(value) {
        value ? this.setAttribute('sent-class', value) : this.removeAttribute('sent-class');
    }

    get receivedClass() {
        return this.getAttribute('received-class');
    }

    set receivedClass(value) {
        value ? this.setAttribute('received-class', value) : this.removeAttribute('received-class');
    }
}

// Define the custom element
customElements.define('chat-bubble', ChatBubbleComponent);