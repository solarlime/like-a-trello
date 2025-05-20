const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('../../../../webpack.dev');

const server = new WebpackDevServer(
  { port: 9090, host: 'localhost' },
  webpack(config),
);
server.startCallback((err) => {
  if (err) {
    return;
  }
  if (process.send) {
    process.send('ok');
  }
});
