import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Add this line to include Tailwind CSS
import 'tailwindcss/tailwind.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
