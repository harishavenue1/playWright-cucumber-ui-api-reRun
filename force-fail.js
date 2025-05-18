#!/usr/bin/env node

// This script creates a rerun.txt file with a known failing test
// Use it to test the rerun functionality

const fs = require('fs');
const path = require('path');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Create rerun.txt with a reference to the invalid credentials test
const rerunPath = path.join(reportsDir, 'rerun.txt');
fs.writeFileSync(rerunPath, 'features/sample.feature:11');

console.log('Created rerun.txt with a reference to the invalid credentials test');
console.log('You can now run: npm run test:failures');