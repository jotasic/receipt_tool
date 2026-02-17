# Advanced Patterns (LOW)

**Edge cases and advanced techniques. Use when necessary.**

---

## Rule 1: Initialize App Once, Not Per Mount

Heavy initialization (databases, analytics, third-party SDKs) should run once, not on every component mount.

### ❌ Incorrect (Re-initializes)

```tsx
// ❌ Initializes Firebase on every App component mount/remount
function App() {
  useEffect(() => {
    // This can run multiple times during development or if App remounts
    initializeFirebase();
    initializeAnalytics();
    initializeErrorReporting();

    return () => {
      // ❌ Cleanup might break things if called unexpectedly
      closeDatabase();
    };
  }, []); // ← Empty dependency looks good but...

  return <MainApp />;
}

// Problem:
// - Development mode: Effect runs twice (Strict mode)
// - App unmounts/remounts: Re-initialization
// - Cleanup can release connections prematurely
```

### ✅ Correct (Singleton Pattern)

```tsx
// ✅ Initialize once at module level
let isInitialized = false;

function initializeApp() {
  if (isInitialized) return;

  initializeFirebase();
  initializeAnalytics();
  initializeErrorReporting();

  isInitialized = true;
}

// Call at app startup
if (Platform.OS === 'web') {
  // Web: Initialize before ReactDOM.render
  initializeApp();
}

export default function App() {
  // Initialize on first render (safety net)
  useMemo(() => {
    initializeApp();
  }, []);

  return <MainApp />;
}

// Or use a custom hook
function useAppInitialization() {
  useMemo(() => {
    initializeApp();
  }, []);
}

export default function App() {
  useAppInitialization();
  return <MainApp />;
}
```

### Pattern: Module-Level Initialization

```typescript
// ✅ Best: Initialize at module load
// services/analytics.ts
class Analytics {
  private static instance: Analytics;

  static getInstance() {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
      Analytics.instance.init();
    }
    return Analytics.instance;
  }

  private init() {
    // Initialize once
    setupAnalyticsProvider();
  }

  track(event: string, data?: any) {
    // Track events
  }
}

export const analytics = Analytics.getInstance();

// app.tsx
export default function App() {
  // Already initialized at import time
  return <MainApp />;
}
```

### What Should Initialize Once

```typescript
// ✅ Initialize once (heavy/expensive)
- Database connections
- Analytics providers
- Error reporting services
- Third-party SDKs
- Feature flag systems
- Authentication systems

// ❌ Initialize per mount (lightweight)
- Local state
- Effects that fetch data
- Timers/subscriptions (need cleanup)
```

---

## Rule 2: Store Event Handlers in Refs

Stable event handler references prevent re-renders of child components using `React.memo`.

### ❌ Incorrect (Recreates on Every Render)

```tsx
function DataGrid({ data }) {
  // ❌ handleRowClick recreated on every render
  const handleRowClick = (id: string) => {
    console.log('Row clicked:', id);
  };

  return (
    <View>
      {data.map((row) => (
        // Memoization broken because handleRowClick changed
        <MemoizedRow key={row.id} data={row} onClick={handleRowClick} />
      ))}
    </View>
  );
}

// Performance: MemoizedRow re-renders on every parent render
```

### ✅ Correct (Stable Reference with useRef)

```tsx
function DataGrid({ data }) {
  // ✅ Store handler in ref for stable reference
  const handleRowClickRef = useRef((id: string) => {
    console.log('Row clicked:', id);
  });

  return (
    <View>
      {data.map((row) => (
        // Now handleRowClickRef.current doesn't change
        <MemoizedRow key={row.id} data={row} onClick={handleRowClickRef.current} />
      ))}
    </View>
  );
}

// Better with useCallback for better practice
function DataGrid({ data }) {
  const handleRowClick = useCallback((id: string) => {
    console.log('Row clicked:', id);
  }, []);

  return (
    <View>
      {data.map((row) => (
        <MemoizedRow key={row.id} data={row} onClick={handleRowClick} />
      ))}
    </View>
  );
}
```

### Pattern: useCallback Best Practices

```tsx
// ✅ useCallback with explicit dependencies
function Form() {
  const [email, setEmail] = useState('');

  // Only recreate when email changes
  const handleChange = useCallback(
    (text: string) => {
      setEmail(text);
      // Log only when email changes
      console.log('Email changed to:', text);
    },
    [] // Empty = never recreates
  );

  return <Input onChange={handleChange} />;
}

// ✅ useCallback with dependencies
function FilteredList({ itemId, items }) {
  const handleSelect = useCallback(
    (id: string) => {
      api.selectItem(itemId, id);  // Depends on itemId
    },
    [itemId]  // Recreate when itemId changes
  );

  return (
    <View>
      {items.map((item) => (
        <Item key={item.id} onSelect={handleSelect} />
      ))}
    </View>
  );
}
```

---

## Rule 3: useEffectEvent for Stable Callbacks (Advanced)

For callbacks that should NOT trigger effects when they change, use `useEffectEvent` pattern.

### ❌ Incorrect (Triggers Re-renders)

```tsx
function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    // ❌ Dependency on onSearch causes infinite loops
    // If parent passes new onSearch function, effect runs
    const timer = setTimeout(() => {
      onSearch(query);  // Triggers parent re-render → new onSearch
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);  // ← onSearch causes problems

  return <Input value={query} onChangeText={setQuery} />;
}

// Problem: onSearch in dependency → effect re-runs → calls onSearch
// Creates chain of re-renders
```

### ✅ Correct (useEffectEvent Pattern)

```tsx
function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');

  // ✅ Store onSearch callback in ref
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;  // Update ref without triggering effect
  }, [onSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Call through ref, doesn't need as dependency
      onSearchRef.current(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);  // ← No onSearch dependency

  return <Input value={query} onChangeText={setQuery} />;
}

// Or with helper hook (React 19+)
function useEffectEvent(callback: (...args: any[]) => void) {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  }, [callback]);

  return useCallback((...args: any[]) => ref.current(...args), []);
}

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState('');

  // ✅ Wrap callback
  const handleSearch = useEffectEvent(onSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);  // Much cleaner!

  return <Input value={query} onChangeText={setQuery} />;
}
```

### When to Use useEffectEvent Pattern

```typescript
// ✅ Use when:
- Event handler shouldn't trigger effects
- Callback is used inside effect
- Avoid infinite dependency loops
- Keep latest callback without re-running effect

// ❌ Don't use when:
- Callback must trigger effect (it should be dependency)
- Effect logic changes based on callback
- Simple cases where useCallback works
```

---

## Rule 4: Careful with Closures

Event handlers capture variables in closures. Be aware of stale values.

### ❌ Incorrect (Stale Closure)

```tsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Count is:', count);  // ❌ Stale! Always logs 0
      setCount(count + 1);  // ❌ Stale! Always adds 1 to 0
    }, 1000);

    return () => clearInterval(interval);
  }, []);  // ← Missing count dependency

  return <Text>{count}</Text>;
}

// Problem: count is captured at mount time = 0
// Interval logs 0 forever, count never increments
```

### ✅ Correct (Functional Updates)

```tsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        console.log('Count is:', prev);  // ✅ Always current
        return prev + 1;  // ✅ Increments correctly
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);  // ← No dependencies needed!

  return <Text>{count}</Text>;
}
```

---

## Rule 5: Refs for Imperative Operations

Use refs for imperative operations that don't fit the React model.

### ❌ Incorrect (Fighting React)

```tsx
function VideoPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // ❌ Trying to control video imperatively through state
  useEffect(() => {
    const video = document.querySelector('video');
    if (isPlaying) {
      video?.play();
    } else {
      video?.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <video src={src} />
      <Button onPress={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </>
  );
}

// Problem: Effect syncing, complexity, potential race conditions
```

### ✅ Correct (Imperative with Ref)

```tsx
function VideoPlayer({ src }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // ✅ Direct imperative control through ref
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <video ref={videoRef} src={src} />
      <Button onPress={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </>
  );
}

// Much simpler: Direct method calls, no effects
```

### When to Use Refs

```typescript
// ✅ Use refs for imperative operations
- Playing/pausing media
- Triggering animations
- Focus management
- Integration with non-React libraries
- Scroll position
- DOM measurements

// ❌ Don't use refs for
- Data that should trigger re-renders
- Props/state management
- Anything that belongs in state
```

---

## Advanced Patterns Checklist

When reviewing advanced code, look for:

- [ ] Multiple initializations of heavy resources
- [ ] Event handlers recreated on every render (use useCallback)
- [ ] Stale closures in intervals/timeouts (use functional updates)
- [ ] Effects with missing dependencies (be intentional)
- [ ] Imperative code fighting the React model (use refs)

---

## Debugging Advanced Issues

```typescript
// Enable Strict Mode to catch issues early
<React.StrictMode>
  <App />
</React.StrictMode>

// In development, Strict Mode:
- Runs effects twice
- Unmounts/remounts components
- Logs warnings for unsafe lifecycles
// Helps catch: stale closures, missing deps, side effects in render

// Use React DevTools → Components tab
// Check: Props, State, Hooks, Render count
```

---

## References

- [useCallback Documentation](https://react.dev/reference/react/useCallback)
- [useRef Documentation](https://react.dev/reference/react/useRef)
- [Closure Patterns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)
- [React 18 Concurrency](https://react.dev/blog/2021/06/08/the-next-major-release)
