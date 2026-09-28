// A minimal, dependency-free Server-Sent Events broadcaster. Any number of
// clients can subscribe (see routes/sseRoutes.js); broadcast() pushes a JSON
// event to all of them immediately, which is what gives the Dashboard/Alerts
// pages live updates without polling or a full page reload.
//
// This is intentionally simple (single Node process, in-memory client list).
// For a multi-instance deployment, swap this for Redis pub/sub or a managed
// realtime service and keep the same broadcast(event, payload) contract.

const clients = new Set();

export function subscribe(res) {
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

export function broadcast(event, payload) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    try {
      res.write(data);
    } catch {
      clients.delete(res);
    }
  }
}

export function clientCount() {
  return clients.size;
}

export default { subscribe, broadcast, clientCount };
