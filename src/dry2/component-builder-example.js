/**
 * Example: How to use ComponentBuilder for other components
 * 
 * This example shows how to create a component builder for a hypothetical button component
 */

// Example usage for a button component
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if the element exists
    if (document.getElementById('button-component-builder')) {
        new ComponentBuilder({
            elementId: 'button-component-builder',
        componentTag: 'dry-button',
        title: 'Button Component Builder',
        description: 'Customize button properties and see live preview.',
        
        properties: {
            variant: {
                type: 'select',
                label: 'Variant',
                options: [
                    { value: 'primary', label: 'Primary' },
                    { value: 'secondary', label: 'Secondary' },
                    { value: 'danger', label: 'Danger' },
                    { value: 'outline', label: 'Outline' }
                ],
                default: 'primary'
            },
            size: {
                type: 'select',
                label: 'Size',
                options: [
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' }
                ],
                default: 'medium'
            },
            disabled: {
                type: 'checkbox',
                label: 'Disabled',
                default: false
            },
            fullWidth: {
                type: 'checkbox',
                label: 'Full Width',
                default: false
            },
            text: {
                type: 'text',
                label: 'Button Text',
                default: 'Click me'
            }
        },
        
        defaults: {
            variant: 'primary',
            size: 'medium',
            disabled: false,
            fullWidth: false,
            text: 'Click me'
        },
        
        contentGenerator: function(values) {
            return values.text;
        },
        
        codeGenerator: function(values, config) {
            const attributes = Object.entries(values)
                .filter(([key, value]) => {
                    if (key === 'text') return false; // text is content, not attribute
                    const propConfig = config.properties[key];
                    return value !== propConfig.default && value !== false && value !== '';
                })
                .map(([key, value]) => `${key}="${value}"`)
                .join(' ');
            
            return `<dry-button${attributes ? ' ' + attributes : ''}>${values.text}</dry-button>`;
        }
        });
    }
});

// Example for a more complex component with custom preview wrapper
if (document.getElementById('card-component-builder')) {
    new ComponentBuilder({
        elementId: 'card-component-builder',
    componentTag: 'dry-card',
    title: 'Card Component Builder',
    description: 'Build beautiful card components.',
    
    properties: {
        elevation: {
            type: 'range',
            label: 'Elevation',
            min: 0,
            max: 5,
            default: 1,
            displayFormat: (value) => `Level ${value}`
        },
        rounded: {
            type: 'checkbox',
            label: 'Rounded Corners',
            default: true
        },
        padding: {
            type: 'select',
            label: 'Padding',
            options: [
                { value: 'none', label: 'None' },
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' }
            ],
            default: 'medium'
        }
    },
    
    defaults: {
        elevation: 1,
        rounded: true,
        padding: 'medium'
    },
    
    contentGenerator: function(values) {
        return `
    <div class="card-header">
        <h3>Sample Card Title</h3>
    </div>
    <div class="card-body">
        <p>This is a sample card with elevation level ${values.elevation}.</p>
        <p>Rounded: ${values.rounded ? 'Yes' : 'No'}</p>
        <p>Padding: ${values.padding}</p>
    </div>
    <div class="card-footer">
        <button>Action</button>
    </div>`;
    },
    
    previewWrapper: function(componentHTML) {
        // Custom wrapper for better preview display
        return `<div class="max-w-sm mx-auto">${componentHTML}</div>`;
    }
    });
}