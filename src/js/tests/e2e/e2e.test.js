const puppeteer = require('puppeteer');
const { fork } = require('child_process');

jest.setTimeout(30000);
describe('E2E', () => {
  let browser = null;
  let page = null;
  let server = null;
  const url = 'http://localhost:9090';
  beforeAll(async () => {
    server = fork(`${__dirname}/e2e.server.js`);
    await new Promise((resolve, reject) => {
      server.on('error', () => {
        reject();
      });
      server.on('message', (message) => {
        if (message === 'ok') {
          resolve();
        }
      });
    });
    browser = await puppeteer.launch(
      {
        headless: false,
        slowMo: 100,
        devtools: true,
      },
    );
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
    server.kill();
  });
  describe('Tests', () => {
    async function dancerResolver() {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.url().endsWith('fetch') || req.url().endsWith('new') || req.url().endsWith('update') || req.url().endsWith('delete')) {
          req.respond({
            status: 200,
            contentType: 'text/plain',
            body: JSON.stringify({ status: 'Test', data: [] }),
          });
        } else {
          req.continue();
        }
      });
    }

    test('Add, update, delete', async () => {
      await dancerResolver();
      await page.goto(url);
      // Add
      const plus = await page.$('button[class=new]');
      plus.click();
      await page.waitForFunction(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      const name = await page.$('textarea[id=description]');
      await name.type('Lock, stock and two smoking barrels');
      const save = await page.$('button[class=save]');
      save.click();
      await page.waitForFunction(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitForFunction(() => (document.querySelector('.column-item-title').textContent === 'Lock, stock and two smoking barrels'));

      // Update
      const update = await page.$('svg[class=column-item-actions-update]');
      update.click();
      await page.waitForFunction(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await name.click({ clickCount: 3 });
      await name.type('Pulp fiction');
      save.click();
      await page.waitForFunction(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitForFunction(() => (document.querySelector('.column-item-title').textContent === 'Pulp fiction'));

      // Delete
      const remove = await page.$('svg[class=column-item-actions-delete]');
      remove.click();
      await page.waitForFunction(() => !document.querySelector('div.modal-delete').classList.contains('hidden'));
      const destroy = await page.$('button[class=delete]');
      destroy.click();
      await page.waitForFunction(() => document.querySelector('div.modal-delete').classList.contains('hidden'));
      await page.waitForFunction(() => !(document.querySelector('.column-item-title')));

      // Error
      plus.click();
      await page.waitForFunction(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await name.type('1');
      await name.press('Backspace');
      await page.waitForFunction(() => !document.querySelector('.error-description').classList.contains('hidden'));
      await page.waitForFunction(() => document.querySelector('.save').disabled);
    });
  });
});
