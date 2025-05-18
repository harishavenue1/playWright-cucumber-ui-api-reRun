const { Given, When, Then, After, BeforeStep, AfterStep } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

let browser;
let page;
let fetch;

// Add timestamp to each step
BeforeStep(function(step) {
  this.currentStepTimestamp = new Date();
});

AfterStep(function(step) {
  const timestamp = this.currentStepTimestamp.toLocaleString();
  this.attach(`Step executed at: ${timestamp}`, 'text/plain');
});

Given('I am on the login page', { timeout: 20000 }, async function () {
  const start = Date.now();
  browser = await chromium.launch();
  page = await browser.newPage();
  // Use a stable public demo login page
  await page.goto('https://the-internet.herokuapp.com/login');
  console.log(`[PROFILE] Given I am on the login page: ${Date.now() - start}ms`);
});

When('I fill in the login form with valid credentials', { timeout: 20000 }, async function () {
  const start = Date.now();
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.waitForSelector('#password', { timeout: 10000 });
  await page.fill('#username', 'tomsmith');
  await page.fill('#password', 'SuperSecretPassword!');
  await page.click('button[type="submit"]');
  // Attach screenshot to Cucumber report
  const screenshot = await page.screenshot({ encoding: 'base64' });
  await this.attach(screenshot, 'image/png');
  console.log(`[PROFILE] When I fill in the login form: ${Date.now() - start}ms`);
});

When('I fill in the login form with username {string} and password {string}', { timeout: 20000 }, async function (username, password) {
  const start = Date.now();
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.waitForSelector('#password', { timeout: 10000 });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  // Attach screenshot to Cucumber report
  const screenshot = await page.screenshot({ encoding: 'base64' });
  await this.attach(screenshot, 'image/png');
  console.log(`[PROFILE] When I fill in the login form with username ${username}: ${Date.now() - start}ms`);
});

Then('I should see the dashboard', async function () {
  const start = Date.now();
  // Wait for dashboard element in Herokuapp demo
  // This will fail for invalid credentials (no success flash)
  await page.waitForSelector('div.flash.success', { timeout: 3000 });
  expect(await page.isVisible('div.flash.success')).toBeTruthy();
  console.log(`[PROFILE] Then I should see the dashboard: ${Date.now() - start}ms`);
});

When('I send a GET request to {string}', async function (endpoint) {
  const start = Date.now();
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
  const url = endpoint.startsWith('http') ? endpoint : `https://jsonplaceholder.typicode.com${endpoint}`;
  const reqLog = `[REQUEST] GET ${url}`;
  this.response = await fetch(url);
  const resText = await this.response.text();
  // Attach request/response log to Cucumber report
  await this.attach(`${reqLog}\n[RESPONSE] Status: ${this.response.status}\n${resText}`, 'text/plain');
  this.responseBody = resText;
  console.log(`[PROFILE] When I send a GET request to ${endpoint}: ${Date.now() - start}ms`);
});

Then('the response status should be {int}', async function (status) {
  const start = Date.now();
  expect(this.response.status).toBe(status);
  // Optionally log response body
  // console.log(this.responseBody);
  console.log(`[PROFILE] Then the response status should be ${status}: ${Date.now() - start}ms`);
});

After(async function () {
  if (browser) {
    try {
      await browser.close();
    } catch (e) {}
    browser = undefined;
    page = undefined;
  }
});
