# Re-render Optimization (MEDIUM)

**Unnecessary re-renders waste CPU and kill performance. This rule prevents them.**

---

## Rule 1: Calculate Derived State During Rendering

Don't use `useEffect` to calculate derived values. Calculate them during render instead.

### ❌ Incorrect (Extra Render Cycle)

```tsx
function UserCard({ firstName, lastName }) {
  const [fullName, setFullName] = useState('');

  // ❌ Causes 2 renders:
  // 1st: fullName = ''
  // 2nd: useEffect fires, updates fullName
  useEffect(() => {
    setFullName(`${firstName} ${lastName}`);
  }, [firstName, lastName]);

  return <Text>{fullName}</Text>;
  // Renders with empty fullName first, then with actual value
}

// Performance: 2 renders, flickering UI
```

### ✅ Correct (Single Render)

```tsx
function UserCard({ firstName, lastName }) {
  // ✅ Calculate immediately during render
  const fullName = `${firstName} ${lastName}`;

  return <Text>{fullName}</Text>;
  // Single render, no flickering
}

// Performance: 1 render, instant UI
```

### Pattern: Complex Derived State

```tsx
// ✅ Move calculations inside component
function OrderSummary({ items, taxRate }) {
  // All calculations happen during render
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <>
      <Text>Subtotal: {subtotal}</Text>
      <Text>Tax: {tax}</Text>
      <Text>Total: {total}</Text>
    </>
  );
}
```

---

## Rule 2: Extract to Memoized Components

When derived state causes re-renders, extract to `React.memo` component.

### ❌ Incorrect (Expensive Render)

```tsx
function Dashboard({ data, filters }) {
  // ❌ This calculation runs on EVERY render
  const filteredData = data.filter(item => {
    return Object.entries(filters).every(([key, value]) =>
      item[key] === value
    );
  });

  // If parent re-renders 100x, this filter runs 100x
  // Even if data and filters don't change

  return <DataList data={filteredData} />;
}

// Problem: FilteredList recalculates even when input unchanged
```

### ✅ Correct (Memoized Component)

```tsx
// ✅ Extract expensive computation to memoized component
const FilteredList = React.memo(
  function FilteredList({ data, filters }) {
    const filteredData = data.filter(item => {
      return Object.entries(filters).every(([key, value]) =>
        item[key] === value
      );
    });

    return <DataList data={filteredData} />;
  },
  // Custom comparison: only re-render if data/filters objects changed
  (prevProps, nextProps) => {
    return (
      prevProps.data === nextProps.data &&
      prevProps.filters === nextProps.filters
    );
  }
);

export function Dashboard({ data, filters }) {
  // FilteredList only re-renders when data or filters object reference changes
  return <FilteredList data={data} filters={filters} />;
}

// Performance: No wasted re-renders
```

### When to Extract

- Expensive calculations (sort, filter, transform)
- Component receives objects that are recreated on each render
- Child component is slow to render

---

## Rule 3: Use Functional setState Updates

When new state depends on old state, use functional form to avoid stale closures.

### ❌ Incorrect (Stale State)

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => {
    // ❌ count is captured in closure, may be stale
    setCount(count + 1);  // Can miss updates if called multiple times quickly
  };

  useEffect(() => {
    const interval = setInterval(() => {
      increment();  // count from closure is stale
    }, 100);

    return () => clearInterval(interval);
  }, [count]); // ← Must add dependency, causes re-creates interval
}

// Problem: count closure is stale, interval recreates frequently
```

### ✅ Correct (Functional Update)

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    // ✅ Receive current state value
    setCount(prevCount => prevCount + 1);  // Always uses latest count
  }, []); // ← No dependencies needed!

  useEffect(() => {
    const interval = setInterval(() => {
      increment();  // increment is stable
    }, 100);

    return () => clearInterval(interval);
  }, [increment]); // ← Stable dependency
}

// Performance: increment never recreated, interval never recreated
```

### Pattern: Complex State Updates

```tsx
// ✅ Functional updates work with objects too
function UserForm() {
  const [form, setForm] = useState({ name: '', email: '', age: 0 });

  const updateField = (field, value) => {
    // ✅ Receive previous state
    setForm(prevForm => ({
      ...prevForm,
      [field]: value,  // Always merges with latest form
    }));
  };
}
```

---

## Rule 4: useRef for Transient Values

Values that don't trigger re-renders should go in `useRef`, not `useState`.

### ❌ Incorrect (Unnecessary Re-renders)

```tsx
function TextInput() {
  const [value, setValue] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleChange = (text) => {
    setValue(text);
    // ❌ Creates new re-render just to track character count
    setCharCount(text.length);  // Causes component to re-render
  };

  return <Input value={value} onChange={handleChange} />;
}

// Problem: Every keystroke causes 2 state updates, 2 re-renders
```

### ✅ Correct (useRef)

```tsx
function TextInput() {
  const [value, setValue] = useState('');
  const charCountRef = useRef(0);  // ✅ Doesn't cause re-render

  const handleChange = (text) => {
    setValue(text);
    charCountRef.current = text.length;  // Update without re-render
  };

  return (
    <>
      <Input value={value} onChange={handleChange} />
      {/* Read ref directly, updates without setState */}
      <Text>Characters: {charCountRef.current}</Text>
    </>
  );
}

// Performance: 1 re-render per keystroke (instead of 2)
```

### When to Use useRef

- Timers/intervals (clear, reset)
- Previous values (for comparison)
- DOM measurements (width, scroll position)
- Values that don't affect UI

---

## Rule 5: Do Not Wrap Simple Expressions in useMemo

`useMemo` has overhead. Only use it for expensive calculations.

### ❌ Incorrect (useMemo Overhead)

```tsx
function Card({ title, description }) {
  // ❌ Overhead > benefit. String concatenation is instant
  const heading = useMemo(
    () => `${title}: ${description}`,
    [title, description]
  );

  return <Text>{heading}</Text>;
}

// Cost: useMemo setup (2KB code), dependency comparison
// Benefit: Save string concatenation (microseconds)
// Net: Negative! Makes app SLOWER.
```

### ✅ Correct (Direct Calculation)

```tsx
function Card({ title, description }) {
  // ✅ Direct calculation is faster than useMemo overhead
  const heading = `${title}: ${description}`;

  return <Text>{heading}</Text>;
}
```

### When useMemo is Worth It

```tsx
// ✅ Expensive algorithm (100ms+)
const sortedList = useMemo(
  () => items.sort((a, b) => {
    // Complex comparison logic
    return expensiveComparison(a, b);
  }),
  [items]
);

// ✅ Expensive transformation (creates new object)
const processedData = useMemo(
  () => {
    return largeDataset.map(item => ({
      ...item,
      computed: expensiveCalculation(item),
      nested: {
        value: anotherCalc(item),
      }
    }));
  },
  [largeDataset]
);

// ❌ Simple math (not worth it)
const doubled = useMemo(() => count * 2, [count]);

// ❌ Simple object property (not worth it)
const style = useMemo(() => ({ color: 'red' }), []);
```

### Benchmark: useMemo Overhead

```tsx
// Typical overhead: 0.1-0.5ms per useMemo
// Break-even calculation: (1000ms / 0.3ms) = 3,333 renders

// Only use useMemo if:
// 1. Calculation takes > 0.3ms, OR
// 2. Component renders > 3,333 times (unlikely)
```

---

## Rule 6: Memoization Dependency Gotchas

Objects and functions created during render always change, breaking memoization.

### ❌ Incorrect (Breaks Memoization)

```tsx
function Dashboard() {
  // ❌ New object every render
  const filterOptions = { status: 'active' };

  // ❌ FilteredList never memoizes because filterOptions changed
  return <FilteredList options={filterOptions} />;
}

// Problem: React.memo comparison fails, component re-renders unnecessarily
```

### ✅ Correct (Stable References)

```tsx
function Dashboard() {
  // ✅ Move outside render or memoize
  const filterOptions = useMemo(
    () => ({ status: 'active' }),
    []
  );

  // FilteredList now memoizes properly
  return <FilteredList options={filterOptions} />;
}

// Or move outside component
const FILTER_OPTIONS = { status: 'active' };

function Dashboard() {
  return <FilteredList options={FILTER_OPTIONS} />;
}
```

---

## Performance Checklist

When reviewing code, look for:

- [ ] `useEffect` calculating derived state (move to render)
- [ ] Expensive calculations in render of parent (extract to `memo`)
- [ ] `setCount(count + 1)` (change to `setCount(p => p + 1)`)
- [ ] Unnecessary `useMemo` on simple expressions
- [ ] Objects/functions created in render passed to `memo` components

---

## Measurement Guide

```typescript
// Use React DevTools Profiler
// 1. Open React DevTools → Profiler tab
// 2. Click record circle
// 3. Interact with app
// 4. Review: Duration, render count, why rendered

// Command line profiling (Next.js)
// npm run build -- --debug
// Check .next/analyze file
```

---

## References

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler)
- [useMemo Documentation](https://react.dev/reference/react/useMemo)
- [useCallback Documentation](https://react.dev/reference/react/useCallback)
- [Web.dev: Rendering Performance](https://web.dev/rendering-performance/)
