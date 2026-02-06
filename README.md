## GalaxyTravel Admin Dashboard
React + Vite dashboard for managing GalaxyTravel content, bookings, enquiries, site chrome, roles/permissions, coupons, and media. Talks to the backend at `http://localhost:8080` (or `process.env.VITE_API_BASE`).

---

### Quick Start
1) Install deps  
   `npm install`
2) Configure env  
   Create `.env` (or `.env.local`) with at least:
   - `VITE_API_BASE=http://localhost:8080`
   - `VITE_GOOGLE_CLIENT_ID=<optional for Google login>`
3) Run dev server  
   `npm run dev` (Vite, default port 5173)
4) Build / Preview  
   `npm run build` → `dist/`  
   `npm run preview` to serve the build

---

### Scripts
- `npm run dev` – Vite dev with HMR
- `npm run build` – production build
- `npm run preview` – serve built assets
- `npm run lint` – ESLint (React, hooks, refresh)

---

### Tech Stack
- React 18, Vite 7
- React Router 7
- TailwindCSS 4 + tailwind-merge + tailwind-animate
- Radix UI primitives (dialog, dropdown, select, tabs, tooltip, popover, scroll-area, switch, toggle)
- Lucide + Tabler icons
- TanStack Query/Table/Virtual
- React Hook Form + Zod validation
- Tiptap editor (rich text, tables, media, underline, color, highlight, align, etc.)
- Recharts, CMDK, Sonner/Toastify for toasts
- Drag & drop via dnd-kit

---

### Environment & Config
- `src/lib/api.js` (axios instance) reads `VITE_API_BASE` and attaches auth token from localStorage (`token` key).  
- Auth tokens checked in `src/lib/config.js` (`getToken`, `isTokenExpired`, `clearAuth`).
- Permissions: `src/hooks/use-permissions.js` exposes `can(model, action)`; route/button guards are in:
  - `components/guard/PermRoute.jsx`
  - `components/guard/PermButton.jsx`
  - `components/guard/RequirePerm.jsx`
- Sidebar/navigation: `src/data/sidebar.js`
- UI schema for dynamic CRUD: `src/data/uischema.js` (field definitions, relations, validation)

---

### Core Features
- **Authentication**: email/password + optional Google OAuth (`react-oauth/google`).
- **Role/Permission aware UI**: routes and buttons respect backend permissions (model keys: `blog`, `tour`, `flyers`, `policy`, `coupon`, etc.).
- **Content Management**:
  - Dynamic tables & forms (`pages/dynamic/DynamicTable.jsx`, `pages/dynamic/ContentFormPage.jsx`, `pages/dynamic/SingleFormPage.jsx`)
  - Rich text via Tiptap (`components/fields/RichTextField`)
  - Relation pickers with pagination/search (`components/fields/RelationInput`, `UniDirectionalRelation`)
- **Catalog**: blog, destinations, tours, months, testimonials, site chrome (hero slides, features, destinations list, globals), images.
- **Marketing**: flyers, coupons (with tour filters), policy/terms editor.
- **Sales/Ops**: bookings (status/payment state), enquiries, leads, creator requests.
- **Media**: image manager (`pages/main/Image.jsx`) uploads via backend `/api/images`.
- **Settings**: SMTP, global/site settings, payment gateways.
- **Utilities**: export, docs viewer, counts dashboard, search, pagination, infinite scroll.

---

### Project Structure (high level)
- `src/App.jsx` – routing + auth/permission guards
- `src/layout/` – `main` shell (header, sidebar)
- `src/pages/main/` – feature pages (Dashboard, Users, Roles, Flyers, Coupons, Policy, Settings, CreatorRequests, Images)
- `src/pages/dynamic/` – schema-driven tables/forms for models
- `src/components/` – UI + form fields + guards + dialogs (FlyerFormDialog, CouponFormDialog, Role panels, etc.)
- `src/data/` – `uischema.js` (field defs), `sidebar.js`, sample data
- `src/hooks/` – auth/user/permission helpers
- `public/` – static assets

---

### Permissions Map (common model keys)
- `users`, `roles`, `blog`, `categories`, `destinations`, `tour`, `flyers`, `policy`, `coupon`, `booking`, `enquiries`, `lead`, `site_features`, `site_destinationslist`, `site_global`, `site_heroslides`, `review`, `images`, `settings`, `models`, `schema`
- Actions: `read`, `create`, `update`, `delete`, `publish`, `reject` (varies per model)

Ensure dashboard model keys match backend `ensurePermission` model names (e.g., `flyers`, not `flyer`).

---

### API Expectations
- Base URL: `VITE_API_BASE` (defaults to `http://localhost:8080`)
- Auth header: `Authorization: Bearer <token>`
- Moderation endpoints use `/api/<model>/moderation` for CRUD; public endpoints for read-only data.

---

### Styling & UX
- Tailwind utility-first; theme tokens set in `src/index.css` and component-level classes.
- Dialogs, dropdowns, popovers use Radix.
- Toasts via React Toastify and Sonner.
- Dark-mode ready via `next-themes` (if enabled in layout).

---

### Building for Prod
- `npm run build` outputs to `dist/`
- Serve `dist` behind CDN or via the backend’s static host (if configured). Set `VITE_API_BASE` to prod API URL at build time.

---

### Troubleshooting
- 403 on pages/actions: check your role permissions and model key alignment.
- Empty relation dropdowns: confirm moderation endpoints are reachable and authenticated; ensure `VITE_API_BASE` points to backend.
- CORS errors: add dashboard origin to backend `allowedOrigins` in `backend/server.js`.
- Rich text paste issues: Tiptap plugins live in `components/fields/RichTextField`; adjust extensions if needed.
