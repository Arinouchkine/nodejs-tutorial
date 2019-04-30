const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });
let tab = [{'user': 'server', 'message': 'Welcom'}];
// Broadcast to all.

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {

    tab.push(data);
    // Broadcast to everyone else.
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN)
      {
        client.send(data);
      }
    });
  });
  ws.send(JSON.stringify(tab));
});