const reporter = require('cucumber-html-reporter');
const fs = require('fs');
const path = require('path');

// Get input and output file paths from command line arguments
const jsonFile = process.argv[2] || 'reports/report.json';
const outputFile = process.argv[3] || 'reports/report.html';

// Get run label and timestamp from command line arguments (optional)
const runLabel = process.argv[4] || (jsonFile.includes('rerun') ? 'Rerun' : 'Main Run');
const runTimestamp = process.argv[5] || new Date().toLocaleString();

// Check if the JSON file exists and has content
if (!fs.existsSync(jsonFile) || fs.statSync(jsonFile).size === 0) {
  console.log(`No report data found in ${jsonFile}`);
  process.exit(0);
}

const options = {
  theme: 'hierarchy', // Modern, clean theme
  jsonFile: jsonFile,
  output: outputFile,
  reportSuiteAsScenarios: true,
  launchReport: false,
  metadata: {
    "Test Environment": "Local",
    "Platform": process.platform,
    "Executed": "Automated",
    "Report Type": runLabel,
    "Report Generated": runTimestamp
  },
  brandTitle: `Playwright + Cucumber BDD Test Report`,
  name: `UI & API Automation - ${runLabel} @ ${runTimestamp}`,
  storeScreenshots: true,
  displayDuration: true,
  pageTitle: `Test Automation Report - ${runLabel} - ${runTimestamp}`,
  scenarioTimestamp: true,
  sort: true
};

// Enhance report with screenshots and logs
// Add timestamp to each step in the report JSON
function enhanceReportWithAttachments() {
  try {
    const report = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    for (const feature of report) {
      for (const element of feature.elements || []) {
        for (const step of element.steps || []) {
          // Attach screenshot or log if present in step result
          if (step.result && step.result.attachments) {
            step.embeddings = step.result.attachments.map(att => {
              if (att.type === 'screenshot') {
                return {
                  data: fs.readFileSync(att.path, { encoding: 'base64' }),
                  mime_type: 'image/png',
                };
              } else if (att.type === 'api') {
                return {
                  data: fs.readFileSync(att.path, 'utf-8'),
                  mime_type: 'text/plain',
                };
              }
              return null;
            }).filter(Boolean);
          }
          // Add step timestamp if not present
          if (!step.timestamp) {
            step.timestamp = new Date().toLocaleString();
          }
        }
      }
    }
    fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error enhancing report:', error);
  }
}

try {
  enhanceReportWithAttachments();
  reporter.generate(options);
  if (fs.existsSync(outputFile)) {
    let html = fs.readFileSync(outputFile, 'utf-8');
    // Patch: Add step timestamps by scenario and step order for accuracy
    try {
      const report = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      let scenarioIdx = 0;
      html = html.replace(/(<div class="row steps">[\s\S]*?<\/div>)/g, (scenarioBlock) => {
        // For each scenario block, patch step timestamps by order
        let stepIdx = 0;
        return scenarioBlock.replace(/(<span class="stepname">([\s\S]*?)<\/span>)/g, (match, p1) => {
          let timestamp = '';
          try {
            const feature = report.find(f => f.elements && f.elements[scenarioIdx]);
            const scenario = feature && feature.elements[scenarioIdx];
            const step = scenario && scenario.steps && scenario.steps[stepIdx];
            if (step && step.timestamp) {
              timestamp = step.timestamp;
            }
          } catch {}
          stepIdx++;
        //   if (timestamp) {
        //     return `${p1}<span class='step-timestamp' style='color:#888;font-size:11px;margin-left:8px;'>(at ${timestamp})</span>`;
        //   }
          return p1;
        });
        scenarioIdx++;
        return scenarioBlock;
      });
      if (!html.includes('.step-timestamp{')) {
        html = html.replace('</style>', '.step-timestamp{font-style:italic;}\n</style>');
      }
    } catch {}
    fs.writeFileSync(outputFile, html, 'utf-8');
  }
  console.log(`🚀 Cucumber HTML report ${outputFile} generated successfully 👍`);
} catch (e) {
  console.error('Error generating report:', e);
}