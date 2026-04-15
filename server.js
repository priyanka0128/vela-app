import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('./'));

import rewrite     from './api/rewrite.js';
import cloneSpeak  from './api/clone-speak.js';
import cloneVoice  from './api/clone-voice.js';
import speakCloned from './api/speak-cloned.js';
import saveUser    from './api/save-user.js';
import getUser     from './api/get-user.js';

app.post('/api/rewrite',      (req, res) => rewrite(req, res));
app.post('/api/clone-speak',  (req, res) => cloneSpeak(req, res));
app.post('/api/clone-voice',  (req, res) => cloneVoice(req, res));
app.post('/api/speak-cloned', (req, res) => speakCloned(req, res));
app.post('/api/save-user',    (req, res) => saveUser(req, res));
app.get('/api/get-user',      (req, res) => getUser(req, res));

app.listen(3000, () => {
  console.log('Vela running at http://localhost:3000');
});