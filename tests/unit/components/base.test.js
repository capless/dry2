import '../setup.js';

describe('Core Infrastructure', () => {
  beforeEach(() => {
    cleanupDOM();
  });

  afterEach(() => {
    cleanupDOM();
  });
  let BaseWebComponent;

  before(async() => {
    // Import the core infrastructure
    await import('../../../src/dry2/dry2.js');
    BaseWebComponent = global.BaseWebComponent;
  });

  describe('Core Functionality', () => {
    let TestComponent;

    beforeEach(() => {
      // Create a test component class
      TestComponent = class extends BaseWebComponent {
        static get observedAttributes() {
          return ['test-attr'];
        }

        render() {
          return `<div class="test-content">${this.getAttribute('test-attr') || 'default'}</div>`;
        }
      };

      customElements.define(`test-component-${Date.now()}`, TestComponent);
    });

    it('should create component with reactive state', () => {
      const element = new TestComponent();
      expect(element.state).to.be.an('object');
    });

    it('should schedule renders when state changes', (done) => {
      const element = new TestComponent();
      document.body.appendChild(element);

      element.setState({ test: 'value' });

      setTimeout(() => {
        expect(element.state.test).to.equal('value');
        done();
      }, 50);
    });

    it('should handle attribute changes', (done) => {
      const element = new TestComponent();
      document.body.appendChild(element);

      element.setAttribute('test-attr', 'new-value');

      setTimeout(() => {
        expect(element.innerHTML).to.include('new-value');
        done();
      }, 50);
    });

    it('should provide slot functionality', () => {
      const element = new TestComponent();
      element.innerHTML = '<span slot="test">slot content</span>';
      element._parseSlots();

      expect(element.renderSlot('test')).to.include('slot content');
    });

    it('should emit custom events', (done) => {
      const element = new TestComponent();

      element.addEventListener('test-event', (event) => {
        expect(event.detail.data).to.equal('test');
        expect(event.detail.component).to.equal(element);
        done();
      });

      element.emit('test-event', { data: 'test' });
    });

    it('should handle boolean attributes correctly', () => {
      const element = new TestComponent();

      expect(element.getBooleanAttribute('missing')).to.be.false;
      expect(element.getBooleanAttribute('missing', true)).to.be.true;

      element.setAttribute('present', '');
      expect(element.getBooleanAttribute('present')).to.be.true;

      element.setAttribute('false-attr', 'false');
      expect(element.getBooleanAttribute('false-attr')).to.be.false;
    });

    it('should handle numeric attributes correctly', () => {
      const element = new TestComponent();

      expect(element.getNumericAttribute('missing')).to.equal(0);
      expect(element.getNumericAttribute('missing', 10)).to.equal(10);

      element.setAttribute('number', '42');
      expect(element.getNumericAttribute('number')).to.equal(42);

      element.setAttribute('invalid', 'not-a-number');
      expect(element.getNumericAttribute('invalid', 5)).to.equal(5);
    });

    it('should provide DOM helper methods', () => {
      const element = new TestComponent();
      element.innerHTML = '<div class="test"></div><span class="test"></span>';

      expect(element.$('.test')).to.be.an('object');
      expect(element.$$('.test')).to.have.length(2);
    });

    it('should escape HTML properly', () => {
      const element = new TestComponent();
      const unsafe = '<script>alert("xss")</script>';
      const escaped = element.escapeHtml(unsafe);

      expect(escaped).to.not.include('<script>');
      expect(escaped).to.include('&lt;script&gt;');
    });
  });

  describe('Error Handling', () => {
    let TestComponent;

    beforeEach(() => {
      TestComponent = class extends BaseWebComponent {
        render() {
          if (this.getAttribute('should-error')) {
            throw new Error('Test error');
          }
          return '<div>success</div>';
        }
      };

      customElements.define(`test-error-component-${Date.now()}`, TestComponent);
    });

    it('should handle render errors gracefully', (done) => {
      const element = new TestComponent();
      document.body.appendChild(element);

      element.addEventListener('component:error', (event) => {
        expect(event.detail.context).to.equal('Render error');
        expect(event.detail.error.message).to.equal('Test error');
        done();
      });

      element.setAttribute('should-error', 'true');
    });
  });

  describe('Static Utilities', () => {
    it('should provide static HTML escape function', () => {
      const unsafe = '<script>alert("xss")</script>';
      const escaped = BaseWebComponent.escapeHtml(unsafe);

      expect(escaped).to.not.include('<script>');
      expect(escaped).to.include('&lt;script&gt;');
    });
  });
});
