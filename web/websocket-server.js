const WebSocket = require('ws');

const webSocketServer = new WebSocket.Server({ port: 3001 });

webSocketServer.on('connection', function connection(webSocket) {
  webSocket.on('message', function incoming(message) {
    console.log('received: %s', message);
    webSocket.send(message);
  });
  webSocket.send('Welcome!');
});
