// karma.conf.js
module.exports = function(config) {
    config.set({
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        frameworks: ['mocha', 'chai', 'sinon'],

        // list of files / patterns to load in the browser
        files: [
            // Dependencies
            { pattern: 'https://unpkg.com/htmx.org@2.0.4', type: 'js' },
            { pattern: 'https://unpkg.com/alpinejs@3.13.0/dist/cdn.min.js', type: 'js' },

            // Components to test
            '../dry2/drawer-components.js',
            '../dry2/dry2.js',

            // Test files
            'drawer-components.test.js',
            'web-components.test.js'
        ],

        // list of files / patterns to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        preprocessors: {
            '../dry2/drawer-components.js': ['coverage'],
            '../dry2/web-components.js': ['coverage']
        },

        // test results reporter to use
        reporters: ['progress', 'coverage'],

        coverageReporter: {
            type: 'html',
            dir: 'coverage/'
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        browsers: ['Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,

        // Configure custom launchers for CI environments
        customLaunchers: {
            ChromeHeadlessCI: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },

        // Add specific configuration for CI environments
        client: {
            mocha: {
                timeout: 5000 // Set timeout to 5 seconds
            }
        }
    });

    // Additional configuration for CI environment
    if (process.env.CI) {
        config.browsers = ['ChromeHeadlessCI'];
        config.singleRun = true;
        config.autoWatch = false;
    }
};