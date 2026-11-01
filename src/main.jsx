import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.jsx';
import './app/library-desk.css';
import './app/themes.css';
import './app/typography.css';
import './app/conversation.css';
import { readTheme } from './shared/ui/useTheme';

document.documentElement.dataset.theme = readTheme();

createRoot(document.getElementById('root')).render(<App />);
