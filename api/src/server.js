// Starts the API server.
import { createApp } from './app.js';
import { port } from './config.js';
import { read } from './db.js';

read(); // create data/db.json from the seed on first run
createApp().listen(port, () => {
  console.log(`Prep Desk API listening on http://localhost:${port}`);
});
