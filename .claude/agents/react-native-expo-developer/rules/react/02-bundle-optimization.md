# Bundle Size Optimization (CRITICAL)

**Every KB matters on mobile. This rule prevents bloated bundles.**

---

## Rule 1: Avoid Barrel File Imports

Barrel files export everything, forcing bundlers to include unused code. Import directly from the source file.

### ❌ Incorrect (Bloats Bundle)

```typescript
// ❌ components/index.ts re-exports everything
export { Button } from './Button';
export { Card } from './Card';
export { Dialog } from './Dialog';
export { Modal } from './Modal';
export { Tooltip } from './Tooltip';
export { Badge } from './Badge';
// ... 20 more components

// Your code uses only Button
import { Button } from './components';  // ← Pulls in ALL 26 components
// Bundle includes unused Card, Dialog, Modal, etc.
```

**Bundle impact:** +50KB (26 unused components)

### ✅ Correct (Tree-Shakeable)

```typescript
// Direct import only loads Button
import Button from './components/Button';  // ← Only Button loaded
// Unused components are tree-shaken away

// Or use named imports from source
import { Button } from './components/Button';
```

**Bundle impact:** -50KB

### Pattern: Avoid Barrels

```typescript
// ❌ DON'T: Create barrel files
// components/index.ts
export * from './Button';
export * from './Card';
export * from './Dialog';

// ✅ DO: Import directly
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Dialog } from './components/Dialog';
```

### Exception: Organizing Imports

Barrels are acceptable **only** for organizing imports within your own codebase:

```typescript
// ✅ OK: Internal re-export for cleaner imports
// components/form/index.ts
export { Input } from './Input';
export { Select } from './Select';
export { Textarea } from './Textarea';

// In component
import { Input, Select } from '@/components/form';
```

**Reason:** Your own code uses tree-shaking; external libraries don't always.

---

## Rule 2: Dynamic Imports for Heavy Components

Don't load 200KB image editor on initial page load. Load it only when user needs it.

### ❌ Incorrect (Blocks Initial Load)

```tsx
// ❌ Heavy component loaded on every page
import ImageEditor from './ImageEditor';  // 200KB
import PhotoLibrary from './PhotoLibrary';  // 150KB

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <button onClick={() => setShowEditor(true)}>Edit</button>

      {/* These load immediately even if user never clicks */}
      {showEditor && <ImageEditor />}
      <PhotoLibrary />
    </>
  );
}

// Initial bundle: +350KB
```

### ✅ Correct (Lazy Load on Demand)

```tsx
import { Suspense, lazy } from 'react';

// ✅ Load only when needed
const ImageEditor = lazy(() => import('./ImageEditor'));  // 200KB
const PhotoLibrary = lazy(() => import('./PhotoLibrary'));  // 150KB

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <>
      <button onClick={() => setShowEditor(true)}>Edit</button>
      <button onClick={() => setShowLibrary(true)}>Browse</button>

      {/* Load only when shown */}
      {showEditor && (
        <Suspense fallback={<LoadingSpinner />}>
          <ImageEditor />
        </Suspense>
      )}

      {showLibrary && (
        <Suspense fallback={<LoadingSpinner />}>
          <PhotoLibrary />
        </Suspense>
      )}
    </>
  );
}

// Initial bundle: Base only (350KB saved for initial load)
// Loaded on-demand with loading UI
```

### Pattern: Identify Heavy Components

```tsx
// Heavy libraries/components that should be lazy-loaded
const HeavyChart = lazy(() => import('recharts'));  // ~50KB
const RichEditor = lazy(() => import('react-quill'));  // ~80KB
const PDFViewer = lazy(() => import('react-pdf'));  // ~200KB
const ThreeScene = lazy(() => import('@react-three/fiber'));  // ~100KB

// Light components (keep in main bundle)
import Button from './Button';  // 2KB
import Input from './Input';  // 1KB
import Card from './Card';  // 1KB
```

---

## Rule 3: Conditional Module Loading

Load different code paths based on user context. Don't ship mobile code to desktop users.

### ❌ Incorrect (Platform-Specific Code in Bundle)

```typescript
// ❌ Both web AND mobile code bundled together
import { NativeModule } from 'react-native';
import { WebModule } from 'react-web';

export function Feature() {
  if (Platform.OS === 'web') {
    return <WebModule />;
  } else {
    return <NativeModule />;
  }
}

// Bundle: WebModule (50KB) + NativeModule (50KB) = 100KB
// Web user downloads 50KB of unused native code
// Mobile user downloads 50KB of unused web code
```

### ✅ Correct (Conditional Import)

```typescript
// ✅ Platform-specific code loaded conditionally
let Component: any;

if (Platform.OS === 'web') {
  Component = require('react-web').WebModule;  // Only web bundle loads this
} else {
  Component = require('react-native').NativeModule;  // Only mobile bundle loads this
}

export function Feature() {
  return <Component />;
}

// Web bundle: 50KB only
// Mobile bundle: 50KB only (50KB saved per platform)
```

### Pattern: Feature Flags

```typescript
// ✅ Load feature code based on feature flags
const isPremium = useIsPremium();

let AnalyticsComponent: any;

if (isPremium) {
  AnalyticsComponent = lazy(() => import('./AdvancedAnalytics'));
} else {
  AnalyticsComponent = lazy(() => import('./BasicAnalytics'));
}

// Free users: Advanced Analytics (80KB) not loaded
// Premium users: Only loaded when feature accessed
```

---

## Rule 4: Code Splitting Best Practices

Split code at route boundaries to load only what's needed.

### ❌ Incorrect (Single Bundle)

```tsx
// ❌ All pages in one bundle
import HomePage from './pages/Home';
import DashboardPage from './pages/Dashboard';
import SettingsPage from './pages/Settings';

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <>
      {page === 'home' && <HomePage />}
      {page === 'dashboard' && <DashboardPage />}
      {page === 'settings' && <SettingsPage />}
    </>
  );
}

// Bundle: Home (80KB) + Dashboard (120KB) + Settings (60KB) = 260KB
// User loads all 260KB even if they only visit Home (80KB)
```

### ✅ Correct (Route-Based Splitting)

```tsx
import { lazy, Suspense } from 'react';

// ✅ Each page in separate bundle
const HomePage = lazy(() => import('./pages/Home'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const SettingsPage = lazy(() => import('./pages/Settings'));

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <Suspense fallback={<PageLoader />}>
      <>
        {page === 'home' && <HomePage />}
        {page === 'dashboard' && <DashboardPage />}
        {page === 'settings' && <SettingsPage />}
      </>
    </Suspense>
  );
}

// Initial: 80KB (Home)
// Navigate to Dashboard: +120KB (on-demand)
// Navigate to Settings: +60KB (on-demand)
// Saves ~180KB on initial load
```

---

## Rule 5: Monitor Bundle Size

Track bundle growth and catch regressions.

### Checking Bundle Size

```bash
# Analyze React app bundle
npm run build
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'

# Or use bundlesize CLI
npm install --save-dev bundlesize
bundlesize

# Check for large modules
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer
```

---

## Detection Checklist

When reviewing code, look for:

- [ ] Barrel file imports from node_modules (should be direct imports)
- [ ] Heavy components imported unconditionally (should be lazy)
- [ ] Platform-specific code in shared modules (should be conditional)
- [ ] All routes/pages in main bundle (should use code splitting)
- [ ] Missing `React.lazy()` for modal/popup components

---

## Impact Examples

| Change | Impact |
|--------|--------|
| Remove barrel imports | -50KB |
| Lazy-load modals | -80KB |
| Code split routes | -120KB |
| Conditional imports | -60KB |
| **Total potential savings** | **-310KB (30% reduction)** |

---

## References

- [Vercel: Bundle Optimization](https://nextjs.org/learn/foundation/how-nextjs-works/bundling)
- [Web.dev: Code Splitting](https://web.dev/code-splitting/)
- [React: Code-Splitting](https://react.dev/reference/react/lazy)
