/* eslint-disable no-case-declarations */

const Koa = require('koa');

const app = new Koa();
const koaBody = require('koa-body');
const koaCors = require('@koa/cors');
const { MongoClient } = require('mongodb');

app.use(koaCors({ allowMethods: 'GET,PUT,POST,DELETE' }));

app.use(koaBody({
  urlencoded: true,
  multipart: true,
  parsedMethods: ['POST', 'PUT', 'DELETE', 'GET'],
  jsonLimit: '5mb',
}));

app.use(async (ctx) => {
  ctx.res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

  const url = 'mongodb+srv://zeit-jwaA2fQ4rxTmrRdnzXh5SarF:6mVY8Gw9SNGA4Jp@cluster0.isxfw.mongodb.net?retryWrites=true&w=majority';
  const client = new MongoClient(url, { useUnifiedTopology: true });

  // The database to use
  const dbName = 'like-a-trello';

  // eslint-disable-next-line consistent-return
  async function run() {
    try {
      await client.connect();
      console.log('Connected correctly to server');
      const db = client.db(dbName);

      // Use the collection "items"
      const col = db.collection('items');
      const document = ctx.request.body;
      const { query } = ctx.request;

      if (query.action) {
        switch (ctx.request.query.action) {
          case 'new':
            await col.insertOne(document);
            return { status: 'Added', data: '' };
          case 'update':
            if (document[0]) {
              await Promise.all(document.map(async (doc) => col.updateOne({ id: doc.id },
                { $set: { order: doc.order, column: doc.column } })));
            } else {
              await col.updateOne({ id: document.id },
                { $set: { name: document.name, files: document.files } });
            }
            return { status: 'Updated', data: '' };
          case 'delete':
            await col.removeOne({ id: document.id });
            return { status: 'Removed', data: '' };
          default:
            const data = await col.find().toArray();
            return {
              status: 'Fetched',
              data: data.map((item) => {
                const { _id, ...rest } = item;
                return rest;
              }),
            };
        }
      }
      throw TypeError('No action is mentioned');
    } catch (err) {
      console.log(err.stack);
    } finally {
      await client.close();
    }
  }

  // eslint-disable-next-line no-return-assign
  const result = await run().catch(console.dir);
  ctx.response.body = JSON.stringify(result);
});

app.listen(7000, () => console.log('Server works on 7000'));

module.exports = app;
