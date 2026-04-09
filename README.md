# House Budget Tracker

A modern, fully offline personal budget tracking web app.

## Features

- **Overview dashboard** — KPI cards, spending bars, donut chart, balance summary
- **Details view** — Expandable categories with projected vs actual vs difference
- **Edit tab** — Live-edit all projected and actual values, auto-saved instantly
- **Manage tab** — Add/remove categories and items with custom colors and icons
- **Import / Export** — JSON (full backup/restore) and CSV (for Excel/Sheets)
- **Browser persistence** — All data saved in localStorage, survives refresh and browser close
- **Color-coded differences** — Green = good (surplus / under budget), Red = bad (deficit / over budget)
- **Fully responsive** — Works on mobile and desktop

## How to Use

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. No server or installation required — runs 100% locally
3. Your data auto-saves every time you make a change

## File Structure

```
house-budget-app/
├── index.html          — Main HTML
├── css/
│   └── style.css       — All styles
├── js/
│   ├── data.js         — Default data, storage helpers, constants
│   └── app.js          — All application logic
└── README.md
```

## Data Management

- **Export JSON** — Full backup of all categories and values
- **Import JSON** — Restore from a backup file
- **Export CSV** — Open in Microsoft Excel or Google Sheets

## Customization

- Edit `js/data.js` → `DEFAULT_DATA` to change the starting categories and items
- Edit `css/style.css` → `:root` variables to change colors and fonts

## Browser Compatibility

Works in all modern browsers. Data is stored in `localStorage` under the key `hb_data_v4`.
