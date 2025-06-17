const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ✅ Catch unexpected errors
process.on('unhandledRejection', err => {
  console.error('🧨 Unhandled rejection:', err);
});

app.post('/run', async (req, res) => {
  const estimateUrls = req.body.estimates;

  const browser = await puppeteer.launch({
    headless: true, // Set to true for deployment
    slowMo: 100, // Helps debug interaction timing
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 🔐 Login
  await page.goto('https://auth.servicefusion.com/auth/login', { waitUntil: 'networkidle2' });
  await page.type('#company', process.env.SF_COMPANY || 'pfs21485');
  await page.type('#uid', process.env.SF_USER || 'Lui-G');
  await page.type('#pwd', process.env.SF_PASS || 'Premierlog5335!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  for (const url of estimateUrls) {
    try {
      console.log(`🔄 Navigating to ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2' });

      // ✅ Set the <select> value directly and dispatch change
      const setStatus = await page.evaluate(() => {
        const select = document.querySelector('select#Jobs_master_status_id');
        if (!select) return '❌ Could not find <select>';

        select.value = '1018590097'; // Follow Up 1
        const changeEvent = new Event('change', { bubbles: true });
        select.dispatchEvent(changeEvent);
        return '✅ Status set to Follow Up 1 via <select>';
      });

      console.log(setStatus);

      // ⏳ Let the change settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 💾 Click Save Estimate
      await page.waitForSelector('#estSave-top', { visible: true });
      await page.click('#estSave-top');
      console.log('💾 Clicked Save Estimate');

      // Wait for save to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ✅ OPTIONAL: Confirm status is correct after save
      const confirmed = await page.evaluate(() => {
        const select = document.querySelector('select#Jobs_master_status_id');
        if (select?.value === '1018590097') {
          return '✅ Confirmed saved status is Follow Up 1';
        }
        return `❌ Status after save is still: ${select?.value}`;
      });
      console.log(confirmed);

    } catch (err) {
      console.log(`❌ Error on ${url}: ${err.message}`);
    }
  }

  await browser.close();
  res.send({ message: '🎉 All estimates processed!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Estimate status updater running at http://localhost:${PORT}/run`);
});
