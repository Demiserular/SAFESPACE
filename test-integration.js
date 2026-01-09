/**
 * Integration Test Suite for Safe-Space App
 * Run this script to test critical functionality
 * 
 * Usage: node test-integration.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;

        const req = client.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

// Test helper functions
function logTest(name, passed, message = '') {
    const status = passed ?
        `${colors.green}✓ PASS${colors.reset}` :
        `${colors.red}✗ FAIL${colors.reset}`;

    console.log(`  ${status} ${name}`);
    if (message) console.log(`    ${colors.yellow}${message}${colors.reset}`);

    results.tests.push({ name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
}

function logWarning(name, message) {
    console.log(`  ${colors.yellow}⚠ WARNING${colors.reset} ${name}`);
    if (message) console.log(`    ${message}`);
    results.warnings++;
}

function logSection(name) {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}${name}${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

// Test suites
async function testEnvironmentVariables() {
    logSection('1. Environment Variables');

    logTest(
        'NEXT_PUBLIC_SUPABASE_URL is set',
        !!SUPABASE_URL,
        SUPABASE_URL ? `URL: ${SUPABASE_URL.substring(0, 30)}...` : 'Not set'
    );

    logTest(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY is set',
        !!SUPABASE_KEY,
        SUPABASE_KEY ? 'Key present' : 'Not set'
    );
}

async function testPageAccessibility() {
    logSection('2. Page Accessibility');

    const pages = [
        { path: '/', name: 'Home Page' },
        { path: '/login', name: 'Login Page' },
        { path: '/signup', name: 'Signup Page' },
        { path: '/create-post', name: 'Create Post Page' },
        { path: '/chat-rooms', name: 'Chat Rooms Page' },
        { path: '/ai-support', name: 'AI Support Page' },
        { path: '/feedback', name: 'Feedback Page' }
    ];

    for (const page of pages) {
        try {
            const response = await makeRequest(`${BASE_URL}${page.path}`);
            logTest(
                page.name,
                response.statusCode === 200,
                `Status: ${response.statusCode}`
            );
        } catch (error) {
            logTest(page.name, false, error.message);
        }
    }
}

async function testAPIEndpoints() {
    logSection('3. API Endpoints');

    const endpoints = [
        { path: '/api/posts', method: 'GET', name: 'Get Posts API' },
        { path: '/api/user', method: 'GET', name: 'Get User API' },
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
                method: endpoint.method
            });

            const passed = response.statusCode === 200 || response.statusCode === 401;
            logTest(
                endpoint.name,
                passed,
                `Status: ${response.statusCode} (401 expected if not authenticated)`
            );
        } catch (error) {
            logTest(endpoint.name, false, error.message);
        }
    }
}

async function testSupabaseConnection() {
    logSection('4. Supabase Connection');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        logTest('Supabase Configuration', false, 'Environment variables not set');
        return;
    }

    try {
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        logTest(
            'Supabase API Reachable',
            response.statusCode === 200 || response.statusCode === 404,
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        logTest('Supabase API Reachable', false, error.message);
    }

    // Test posts table access
    try {
        const response = await makeRequest(`${SUPABASE_URL}/rest/v1/posts?limit=1`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        logTest(
            'Posts Table Accessible',
            response.statusCode === 200,
            `Status: ${response.statusCode}`
        );
    } catch (error) {
        logTest('Posts Table Accessible', false, error.message);
    }
}

async function testBuildConfiguration() {
    logSection('5. Build Configuration');

    const fs = require('fs');
    const path = require('path');

    // Check if build files exist
    const buildDir = path.join(process.cwd(), '.next');
    const hasBuildDir = fs.existsSync(buildDir);

    if (hasBuildDir) {
        logTest('Next.js Build Directory', true, 'Build directory exists');
    } else {
        logWarning('Next.js Build Directory', 'No build directory found. Run: npm run build');
    }

    // Check package.json
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
        );

        logTest('package.json Valid', true, `Version: ${packageJson.version}`);

        const requiredScripts = ['dev', 'build', 'start', 'lint'];
        const hasAllScripts = requiredScripts.every(script => packageJson.scripts[script]);

        logTest(
            'Required Scripts Present',
            hasAllScripts,
            hasAllScripts ? 'All scripts configured' : 'Missing some scripts'
        );
    } catch (error) {
        logTest('package.json Valid', false, error.message);
    }
}

async function testDatabaseSchema() {
    logSection('6. Database Schema');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        logWarning('Database Schema', 'Skipping - Supabase not configured');
        return;
    }

    const tables = ['posts', 'comments', 'reactions', 'reports', 'user_roles'];

    for (const table of tables) {
        try {
            const response = await makeRequest(
                `${SUPABASE_URL}/rest/v1/${table}?limit=1`,
                {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            logTest(
                `Table: ${table}`,
                response.statusCode === 200,
                `Status: ${response.statusCode}`
            );
        } catch (error) {
            logTest(`Table: ${table}`, false, error.message);
        }
    }
}

async function testSecurityHeaders() {
    logSection('7. Security Headers');

    try {
        const response = await makeRequest(BASE_URL);
        const headers = response.headers;

        // Check for security headers
        const securityChecks = [
            {
                header: 'x-frame-options',
                name: 'X-Frame-Options',
                optional: true
            },
            {
                header: 'x-content-type-options',
                name: 'X-Content-Type-Options',
                optional: true
            },
            {
                header: 'strict-transport-security',
                name: 'Strict-Transport-Security (HSTS)',
                optional: true
            }
        ];

        for (const check of securityChecks) {
            const hasHeader = !!headers[check.header];
            if (check.optional) {
                if (hasHeader) {
                    logTest(check.name, true, `Present: ${headers[check.header]}`);
                } else {
                    logWarning(check.name, 'Consider adding this security header');
                }
            } else {
                logTest(check.name, hasHeader, hasHeader ? 'Present' : 'Missing');
            }
        }
    } catch (error) {
        logWarning('Security Headers', `Could not check: ${error.message}`);
    }
}

async function testResponsiveness() {
    logSection('8. Responsive Design');

    logWarning(
        'Mobile Responsiveness',
        'Manual testing required. Check breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px)'
    );

    logWarning(
        'Touch Interactions',
        'Manual testing required. Verify touch-friendly button sizes on mobile devices'
    );
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset}  ${colors.blue}Safe-Space Integration Test Suite${colors.reset}                  ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset}  Testing environment: ${BASE_URL.substring(0, 30).padEnd(30)} ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

    try {
        await testEnvironmentVariables();
        await testPageAccessibility();
        await testAPIEndpoints();
        await testSupabaseConnection();
        await testBuildConfiguration();
        await testDatabaseSchema();
        await testSecurityHeaders();
        await testResponsiveness();
    } catch (error) {
        console.error(`\n${colors.red}Fatal error during testing:${colors.reset}`, error);
    }

    // Print summary
    console.log('\n');
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}Test Summary${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✓ Passed:${colors.reset}   ${results.passed}`);
    console.log(`${colors.red}✗ Failed:${colors.reset}   ${results.failed}`);
    console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${results.warnings}`);
    console.log(`Total Tests: ${results.passed + results.failed}`);

    const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (results.failed === 0) {
        console.log(`\n${colors.green}✨ All tests passed! Your app is looking good for production.${colors.reset}`);
    } else {
        console.log(`\n${colors.red}⚠️  Some tests failed. Please review the failures above.${colors.reset}`);
    }

    if (results.warnings > 0) {
        console.log(`${colors.yellow}ℹ️  ${results.warnings} warnings detected. Review recommendations above.${colors.reset}`);
    }

    console.log('\n');

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Check if server is running before testing
async function checkServer() {
    try {
        await makeRequest(BASE_URL);
        return true;
    } catch (error) {
        console.error(`\n${colors.red}❌ Cannot connect to ${BASE_URL}${colors.reset}`);
        console.error(`${colors.yellow}Please start the development server first:${colors.reset}`);
        console.error(`   npm run dev`);
        console.error(`\nOr test production build:`);
        console.error(`   npm run build && npm run start`);
        console.error(`\nOr specify a different URL:`);
        console.error(`   TEST_URL=https://your-app.com node test-integration.js\n`);
        return false;
    }
}

// Run tests
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runAllTests();
    } else {
        process.exit(1);
    }
})();
