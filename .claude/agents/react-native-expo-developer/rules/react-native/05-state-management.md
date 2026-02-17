# State Management Rules (MEDIUM)

**Essential rules for clean, performant state management**

---

## Rule 1: Minimize State (Derived Values as Calculations)

### ❌ Incorrect

```tsx
import { useState } from 'react';

// Storing derived values in state → out of sync bugs
const [firstName, setFirstName] = useState('John');
const [lastName, setLastName] = useState('Doe');
const [fullName, setFullName] = useState('John Doe'); // ❌ duplicate state

const handleFirstNameChange = (name: string) => {
  setFirstName(name);
  setFullName(`${name} ${lastName}`); // ❌ must sync manually
};

const handleLastNameChange = (name: string) => {
  setLastName(name);
  setFullName(`${firstName} ${name}`); // ❌ must sync manually
};

// Total from items array stored separately
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0); // ❌ duplicate state

const handleAddItem = (item: Item) => {
  const newItems = [...items, item];
  setItems(newItems);
  setTotal(newItems.reduce((sum, i) => sum + i.price, 0)); // ❌ manual sync
};

// Filtered list stored as state
const [allItems, setAllItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);
const [searchText, setSearchText] = useState('');

const handleSearch = (text: string) => {
  setSearchText(text);
  // ❌ Must manually keep in sync
  setFilteredItems(
    allItems.filter(item =>
      item.name.toLowerCase().includes(text.toLowerCase())
    )
  );
};
```

### ✅ Correct

```tsx
import { useState, useMemo } from 'react';

// Calculate derived values instead of storing
const [firstName, setFirstName] = useState('John');
const [lastName, setLastName] = useState('Doe');

// fullName calculated, not stored
const fullName = `${firstName} ${lastName}`;

// Or with useMemo for expensive calculations
const fullName = useMemo(
  () => `${firstName} ${lastName}`,
  [firstName, lastName]
);

// Total calculated from items
const [items, setItems] = useState<Item[]>([]);

const total = useMemo(
  () => items.reduce((sum, item) => sum + item.price, 0),
  [items]
);

const handleAddItem = (item: Item) => {
  setItems([...items, item]);
  // ✅ total automatically updated
};

// Filtered list as derived value
const [allItems, setAllItems] = useState<Item[]>([]);
const [searchText, setSearchText] = useState('');

const filteredItems = useMemo(
  () =>
    allItems.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    ),
  [allItems, searchText]
);

const handleSearch = (text: string) => {
  setSearchText(text);
  // ✅ filteredItems automatically updated via useMemo
};

// Count derived from array
const [items, setItems] = useState<Item[]>([]);

const itemCount = useMemo(() => items.length, [items]);
// Or simply: const itemCount = items.length;

// UI state derived from data
const [receipts, setReceipts] = useState<Receipt[]>([]);

// Is empty state calculated
const isEmpty = useMemo(() => receipts.length === 0, [receipts]);

// No UI state for "isLoading" if you can track it from data
const [data, setData] = useState<Data | null>(null);
const [error, setError] = useState<Error | null>(null);

// isLoading derived from data and error state
const isLoading = useMemo(
  () => data === null && error === null,
  [data, error]
);
```

### Why Medium?

- **Duplicate state leads to sync bugs** → inconsistent UI
- **Single source of truth is reliable** → easier to debug
- **Calculated values auto-update** → less code, fewer bugs
- **Performance is better** → fewer state updates

### When to Use useMemo

```tsx
// ✅ Use useMemo for:
// 1. Expensive calculations
const sortedItems = useMemo(
  () => items.sort((a, b) => a.price - b.price),
  [items]
);

// 2. Filtering large lists
const filteredItems = useMemo(
  () => items.filter(item => item.amount > 100),
  [items]
);

// 3. Object creation for comparisons
const filterConfig = useMemo(
  () => ({ category: selectedCategory, minAmount: 50 }),
  [selectedCategory]
);

// ❌ Don't use useMemo for:
// Simple calculations
const fullName = `${firstName} ${lastName}`; // ✅ No useMemo needed

// Simple filter on small lists
const isSelected = items.some(i => i.id === selectedId); // ✅ No useMemo
```

---

## Rule 2: useState Updater Functions (For Complex State Changes)

### ❌ Incorrect

```tsx
import { useState } from 'react';

const [count, setCount] = useState(0);

// Reading state immediately after update (race condition)
const handleIncrement = () => {
  setCount(count + 1);
  console.log(count); // ❌ logs old value!
};

// Multiple state updates with same value
const [items, setItems] = useState<Item[]>([]);

const handleAddItem = (item: Item) => {
  // Depends on current items
  const newItems = [...items, item];
  setItems(newItems);

  // If called rapidly, might not have latest items
};

// Complex state calculation
const [formData, setFormData] = useState({
  name: '',
  email: '',
  category: '',
});

const handleInputChange = (field: string, value: string) => {
  // Must read current state
  const current = formData;
  current[field as keyof typeof formData] = value;
  setFormData(current); // ❌ Mutating state directly
};
```

### ✅ Correct

```tsx
import { useState, useCallback } from 'react';

const [count, setCount] = useState(0);

// Use updater function to get latest state
const handleIncrement = () => {
  setCount(prevCount => prevCount + 1);
  // ✅ Will always use latest count
};

// Updater function with guaranteed latest state
const [items, setItems] = useState<Item[]>([]);

const handleAddItem = useCallback((item: Item) => {
  setItems(prevItems => [...prevItems, item]);
  // ✅ Always adds to latest items
}, []);

// Complex state with reducer pattern
interface FormData {
  name: string;
  email: string;
  category: string;
}

const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
  category: '',
});

const handleInputChange = useCallback(
  (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  },
  []
);

// Or use useReducer for complex state
import { useReducer } from 'react';

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormData; value: string }
  | { type: 'RESET' };

const formReducer = (state: FormData, action: FormAction): FormData => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { name: '', email: '', category: '' };
    default:
      return state;
  }
};

const [formData, dispatch] = useReducer(formReducer, {
  name: '',
  email: '',
  category: '',
});

const handleInputChange = useCallback(
  (field: keyof FormData, value: string) => {
    dispatch({ type: 'SET_FIELD', field, value });
  },
  []
);

// Async state with updater function
const [data, setData] = useState<Data | null>(null);

const handleLoad = async () => {
  const newData = await fetchData();
  setData(prevData => ({
    ...prevData,
    ...newData, // merge with previous
  }));
};
```

### Why Medium?

- **Updater functions guarantee latest state** → no race conditions
- **Prevents bugs with rapid state changes** → reliable behavior
- **Better for derived state changes** → consistent updates

### useState vs useReducer

```tsx
// Use useState for simple state
const [count, setCount] = useState(0);
const [name, setName] = useState('');

// Use useReducer for complex state with related fields
const [state, dispatch] = useReducer(reducer, initialState);

// useReducer benefits:
// 1. Multiple related fields
// 2. Complex update logic
// 3. Testing (pure function)
// 4. Debugging (action history)
```

---

## Rule 3: Single Source of Truth (Lift State Up)

### ❌ Incorrect

```tsx
// Item component with own state
const ItemCard = ({ item }: { item: Item }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handlePress = () => {
    setIsSelected(!isSelected);
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={{ opacity: isSelected ? 1 : 0.5 }}>
        {item.name}
      </Text>
    </Pressable>
  );
};

// Parent doesn't know which items are selected
const ItemList = ({ items }: { items: Item[] }) => {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemCard item={item} />}
    />
  );
};

// Cannot perform bulk operations
const handleDeleteSelected = () => {
  // ❌ No way to know which items are selected
};

// Checkbox state scattered across components
const ReceiptList = () => {
  return (
    <View>
      {receipts.map(receipt => (
        <ReceiptCheckbox key={receipt.id} receipt={receipt} />
        // ❌ Each checkbox has own state
      ))}
    </View>
  );
};
```

### ✅ Correct

```tsx
// Lift selection state to parent
interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ItemCard = ({ item, isSelected, onSelect }: ItemCardProps) => {
  const handlePress = () => {
    onSelect(item.id);
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={{ opacity: isSelected ? 1 : 0.5 }}>
        {item.name}
      </Text>
    </Pressable>
  );
};

// Parent controls selection
const ItemList = ({ items }: { items: Item[] }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const newItems = items.filter(
      item => !selectedIds.includes(item.id)
    );
    // Delete selected items
  }, [items, selectedIds]);

  return (
    <View>
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            isSelected={selectedIds.includes(item.id)}
            onSelect={handleSelect}
          />
        )}
      />
      {selectedIds.length > 0 && (
        <Button title="Delete Selected" onPress={handleDeleteSelected} />
      )}
    </View>
  );
};

// Context for deeply nested components
import { createContext, useContext } from 'react';

interface SelectionContextType {
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

const SelectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(existingId => existingId !== id)
        : [...prev, id]
    );
  }, []);

  return (
    <SelectionContext.Provider value={{ selectedIds, onSelect: handleSelect }}>
      {children}
    </SelectionContext.Provider>
  );
};

const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used inside SelectionProvider');
  }
  return context;
};

// Use in deeply nested component
const ItemCard = ({ item }: { item: Item }) => {
  const { selectedIds, onSelect } = useSelection();

  return (
    <ItemCard
      isSelected={selectedIds.includes(item.id)}
      onSelect={onSelect}
    />
  );
};
```

### Why Medium?

- **Single source of truth prevents sync bugs** → one place to update
- **Parent controls state enables coordination** → bulk operations possible
- **Easier to test** → pass selection state as props
- **Context avoids prop drilling** → cleaner code

### State Location Guidelines

```tsx
// ✅ Local component state (UI-only)
const [isExpanded, setIsExpanded] = useState(false);

// ✅ Parent state (used by siblings)
const [selectedId, setSelectedId] = useState<string | null>(null);
// Pass to children via props

// ✅ Context (deeply nested, shared across tree)
const [theme, setTheme] = useContext(ThemeContext);

// ❌ Avoid: same state in multiple components
// Instead: lift to parent or use context
```

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| `const [total, setTotal] = useState(...)` computed from `items` | Remove, use `useMemo` or direct calculation |
| `const [filtered, setFiltered] = useState(...)` from `const [items, ...]` | Use `useMemo(() => items.filter(...), [items])` |
| `setCount(count + 1)` | Change to `setCount(prev => prev + 1)` |
| Multiple `useState` for related fields | Use `useReducer` |
| State duplicated across multiple components | Lift to parent or use Context |
| Child component has state needed by parent | Lift to parent, pass as props |

---

## References

- [React useState Hook](https://react.dev/reference/react/useState)
- [useMemo Hook](https://react.dev/reference/react/useMemo)
- [useReducer Hook](https://react.dev/reference/react/useReducer)
- [Lifting State Up](https://react.dev/learn/sharing-state-between-components)
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
