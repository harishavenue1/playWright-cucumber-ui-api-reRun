#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'reports');
const rerunFile = path.join(reportsDir, 'rerun.txt');
const mainReportJson = path.join(reportsDir, 'report.json');
const mainReportHtml = path.join(reportsDir, 'report.html');

function runMain() {
  execSync('npm run pretest', { stdio: 'inherit' });
  const runLabel = `Main Run`;
  const runTimestamp = new Date().toLocaleString();
  try {
    execSync('cucumber-js --require steps/**/*.js features/**/*.feature --format json:reports/report.json --format rerun:reports/rerun.txt', { stdio: 'inherit' });
  } catch (e) {
    // Continue even if there are failures
  }
  execSync(`node generate-html-report.js ${mainReportJson} ${mainReportHtml} "${runLabel}" "${runTimestamp}"`);
}

function runRerun(iteration) {
  if (!fs.existsSync(rerunFile) || fs.statSync(rerunFile).size === 0) return false;
  const rerunContent = fs.readFileSync(rerunFile, 'utf8').trim();
  if (!rerunContent) return false;
  const failedTests = rerunContent.split('\n').filter(line => line.trim() !== '');
  if (failedTests.length === 0) return false;
  const testArgs = failedTests.join(' ');
  const rerunJson = path.join(reportsDir, `rerun-report-${iteration}.json`);
  const rerunHtml = path.join(reportsDir, `rerun-report-${iteration}.html`);
  const runLabel = `Rerun Attempt #${iteration}`;
  const runTimestamp = new Date().toLocaleString();
  try {
    execSync(`cucumber-js --require steps/**/*.js ${testArgs} --format json:${rerunJson} --format rerun:${rerunFile}`, { stdio: 'inherit' });
  } catch (e) {
    // Continue even if rerun fails
  }
  execSync(`node generate-html-report.js ${rerunJson} ${rerunHtml} "${runLabel}" "${runTimestamp}"`);
  return fs.existsSync(rerunFile) && fs.statSync(rerunFile).size > 0;
}

// MAIN EXECUTION
runMain();
let rerunNeeded = fs.existsSync(rerunFile) && fs.statSync(rerunFile).size > 0;
let maxReruns = 3;
let iteration = 1;
while (rerunNeeded && iteration <= maxReruns) {
  console.log(`\n--- Rerun attempt ${iteration} ---`);
  rerunNeeded = runRerun(iteration);
  iteration++;
}
console.log('\nAll reruns complete. Check the reports folder for individual rerun reports.');
