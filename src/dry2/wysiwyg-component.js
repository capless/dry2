class WYSIWYGEditor extends BaseWebComponent {
    constructor() {
        super();
        this.actions = [
            {command: 'bold', icon: this.boldIcon()},
            {command: 'italic', icon: this.italicIcon()},
            {command: 'underline', icon: this.underlineIcon()},
            {command: 'insertUnorderedList', icon: this.ulIcon()},
            {command: 'insertOrderedList', icon: this.olIcon()},
            {command: 'createLink', icon: this.linkIcon()},
            {command: 'toggleCode', icon: this.codeIcon()},
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