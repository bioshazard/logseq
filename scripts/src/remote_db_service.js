const express = require('express');
const { WebSocketServer } = require('ws');
const bodyParser = require('body-parser');

// The db worker compiled for node must export `remoteInvoke`
// via shadow-cljs build `:db-worker-node`.
const dbWorker = require('../../static/db-worker.node.js');

let lastOp = Promise.resolve();
function invoke(method, direct, args) {
  // queue operations so multiple clients don't corrupt the DB
  lastOp = lastOp.then(() => dbWorker.remoteInvoke(method, direct, args));
  return lastOp;
}

const app = express();
app.use(bodyParser.text({ type: '*/*' }));

app.post('/api/db/:method', async (req, res) => {
  try {
    const direct = req.header('x-direct-pass') === 'true';
    const args = direct ? JSON.parse(req.body || '[]') : req.body;
    const result = await invoke(req.params.method, direct, args);
    res.setHeader('Content-Type', 'application/transit+json');
    res.send(result);
  } catch (e) {
    res.status(500).send(String(e));
  }
});

const server = app.listen(process.env.PORT || 3030, () => {
  console.log('DB service listening on', server.address().port);
});

const wss = new WebSocketServer({ server, path: '/api/db/ws' });
wss.on('connection', (ws) => {
  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const result = await invoke(msg.method, !!msg.direct, msg.args);
      ws.send(result);
    } catch (e) {
      ws.send(JSON.stringify({ error: String(e) }));
    }
  });
});
