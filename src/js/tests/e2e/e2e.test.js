const puppeteer = require('puppeteer');
const { fork } = require('child_process');

jest.setTimeout(30000);
describe('E2E', () => {
  let browser = null;
  let page = null;
  let server = null;
  const url = 'http://localhost:9000';
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
        // headless: false,
        // slowMo: 100,
        // devtools: true,
      },
    );
    page = await browser.newPage();
  });
  afterAll(async () => {
    await browser.close();
    server.kill();
  });
  describe('Tests', () => {
    test('Add, update, delete', async () => {
      await page.goto(url);
      // Add
      const plus = await page.$('button[class=new]');
      plus.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      const name = await page.$('textarea[id=description]');
      await name.type('Lock, stock and two smoking barrels');
      const save = await page.$('button[class=save]');
      save.click();
      await page.waitFor(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitFor(() => (document.querySelector('.column-item-title').textContent === 'Lock, stock and two smoking barrels'));

      // Update
      const update = await page.$('svg[class=column-item-actions-update]');
      update.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await name.click({ clickCount: 3 });
      await name.type('Pulp fiction');
      save.click();
      await page.waitFor(() => document.querySelector('div.modal-add-update').classList.contains('hidden'));
      await page.waitFor(() => (document.querySelector('.column-item-title').textContent === 'Pulp fiction'));

      // Delete
      const remove = await page.$('svg[class=column-item-actions-delete]');
      remove.click();
      await page.waitFor(() => !document.querySelector('div.modal-delete').classList.contains('hidden'));
      const destroy = await page.$('button[class=delete]');
      destroy.click();
      await page.waitFor(() => document.querySelector('div.modal-delete').classList.contains('hidden'));
      await page.waitFor(() => !(document.querySelector('.column-item-title')));
    });
    test('Errors', async () => {
      await page.goto(url);
      // Add
      const plus = await page.$('button[class=new]');
      plus.click();
      await page.waitFor(() => !document.querySelector('div.modal-add-update').classList.contains('hidden'));
      const name = await page.$('textarea[id=description]');
      await name.type('1');
      await name.press('Backspace');
      await page.waitFor(() => !document.querySelector('.error-description').classList.contains('hidden'));
      await page.waitFor(() => document.querySelector('.save').disabled);
    });
  });
});
