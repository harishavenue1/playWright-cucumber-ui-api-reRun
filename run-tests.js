#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const rerunFilePath = path.join(__dirname, 'reports', 'rerun.txt');

// Ensure reports directory exists
if (!fs.existsSync(path.join(__dirname, 'reports'))) {
  fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true });
}

// Check command line arguments
const runFailuresOnly = process.argv.includes('--rerun-failures');
const runWithRetry = process.argv.includes('--with-retry');
const runFromRerun = process.argv.includes('--run-from-rerun');

try {
  if (runFromRerun) {
    // Run directly from rerun file
    if (fs.existsSync(rerunFilePath)) {
      const rerunContent = fs.readFileSync(rerunFilePath, 'utf8').trim();
      
      if (rerunContent) {
        console.log('Running failed tests from rerun file...');
        // Parse the rerun file to get the feature file and line number
        const failedTests = rerunContent.split('\n').filter(line => line.trim() !== '');
        
        if (failedTests.length > 0) {
          // Run all failed tests in a single command
          const testArgs = failedTests.join(' ');
          console.log(`Running: ${testArgs}`);
          execSync(`cucumber-js --require steps/**/*.js ${testArgs} --format json:reports/rerun-report.json`, { stdio: 'inherit' });
        } else {
          console.log('No failed tests found in rerun file.');
        }
      } else {
        console.log('Rerun file is empty. No tests to run.');
      }
    } else {
      console.log('No rerun file found. Run tests first to generate failures.');
    }
  } else if (runFailuresOnly) {
    // Check if rerun file exists and has content
    if (fs.existsSync(rerunFilePath)) {
      const rerunContent = fs.readFileSync(rerunFilePath, 'utf8').trim();
      
      if (rerunContent) {
        console.log('Running only failed tests...');
        // Parse the rerun file to get the feature file and line number
        const failedTests = rerunContent.split('\n').filter(line => line.trim() !== '');
        
        if (failedTests.length > 0) {
          // Run all failed tests in a single command
          const testArgs = failedTests.join(' ');
          console.log(`Running: ${testArgs}`);
          execSync(`cucumber-js --require steps/**/*.js ${testArgs} --format json:reports/rerun-report.json`, { stdio: 'inherit' });
        } else {
          console.log('No failed tests found in rerun file.');
        }
      } else {
        console.log('No failed tests to rerun.');
      }
    } else {
      console.log('No rerun file found. Run tests first to generate failures.');
    }
  } else if (runWithRetry) {
    // Run all tests first
    console.log('Running all tests...');
    try {
      execSync('npm run test', { stdio: 'inherit' });
      console.log('All tests passed successfully!');
    } catch (error) {
      console.log('Some tests failed. Checking for failures to retry...');
      
      // Check if rerun file exists and has content
      if (fs.existsSync(rerunFilePath)) {
        const rerunContent = fs.readFileSync(rerunFilePath, 'utf8').trim();
        
        if (rerunContent) {
          console.log('Retrying failed tests...');
          // Parse the rerun file to get the feature file and line number
          const failedTests = rerunContent.split('\n').filter(line => line.trim() !== '');
          
          if (failedTests.length > 0) {
            // Run all failed tests in a single command
            const testArgs = failedTests.join(' ');
            console.log(`Running: ${testArgs}`);
            execSync(`cucumber-js --require steps/**/*.js ${testArgs} --format json:reports/rerun-report.json`, { stdio: 'inherit' });
          } else {
            console.log('No failed tests found in rerun file.');
          }
        } else {
          console.log('No failures to retry.');
        }
      } else {
        console.log('No rerun file generated. Check test configuration.');
      }
    }
  } else {
    // Run all tests
    console.log('Running all tests...');
    execSync('npm run test', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}