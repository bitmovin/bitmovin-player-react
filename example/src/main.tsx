import 'bitmovin-player-ui/dist/css/bitmovinplayer-ui.css';
import './customStyles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
