const puppeteer = require('puppeteer');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/run', async (req, res) => {
  const estimateUrls = req.body.estimates;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Login
  await page.goto('https://auth.servicefusion.com/auth/login', { waitUntil: 'networkidle2' });
  await page.type('#company', process.env.SF_COMPANY || 'pfs21485');
  await page.type('#uid', process.env.SF_USER || 'Lui-G');
  await page.type('#pwd', process.env.SF_PASS || 'Premierlog5335!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  for (const url of estimateUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('select[name="Jobs[master_status_id]"]', { visible: true });
      await page.select('select[name="Jobs[master_status_id]"]', '1018590097'); // Follow Up 1
      await page.click('button.btn-success');
      await page.waitForTimeout(2000);
    } catch (err) {
      console.log('❌ Estimate error:', err.message);
    }
    await page.waitForTimeout(3000);
  }

  await browser.close();
  res.send({ message: '✅ Estimate statuses updated!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Estimate service running at http://localhost:${PORT}/run`);
});
