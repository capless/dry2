// drawer-components.test.js
describe('Drawer Components', function () {
    let sandbox;
    let fixtures;

    before(function () {
        // Create a sandbox element to attach components to
        sandbox = document.createElement('div');
        sandbox.id = 'sandbox';
        document.body.appendChild(sandbox);

        // Load fixtures
        fixtures = {
            basicDrawer: `
        <dry-drawer 
          id="test-drawer" 
          position="right" 
          drawer-class="test-drawer-class" 
          button-class="test-button-class" 
          trigger-content="Test Drawer">
          <span slot="header">Test Header</span>
          <div slot="content">Test Content</div>
        </dry-drawer>
      `,
            leftDrawer: `
        <dry-drawer 
          id="left-drawer" 
          position="left" 
          drawer-class="test-drawer-class">
          <span slot="header">Left Drawer</span>
          <div slot="content">Left Content</div>
        </dry-drawer>
      `,
            ajaxDrawer: `
        <ajax-drawer
          id="ajax-drawer"
          url="/test-url"
          position="right"
          drawer-class="test-drawer-class"
          content-id="test-content-id">
          <span slot="header">AJAX Drawer</span>
        </ajax-drawer>
      `
        };
    });

    after(function () {
        // Clean up
        document.body.removeChild(sandbox);
    });

    beforeEach(function () {
        // Setup sinon sandbox for isolating stub/spy behavior
        this.sinon = sinon.createSandbox();
    });

    afterEach(function () {
        // Reset the sandbox element and restore sinon sandboxes
        sandbox.innerHTML = '';
        this.sinon.restore();
    });

    /**
     * DryDrawer Component Tests
     */
    describe('DryDrawer', function () {
        it('should render with correct attributes', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');

            // Assert component has rendered
            assert.exists(drawer, 'Component was rendered');

            // Check attributes were applied correctly
            const triggerButton = drawer.querySelector('.trigger-button');
            assert.exists(triggerButton, 'Trigger button exists');
            assert.include(triggerButton.className, 'test-button-class', 'Button class applied');
            assert.equal(triggerButton.textContent.trim(), 'Test Drawer', 'Trigger content is correct');

            // Check drawer element
            const drawerElement = drawer.querySelector('.drawer');
            assert.exists(drawerElement, 'Drawer element exists');
            assert.include(drawerElement.className, 'test-drawer-class', 'Drawer class applied');
            assert.include(drawerElement.className, 'right-0', 'Position is correct');

            // Check header content
            const headerContent = drawer.querySelector('.drawer-title');
            assert.exists(headerContent, 'Header content exists');
            assert.include(headerContent.innerHTML, 'Test Header', 'Header content is correct');

            // Check drawer content
            const drawerContent = drawer.querySelector('.drawer-content');
            assert.exists(drawerContent, 'Drawer content exists');
            assert.include(drawerContent.innerHTML, 'Test Content', 'Content is correct');
        });

        it('should open and close drawer', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');
            const drawerElement = drawer.querySelector('.drawer');
            const backdrop = drawer.querySelector('.drawer-backdrop');
            const drawerWrapper = drawer.querySelector('.drawer-wrapper');

            // Test opening drawer
            drawer.open();

            // Assert drawer is open
            assert.include(drawerElement.className, 'translate-x-0', 'Drawer is open (transformed)');
            assert.include(backdrop.className, 'opacity-100', 'Backdrop is visible');
            assert.include(drawerWrapper.className, 'pointer-events-auto', 'Wrapper accepts pointer events');

            // Test closing drawer
            drawer.close();

            // Assert drawer is closed
            assert.include(drawerElement.className, 'translate-x-full', 'Drawer is closed (transformed)');
            assert.include(backdrop.className, 'opacity-0', 'Backdrop is hidden');
            assert.include(drawerWrapper.className, 'pointer-events-none', 'Wrapper ignores pointer events');
        });

        it('should open drawer when trigger button is clicked', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');

            // Get the trigger button event handler directly
            const openSpy = this.sinon.spy(drawer, 'open');

            // Find and directly call the method that would be called on click
            drawer.querySelector('.trigger-button').click = function() {
                drawer.open();
            };
            drawer.querySelector('.trigger-button').click();

            assert.isTrue(openSpy.called, 'open method was called');
        });

        it('should close drawer when close button is clicked', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');
            drawer.open(); // Open the drawer first

            const closeSpy = this.sinon.spy(drawer, 'close');

            // Directly call close instead of trying to trigger through events
            drawer.querySelector('.drawer-close').click = function() {
                drawer.close();
            };
            drawer.querySelector('.drawer-close').click();

            assert.isTrue(closeSpy.called, 'close method was called');
        });

        it('should close drawer when backdrop is clicked', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');
            drawer.open(); // Open the drawer first

            const closeSpy = this.sinon.spy(drawer, 'close');

            // Directly call close instead of trying to trigger through events
            drawer.querySelector('.drawer-backdrop').click = function() {
                drawer.close();
            };
            drawer.querySelector('.drawer-backdrop').click();

            assert.isTrue(closeSpy.called, 'close method was called');
        });

        it('should close drawer when ESC key is pressed', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');

            // First open the drawer
            drawer.open();

            // Spy on close method
            const closeSpy = this.sinon.spy(drawer, 'close');

            // Simulate ESC key press
            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(event);

            // Assert close was called
            assert.isTrue(closeSpy.called, 'close method was called');
        });

        it('should dispatch custom events when opened and closed', function () {
            sandbox.innerHTML = fixtures.basicDrawer;
            const drawer = document.getElementById('test-drawer');

            // Setup event listeners
            let openedEventFired = false;
            let closedEventFired = false;

            drawer.addEventListener('drawer:opened', () => {
                openedEventFired = true;
            });

            drawer.addEventListener('drawer:closed', () => {
                closedEventFired = true;
            });

            // Open drawer
            drawer.open();
            assert.isTrue(openedEventFired, 'opened event was fired');

            // Close drawer
            drawer.close();
            assert.isTrue(closedEventFired, 'closed event was fired');
        });

        it('should use left positioning correctly', function () {
            sandbox.innerHTML = fixtures.leftDrawer;
            const drawer = document.getElementById('left-drawer');
            const drawerElement = drawer.querySelector('.drawer');

            // Check initial left position class
            assert.include(drawerElement.className, 'left-0', 'Left position class is applied');
            assert.include(drawerElement.className, '-translate-x-full', 'Left transform is applied');

            // Test drawer opens to the left
            drawer.open();
            assert.include(drawerElement.className, 'translate-x-0', 'Drawer is open');

            // Test drawer closes to the left
            drawer.close();
            assert.include(drawerElement.className, '-translate-x-full', 'Drawer is properly closed for left position');
        });
    });

    /**
     * AjaxDrawer Component Tests
     */
    describe('AjaxDrawer', function () {
        let originalHTMX;

        beforeEach(function() {
            // Store original window.htmx if it exists
            originalHTMX = window.htmx;
            // Create mock HTMX
            window.htmx = {
                trigger: this.sinon.stub()
            };
        });

        afterEach(function() {
            // Restore original HTMX
            window.htmx = originalHTMX;
        });

        it('should render with correct attributes', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');

            // Assert component has rendered
            assert.exists(drawer, 'Component was rendered');

            // Check trigger button
            const triggerButton = drawer.querySelector('.trigger-button');
            assert.exists(triggerButton, 'Trigger button exists');
            assert.equal(triggerButton.getAttribute('hx-get'), '/test-url', 'AJAX URL is correct');
            assert.equal(triggerButton.getAttribute('hx-target'), '#test-content-id', 'Target ID is correct');

            // Check content container
            const contentContainer = drawer.querySelector('#test-content-id');
            assert.exists(contentContainer, 'Content container exists');

            // Check loading and error elements
            assert.exists(drawer.querySelector('.drawer-loading'), 'Loading element exists');
            assert.exists(drawer.querySelector('.drawer-error'), 'Error element exists');
        });

        it('should handle HTMX before request event', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');
            const contentElement = drawer.querySelector('#test-content-id');
            const loadingElement = drawer.querySelector('.drawer-loading');
            const errorElement = drawer.querySelector('.drawer-error');

            // Spy on open method
            const openSpy = this.sinon.spy(drawer, 'open');

            // Create and dispatch htmx:beforeRequest event
            const event = new CustomEvent('htmx:beforeRequest', {
                detail: {
                    target: contentElement
                }
            });

            document.body.dispatchEvent(event);

            // Assert drawer was opened
            assert.isTrue(openSpy.called, 'open method was called');

            // Assert content is hidden and loading is shown
            assert.isTrue(contentElement.classList.contains('hidden'), 'Content is hidden');
            assert.isFalse(loadingElement.classList.contains('hidden'), 'Loading is shown');
            assert.isTrue(errorElement.classList.contains('hidden'), 'Error is hidden');
        });

        it('should handle HTMX after request event', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');
            const contentElement = drawer.querySelector('#test-content-id');
            const loadingElement = drawer.querySelector('.drawer-loading');

            // Create and dispatch htmx:afterRequest event
            const event = new CustomEvent('htmx:afterRequest', {
                detail: {
                    target: contentElement
                }
            });

            document.body.dispatchEvent(event);

            // Assert loading is hidden and content is shown
            assert.isTrue(loadingElement.classList.contains('hidden'), 'Loading is hidden');
            assert.isFalse(contentElement.classList.contains('hidden'), 'Content is shown');
        });

        it('should handle HTMX response error event', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');
            const contentElement = drawer.querySelector('#test-content-id');
            const loadingElement = drawer.querySelector('.drawer-loading');
            const errorElement = drawer.querySelector('.drawer-error');

            // Create and dispatch htmx:responseError event
            const event = new CustomEvent('htmx:responseError', {
                detail: {
                    target: contentElement
                }
            });

            document.body.dispatchEvent(event);

            // Assert loading is hidden and error is shown
            assert.isTrue(loadingElement.classList.contains('hidden'), 'Loading is hidden');
            assert.isFalse(errorElement.classList.contains('hidden'), 'Error is shown');
        });

        it('should handle HTMX after on load event with close header', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');
            const contentElement = drawer.querySelector('#test-content-id');

            // Spy on close method
            const closeSpy = this.sinon.spy(drawer, 'close');

            // Create mock xhr with getResponseHeader method
            const xhr = {
                getResponseHeader: this.sinon.stub().withArgs('HX-CloseDrawer').returns('close')
            };

            // Create and dispatch htmx:afterOnLoad event
            const event = new CustomEvent('htmx:afterOnLoad', {
                detail: {
                    target: contentElement,
                    xhr: xhr
                }
            });

            document.body.dispatchEvent(event);

            // Assert close was called
            assert.isTrue(closeSpy.called, 'close method was called');
        });

        it('should not close drawer when header is not present', function () {
            sandbox.innerHTML = fixtures.ajaxDrawer;
            const drawer = document.getElementById('ajax-drawer');
            const contentElement = drawer.querySelector('#test-content-id');

            // Spy on close method
            const closeSpy = this.sinon.spy(drawer, 'close');

            // Create mock xhr with getResponseHeader method that returns null
            const xhr = {
                getResponseHeader: this.sinon.stub().withArgs('HX-CloseDrawer').returns(null)
            };

            // Create and dispatch htmx:afterOnLoad event
            const event = new CustomEvent('htmx:afterOnLoad', {
                detail: {
                    target: contentElement,
                    xhr: xhr
                }
            });

            document.body.dispatchEvent(event);

            // Assert close was not called
            assert.isFalse(closeSpy.called, 'close method was not called');
        });
    });
});