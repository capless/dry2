// swap-component.test.js
describe('Swap Component', () => {
  let sandbox;
  let fixtures;

  before(() => {
    // Create a sandbox element to attach components to
    sandbox = document.createElement('div');
    sandbox.id = 'sandbox';
    document.body.appendChild(sandbox);

    // Load fixtures
    fixtures = {
      basicSwap: `
                <swap-component 
                  id="test-swap" 
                  icon-on='<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>'
                  icon-off='<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" /></svg>'>
                </swap-component>
            `,
      activeSwap: `
                <swap-component 
                  id="active-swap" 
                  active>
                </swap-component>
            `,
      disabledSwap: `
                <swap-component 
                  id="disabled-swap" 
                  disabled>
                </swap-component>
            `,
      sizedSwap: `
                <swap-component 
                  id="large-swap" 
                  size="large">
                </swap-component>
            `
    };
  });

  after(() => {
    // Clean up
    document.body.removeChild(sandbox);
  });

  beforeEach(function() {
    // Setup sinon sandbox for isolating stub/spy behavior
    this.sinon = sinon.createSandbox();
  });

  afterEach(function() {
    // Reset the sandbox element and restore sinon sandboxes
    sandbox.innerHTML = '';
    this.sinon.restore();
  });

  /**
     * SwapComponent Tests
     */
  describe('SwapComponent', () => {
    it('should render with correct attributes', () => {
      sandbox.innerHTML = fixtures.basicSwap;
      const swap = document.getElementById('test-swap');
      const container = swap.querySelector('div[role="button"]');

      // Assert component has rendered
      assert.exists(swap, 'Component was rendered');
      assert.exists(container, 'Container element was rendered');

      // Check that both icons are rendered
      const iconOff = swap.querySelector('.swap-icon:not(.hidden)');
      const iconOn = swap.querySelector('.swap-icon.hidden');

      assert.exists(iconOff, 'Off icon is rendered and visible');
      assert.exists(iconOn, 'On icon is rendered but hidden');

      // Check that SVG content is present
      assert.include(iconOff.innerHTML, 'svg', 'SVG is included in off icon');
      assert.include(iconOn.innerHTML, 'svg', 'SVG is included in on icon');
    });

    it('should render in active state correctly', () => {
      sandbox.innerHTML = fixtures.activeSwap;
      const swap = document.getElementById('active-swap');

      // Check that active state shows the correct icon
      const iconOff = swap.querySelector('.swap-icon.hidden');
      const iconOn = swap.querySelector('.swap-icon:not(.hidden)');

      assert.exists(iconOff, 'Off icon is hidden');
      assert.exists(iconOn, 'On icon is visible');
    });

    it('should handle disabled state correctly', () => {
      sandbox.innerHTML = fixtures.disabledSwap;
      const swap = document.getElementById('disabled-swap');
      const container = swap.querySelector('div[role="button"]');

      // Assert disabled state is applied
      assert.include(container.className, 'cursor-not-allowed', 'Disabled cursor style is applied');
      assert.equal(container.getAttribute('tabindex'), '-1', 'Tabindex is -1 when disabled');
    });

    it('should handle size attribute correctly', () => {
      sandbox.innerHTML = fixtures.sizedSwap;
      const swap = document.getElementById('large-swap');
      const container = swap.querySelector('div[role="button"]');

      // Assert size class is applied
      assert.include(container.className, 'h-8 w-8', 'Large size class is applied');
    });

    it('should toggle state when clicked', () => {
      sandbox.innerHTML = fixtures.basicSwap;
      const swap = document.getElementById('test-swap');
      const container = swap.querySelector('div[role="button"]');

      // Check initial state (inactive)
      let iconOff = swap.querySelector('.swap-icon:not(.hidden)');
      let iconOn = swap.querySelector('.swap-icon.hidden');

      assert.exists(iconOff, 'Initially off icon is visible');
      assert.exists(iconOn, 'Initially on icon is hidden');

      // Click to toggle
      container.click();

      // Get updated elements
      iconOff = swap.querySelector('.swap-icon.hidden');
      iconOn = swap.querySelector('.swap-icon:not(.hidden)');

      // Check new state (active)
      assert.exists(iconOff, 'After click off icon is hidden');
      assert.exists(iconOn, 'After click on icon is visible');
    });

    it('should not toggle when disabled', function() {
      sandbox.innerHTML = fixtures.disabledSwap;
      const swap = document.getElementById('disabled-swap');
      const container = swap.querySelector('div[role="button"]');

      // Setup spy for toggle method
      const toggleSpy = this.sinon.spy(swap, 'toggle');

      // Click the disabled swap
      container.click();

      // Assert toggle was not called
      assert.isFalse(toggleSpy.called, 'Toggle not called for disabled swap');
    });

    it('should dispatch custom event when toggled', () => {
      sandbox.innerHTML = fixtures.basicSwap;
      const swap = document.getElementById('test-swap');
      const container = swap.querySelector('div[role="button"]');

      // Setup event listener for custom event
      let customEventFired = false;
      let eventDetail = null;

      swap.addEventListener('swap:change', (e) => {
        customEventFired = true;
        eventDetail = e.detail;
      });

      // Toggle the swap
      container.click();

      // Assert custom event was fired
      assert.isTrue(customEventFired, 'Custom change event was fired');
      assert.isTrue(eventDetail.active, 'Active state is true in event detail');
    });

    it('should handle keyboard navigation', function() {
      sandbox.innerHTML = fixtures.basicSwap;
      const swap = document.getElementById('test-swap');
      const container = swap.querySelector('div[role="button"]');

      // Setup spy for toggle method
      const toggleSpy = this.sinon.spy(swap, 'toggle');

      // Simulate space key press
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      container.dispatchEvent(spaceEvent);

      assert.isTrue(toggleSpy.calledOnce, 'Toggle called on space key');
      toggleSpy.resetHistory();

      // Simulate enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(enterEvent);

      assert.isTrue(toggleSpy.calledOnce, 'Toggle called on enter key');
    });

    it('should update when attributes change', () => {
      sandbox.innerHTML = fixtures.basicSwap;
      const swap = document.getElementById('test-swap');

      // Change to active
      swap.setAttribute('active', '');

      // Get updated elements
      const iconOff = swap.querySelector('.swap-icon.hidden');
      const iconOn = swap.querySelector('.swap-icon:not(.hidden)');

      // Check active state
      assert.exists(iconOff, 'Off icon is hidden after attribute change');
      assert.exists(iconOn, 'On icon is visible after attribute change');

      // Change to disabled
      swap.setAttribute('disabled', '');
      const container = swap.querySelector('div[role="button"]');

      // Check disabled state
      assert.include(container.className, 'cursor-not-allowed', 'Disabled style applied after attribute change');
    });
  });
});
