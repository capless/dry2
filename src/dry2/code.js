class DryCode extends BaseElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['language', 'show-copy', 'show-header'];
  }

  _initializeComponent() {
    // Extract code content from the element's original content
    const codeContent = this._extractContent();
    
    this._componentData = {
      code: codeContent,
      language: this.language,
      showCopy: this.showCopy,
      showHeader: this.showHeader
    };

    this._render();
    this._attachEventListeners();
  }

  _extractContent() {
    // Get the original innerHTML and decode HTML entities properly
    const innerHTML = this.innerHTML.trim();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = innerHTML;
    return tempDiv.textContent.trim();
  }

  _render() {
    const headerHtml = this.showHeader ? `
      <div class="code-header">
        <span class="code-language">${this.language}</span>
        ${this.showCopy ? `
          <button class="copy-button" data-copy-btn>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
            <span data-copy-text>Copy</span>
          </button>
        ` : ''}
      </div>
    ` : '';

    this.innerHTML = `
      <div class="code-block">
        ${headerHtml}
                 <div class="code-content">
           <pre><code>${this._highlightCode(this._componentData.code, this.language)}</code></pre>
          ${!this.showHeader && this.showCopy ? `
            <button class="copy-button absolute top-2 right-2" data-copy-btn>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
              <span data-copy-text>Copy</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _highlightCode(code, language) {
    const escaped = this._escapeHtml(code);
    const lang = language.toLowerCase();
    
    if (lang === 'html' || lang === 'xml') {
      return this._highlightHTML(escaped);
    } else if (lang === 'javascript' || lang === 'js') {
      return this._highlightJavaScript(escaped);
    } else if (lang === 'css') {
      return this._highlightCSS(escaped);
    } else if (lang === 'json') {
      return this._highlightJSON(escaped);
    } else if (lang === 'python' || lang === 'py') {
      return this._highlightPython(escaped);
    } else if (lang === 'bash' || lang === 'shell' || lang === 'sh') {
      return this._highlightBash(escaped);
    } else if (lang === 'sql') {
      return this._highlightSQL(escaped);
    } else {
      return escaped;
    }
  }

  _highlightHTML(text) {
    // Token-based HTML highlighting inspired by Prism.js approach
    // Process text sequentially without overlapping matches
    
    let result = '';
    let index = 0;
    const tokens = [];
    
    // First pass: find all tokens (tags, attributes, strings)
    const patterns = [
      { name: 'tag', regex: /&lt;\/?\w+/g, color: '#e06c75' },
      { name: 'bracket', regex: /&gt;/g, color: '#e06c75' },
      { name: 'attr-name', regex: /\s+\w+(?==)/g, color: '#d19a66' },
      { name: 'attr-equals', regex: /=/g, color: '#56b6c2' },
      { name: 'attr-value', regex: /"[^"]*"/g, color: '#98c379' }
    ];
    
    // Find all matches and sort by position
    patterns.forEach(pattern => {
      let match;
      pattern.regex.lastIndex = 0; // Reset regex
      while ((match = pattern.regex.exec(text)) !== null) {
        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          name: pattern.name,
          color: pattern.color
        });
      }
    });
    
    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);
    
    // Build result, avoiding overlaps
    let lastEnd = 0;
    tokens.forEach(token => {
      if (token.start >= lastEnd) {
        // Add any text before this token
        if (token.start > lastEnd) {
          result += text.slice(lastEnd, token.start);
        }
        // Add the highlighted token
        result += `<span style="color: ${token.color};">${token.text}</span>`;
        lastEnd = token.end;
      }
    });
    
    // Add any remaining text
    if (lastEnd < text.length) {
      result += text.slice(lastEnd);
    }
    
    return result;
  }

  _highlightJavaScript(text) {
    return this._highlightWithTokens(text, [
      { name: 'comment', regex: /\/\/.*$/gm, color: '#5c6370' },
      { name: 'string', regex: /(".*?"|'.*?'|`.*?`)/g, color: '#98c379' },
      { name: 'keyword', regex: /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|try|catch|finally|throw|new|this|super|async|await|yield)\b/g, color: '#c678dd' },
      { name: 'boolean', regex: /\b(true|false|null|undefined)\b/g, color: '#d19a66' },
      { name: 'number', regex: /\b\d+(\.\d+)?\b/g, color: '#d19a66' }
    ]);
  }

  _highlightCSS(text) {
    return this._highlightWithTokens(text, [
      { name: 'comment', regex: /\/\*.*?\*\//g, color: '#5c6370' },
      { name: 'selector', regex: /([.#]?[\w-]+)(?=\s*{)/g, color: '#e06c75' },
      { name: 'property', regex: /([\w-]+)(?=\s*:)/g, color: '#d19a66' },
      { name: 'value', regex: /:\s*([^;]+)/g, color: '#98c379' },
      { name: 'punctuation', regex: /[{}:;]/g, color: '#56b6c2' }
    ]);
  }

  _highlightJSON(text) {
    return this._highlightWithTokens(text, [
      { name: 'key', regex: /"[\w]+"/g, color: '#e06c75' },
      { name: 'string', regex: /:\s*(".*?")/g, color: '#98c379' },
      { name: 'number', regex: /:\s*(\d+(\.\d+)?)/g, color: '#d19a66' },
      { name: 'boolean', regex: /:\s*(true|false|null)/g, color: '#d19a66' },
      { name: 'punctuation', regex: /[{}[\]:,]/g, color: '#56b6c2' }
    ]);
  }

  _highlightPython(text) {
    return this._highlightWithTokens(text, [
      { name: 'comment', regex: /#.*$/gm, color: '#5c6370' },
      { name: 'string', regex: /(".*?"|'.*?'|"""[\s\S]*?"""|'''[\s\S]*?''')/g, color: '#98c379' },
      { name: 'keyword', regex: /\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|lambda|yield|async|await|pass|break|continue|global|nonlocal)\b/g, color: '#c678dd' },
      { name: 'builtin', regex: /\b(print|len|range|enumerate|zip|map|filter|sum|max|min|abs|round|isinstance|type|str|int|float|bool|list|dict|tuple|set)\b/g, color: '#e06c75' },
      { name: 'boolean', regex: /\b(True|False|None)\b/g, color: '#d19a66' },
      { name: 'number', regex: /\b\d+(\.\d+)?\b/g, color: '#d19a66' }
    ]);
  }

  _highlightBash(text) {
    return this._highlightWithTokens(text, [
      { name: 'comment', regex: /#.*$/gm, color: '#5c6370' },
      { name: 'string', regex: /(".*?"|'.*?')/g, color: '#98c379' },
      { name: 'command', regex: /\b(ls|cd|mkdir|rm|cp|mv|chmod|chown|grep|find|sed|awk|sort|uniq|head|tail|cat|less|more|nano|vim|git|npm|yarn|docker|sudo|su)\b/g, color: '#e06c75' },
      { name: 'flag', regex: /-{1,2}[\w-]+/g, color: '#d19a66' },
      { name: 'variable', regex: /\$[\w]+/g, color: '#c678dd' },
      { name: 'operator', regex: /[|&><]/g, color: '#56b6c2' }
    ]);
  }

  _highlightSQL(text) {
    return this._highlightWithTokens(text, [
      { name: 'comment', regex: /--.*$/gm, color: '#5c6370' },
      { name: 'string', regex: /('.*?')/g, color: '#98c379' },
      { name: 'keyword', regex: /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|DATABASE|SCHEMA)\b/gi, color: '#c678dd' },
      { name: 'function', regex: /\b(COUNT|SUM|AVG|MAX|MIN|UPPER|LOWER|SUBSTRING|CONCAT|COALESCE|CASE|WHEN|THEN|ELSE|END)\b/gi, color: '#e06c75' },
      { name: 'number', regex: /\b\d+(\.\d+)?\b/g, color: '#d19a66' },
      { name: 'operator', regex: /[=<>!]+|AND|OR|NOT|IN|LIKE|BETWEEN/gi, color: '#56b6c2' }
    ]);
  }

  _highlightWithTokens(text, patterns) {
    let result = '';
    let index = 0;
    const tokens = [];
    
    // Find all matches and sort by position
    patterns.forEach(pattern => {
      let match;
      pattern.regex.lastIndex = 0; // Reset regex
      while ((match = pattern.regex.exec(text)) !== null) {
        tokens.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          name: pattern.name,
          color: pattern.color
        });
      }
    });
    
    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);
    
    // Build result, avoiding overlaps
    let lastEnd = 0;
    tokens.forEach(token => {
      if (token.start >= lastEnd) {
        // Add any text before this token
        if (token.start > lastEnd) {
          result += text.slice(lastEnd, token.start);
        }
        // Add the highlighted token
        result += `<span style="color: ${token.color};">${token.text}</span>`;
        lastEnd = token.end;
      }
    });
    
    // Add any remaining text
    if (lastEnd < text.length) {
      result += text.slice(lastEnd);
    }
    
    return result;
  }

  _attachEventListeners() {
    const copyBtn = this.querySelector('[data-copy-btn]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this._copyToClipboard());
    }
  }

  async _copyToClipboard() {
    const copyBtn = this.querySelector('[data-copy-btn]');
    const copyText = this.querySelector('[data-copy-text]');
    
    if (!copyBtn || !copyText) return;

    try {
      await navigator.clipboard.writeText(this._componentData.code);
      this._showSuccessState(copyBtn, copyText);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      this._fallbackCopy(copyBtn, copyText);
    }
  }

  _fallbackCopy(copyBtn, copyText) {
    // Fallback for older browsers - can be removed if not supporting legacy browsers
    const textArea = document.createElement('textarea');
    textArea.value = this._componentData.code;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      // @ts-ignore - deprecated but needed for older browser support
      document.execCommand('copy');
      this._showSuccessState(copyBtn, copyText);
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  _showSuccessState(copyBtn, copyText) {
    const originalText = copyText.textContent;
    copyText.textContent = 'Copied!';
    copyBtn.disabled = true;
    
    setTimeout(() => {
      copyText.textContent = originalText;
      copyBtn.disabled = false;
    }, 2000);
  }

  // Public API methods
  copy() {
    this._copyToClipboard();
  }

  setCode(code) {
    this._componentData.code = code;
    this._render();
    this._attachEventListeners();
  }

  // Getters and setters
  get language() {
    return this._getAttributeWithDefault('language', 'HTML');
  }

  set language(value) {
    this._setAttribute('language', value);
  }

  get showCopy() {
    return !this.hasAttribute('show-copy') || this.getAttribute('show-copy') !== 'false';
  }

  set showCopy(value) {
    this._setBooleanAttribute('show-copy', value);
  }

  get showHeader() {
    return !this.hasAttribute('show-header') || this.getAttribute('show-header') !== 'false';
  }

  set showHeader(value) {
    this._setBooleanAttribute('show-header', value);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this._isInitialized) {
      this._handleAttributeChange(name, oldValue, newValue);
      this._render();
      this._attachEventListeners();
    }
  }
}

// Register the component
customElements.define('dry-code', DryCode); 