import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('../docs/reports');
await mkdir(output, { recursive: true });
const chrome = await launch({
  chromePath: process.env['CHROME_PATH'] ?? chromium.executablePath(),
  chromeFlags: [
    '--headless',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  const result = await lighthouse(process.env['LIGHTHOUSE_URL'] ?? 'http://localhost:8080/', {
    port: chrome.port,
    output: ['html', 'json'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'mobile',
  });
  const summary = {
    url: result.lhr.finalDisplayedUrl,
    fetchTime: result.lhr.fetchTime,
    lighthouseVersion: result.lhr.lighthouseVersion,
    mode: 'Mobile, simulated throttling, local Docker stack',
    scores: Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, value]) => [
        key,
        Math.round(value.score * 100),
      ]),
    ),
    metrics: Object.fromEntries(
      [
        'first-contentful-paint',
        'largest-contentful-paint',
        'speed-index',
        'total-blocking-time',
        'cumulative-layout-shift',
      ].map((key) => [
        key,
        {
          value: result.lhr.audits[key].numericValue,
          display: result.lhr.audits[key].displayValue,
        },
      ]),
    ),
    opportunities: result.lhr.audits['diagnostics']?.details?.items ?? [],
  };
  await writeFile(resolve(output, 'lighthouse-mobile.html'), result.report[0]);
  await writeFile(resolve(output, 'lighthouse-mobile.json'), result.report[1]);
  await writeFile(
    resolve(output, 'lighthouse-summary.json'),
    JSON.stringify(summary, null, 2) + '\n',
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await chrome.kill();
}
