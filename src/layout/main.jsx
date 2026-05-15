// layouts/MainLayout.jsx
import { SidebarProvider } from '@/hooks/use-sidebar';
import { ThemeProvider } from '@/hooks/use-theme';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';
import { useModelDefs } from '@/hooks/use-model-defs';
import { navData } from '@/data/sidebar';
import { useCurrentUser } from '@/hooks/use-currentuser';
import { useRoleId } from '@/hooks/use-role';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

const AUTH_PREFIXES = ['/auth', '/login', '/signup'];

const normalizePerms = (perms = {}) => {
  const map = {};
  Object.entries(perms || {}).forEach(([k, v]) => {
    if (!k) return;
    map[String(k).toLowerCase()] = v || {};
  });
  return map;
};

const candidatesForKey = (key) => {
  const variants = new Set();
  const base = String(key || '').toLowerCase();
  const add = (k) => {
    if (k) variants.add(k);
  };

  add(base);
  add(base.replace(/-/g, '_'));

  const maybeSingular = (k) => (k.endsWith('s') ? k.slice(0, -1) : k);
  add(maybeSingular(base));
  add(maybeSingular(base.replace(/-/g, '_')));

  return Array.from(variants).filter(Boolean);
};

export default function MainLayout() {
  const { pathname } = useLocation();
  const hideSidebar = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  const { data: modelDefs = [], isLoading } = useModelDefs();

  const { data: me } = useCurrentUser();
  const { data: role } = useRoleId(me?.roleId || null);
  const user = me;
  const [global, setGlobal] = useState(null);

  useEffect(() => {
    async function fetchGlobalData() {
      try {
        const response = await api().get('/api/site_global');
        const payload = response?.data?.data ?? response?.data ?? null;
        setGlobal(payload && typeof payload === 'object' ? payload : null);
      } catch (error) {
        console.error(error);
      }
    }

    fetchGlobalData();
  }, []);

  const getType = (m) => {
    const raw =
      (m.collectionType && String(m.collectionType).toLowerCase()) ||
      (m.singleton === true
        ? 'single'
        : m.singleton === false
          ? 'collection'
          : 'collection');
    return raw === 'singleton' ? 'single' : raw; // accept 'singleton' too
  };

  const toItem = (m) => {
    const type = getType(m);
    return {
      title: m.name || m.key,
      to: type === 'collection' ? `/content/${m.key}` : `/single/${m.key}`,
      icon: m?.ui?.icon || 'IconFolder',
      key: m.key,
    };
  };

  const normalized = modelDefs.map((m) => ({ ...m, __type: getType(m) }));

  const collections = normalized
    .filter((m) => m.__type === 'collection')
    .map(toItem)
    .sort((a, b) => a.title.localeCompare(b.title));

  const singles = normalized
    .filter((m) => m.__type === 'single')
    .map(toItem)
    .sort((a, b) => a.title.localeCompare(b.title));

  // ---- PERMISSION FILTERING ----
  const permsMap = normalizePerms(role?.permissions);
  const isAdmin =
    role?.name?.toLowerCase?.() === 'admin' ||
    me?.roleName?.toLowerCase?.() === 'admin';

  const canRead = (key) => {
    const candidates = candidatesForKey(key);
    if (!candidates.length) return false;
    // Explicit perms override wildcard: if a modelKey is present and read=false, hide it.
    const explicitReads = candidates
      .map((k) => permsMap[k])
      .filter(Boolean)
      .map((p) => p.read);

    if (explicitReads.includes(true)) return true;
    if (explicitReads.includes(false)) return false;

    const wild = permsMap['*'];
    if (wild?.read) return true;

    return false;
  };

  const filterByPermissions = (items) => {
    if (isAdmin) return items; // full access
    if (!role?.permissions) return [];

    return items.filter((item) => {
      const fromUrl = item.url?.split('/').filter(Boolean).pop();
      const fromTo = item.to?.split('/').filter(Boolean).pop();
      const key =
        fromUrl?.toLowerCase() ||
        fromTo?.toLowerCase() ||
        item.key?.toLowerCase() ||
        item.title?.toLowerCase();

      // Skip permission check for the dashboard
      if (key === 'dashboard') return true;

      // Check permissions for other items
      return canRead(key); // only allow read:true (or wildcard read)
    });
  };

  const getPriority = (item) => {
    const k = (item.key || item.title || '').toLowerCase();
    const priorities = {
      'dashboard': 1,
      'booking': 2,
      'tour': 3,
      'tours': 3,
      'destinations': 4,
      'destination': 4,
      'categories': 5,
      'category': 5,
      'blog': 6,
      'users': 7,
      'testimonial': 8,
      'testimonials': 8,
      'images': 9,
      'coupons': 10,
    };
    return priorities[k] || 99;
  };

  const allItemsRaw = [
    ...(navData.navMain || []).map(i => ({ ...i, key: i.key || i.title.toLowerCase() })),
    ...collections,
    ...singles,
  ];

  const allItems = filterByPermissions(allItemsRaw);

  allItems.sort((a, b) => {
    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pa - pb;
    return (a.title || '').localeCompare(b.title || '');
  });

  const frequentItems = allItems.filter(i => getPriority(i) < 99);
  const otherItems = allItems.filter(i => getPriority(i) === 99);

  const appSections = [
    { title: 'Main', items: frequentItems },
    {
      title: isLoading ? 'Loading...' : 'More Options',
      items: otherItems,
      isCollapsible: true
    },
  ];

  const sections = appSections;
  const globalName = String(
    global?.name ??
      global?.siteName ??
      global?.brandName ??
      'Galaxy Travel',
  ).trim();
  const sidebarTitle = `${globalName || 'Galaxy Travel'}.`;

  return (
    <SidebarProvider>
      <ThemeProvider>
        <div className='flex h-screen w-screen'>
          {!hideSidebar && (
            <AppSidebar
              title={sidebarTitle}
              sections={sections}
              user={user}
            />
          )}

          <div className='flex h-screen w-full flex-col p-0 m-0'>
            <div className='@container/main flex h-screen w-full flex-col gap-2 p-0 m-0'>
              <Outlet />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </SidebarProvider>
  );
}
