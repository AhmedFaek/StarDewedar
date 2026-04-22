# Star Dewedar Admin Dashboard

Industrial-grade admin dashboard built with React + Tailwind CSS, following the ELECTRO-GRID design system.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

```bash
cd admin
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3001`

### Build

```bash
npm run build
```

Output will be in the `dist/` folder.

## 📁 Project Structure

```
admin/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx      # Main layout wrapper
│   │   │   ├── Sidebar.jsx         # Side navigation
│   │   │   └── TopAppBar.jsx       # Top header bar
│   │   └── ui/
│   │       ├── Button.jsx          # Reusable button component
│   │       ├── Badge.jsx           # Status badge component
│   │       ├── Card.jsx            # Card wrapper
│   │       ├── StatCard.jsx        # Dashboard stat cards
│   │       ├── Table.jsx           # Basic table
│   │       └── TableCard.jsx       # Table with header/footer
│   ├── pages/
│   │   └── Dashboard.jsx           # Dashboard home page
│   ├── styles/
│   │   └── globals.css             # Global styles and utilities
│   ├── App.jsx                     # Root component
│   └── main.jsx                    # Entry point
├── tailwind.config.js              # Tailwind configuration with design tokens
├── vite.config.js                  # Vite configuration
├── postcss.config.js               # PostCSS configuration
├── index.html                      # HTML template
└── package.json                    # Dependencies

```

## 🎨 Design System

The dashboard follows the ELECTRO-GRID design system with:

### Colors
- **Primary:** `#000e24` (Deep Navy - Foundation)
- **Primary Container:** `#00234b` (Darker Navy)
- **Tertiary:** `#6a5f00` (Electric Yellow)
- **Tertiary Fixed:** `#f9e454` (Bright Yellow)
- **Secondary:** `#5d5e61` (Steel Grey)

### Typography
- **Headlines:** Space Grotesk (Geometric, engineered feel)
- **Body:** Inter (Clean, readable)
- **Letter Spacing:** Tight tracking for industrial aesthetic

### Borders & Elevation
- **Border Radius:** 0px (Sharp, industrial look)
- **Shadows:** Navy-tinted ambient shadows only
- **Depth:** Achieved through tonal layering, not shadows
- **Borders:** Background color shifts, not visible borders

## 🛠️ Component Usage

### StatCard
```jsx
<StatCard
  label="Total Products"
  value="1,284"
  trend="+12%"
  icon="inventory_2"
  variant="default"
/>
```

**Variants:** `default`, `tertiary`, `gradient`

### Badge
```jsx
<Badge variant="error">Pending Action</Badge>
<Badge variant="success" icon="check_circle">Approved</Badge>
```

**Variants:** `default`, `error`, `success`, `warning`, `urgent`

### Button
```jsx
<Button variant="primary" size="lg" icon="add">
  New Item
</Button>
```

**Variants:** `primary`, `secondary`, `tertiary`, `outline`, `ghost`  
**Sizes:** `sm`, `md`, `lg`

### TableCard
```jsx
<TableCard
  title="Recent Activity"
  columns={columns}
  data={data}
  actions={true}
  viewAllLink="#"
  footerContent={<Pagination />}
/>
```

## 🔧 Configuration

### Tailwind
All color tokens, typography, and spacing are defined in `tailwind.config.js`. The configuration extends the default theme with the ELECTRO-GRID palette.

### Material Symbols
Icons use Google's Material Symbols Outlined font, already configured via CDN in `index.html`.

## 📝 Conventions

- **Naming:** PascalCase for components, camelCase for props and variables
- **Styling:** Tailwind utility classes with custom color tokens
- **Structure:** Feature-based organization with shared `components/` directory
- **Props:** Use object destructuring for all component props
- **Exports:** Named exports for all components

## 🎯 Next Steps

1. **Add routing:** Implement React Router for navigation between pages
2. **API integration:** Connect backend endpoints for data fetching
3. **State management:** Add Zustand or Redux for complex state
4. **Authentication:** Implement login and protected routes
5. **Additional pages:** Build CRUD pages for each module (Products, Projects, etc.)

## 📄 License

All design and code © 2024 Star Dewedar. All rights reserved.
