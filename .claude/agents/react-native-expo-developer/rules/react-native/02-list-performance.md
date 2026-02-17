# List Performance Rules (HIGH)

**Essential rules for performant lists and preventing scroll jank**

---

## Rule 1: renderItem Inline Objects/Functions Forbidden

### ❌ Incorrect

```tsx
// Creates new function on every render → re-renders all items
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>

// Inline object styles → creates new object each render
<FlatList
  data={items}
  renderItem={({ item }) => (
    <View style={{ padding: 10, backgroundColor: 'white' }}>
      <Text>{item.name}</Text>
    </View>
  )}
/>

// Inline numColumns → unnecessary re-renders
<FlatList
  data={items}
  numColumns={2}
  renderItem={({ item }) => <ItemCard item={item} />}
/>
```

### ✅ Correct

```tsx
// Extract renderItem outside component
const renderItem = ({ item }: { item: Item }) => (
  <ItemCard item={item} />
);

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>

// Memoize if needed
const renderItem = useCallback(
  ({ item }: { item: Item }) => <ItemCard item={item} />,
  []
);

// Use NativeWind for styles (no object creation)
<FlatList
  data={items}
  renderItem={({ item }) => (
    <View className="p-2.5 bg-white dark:bg-gray-900">
      <Text>{item.name}</Text>
    </View>
  )}
/>

// Memoize numColumns if dynamic
const numColumns = useMemo(() => (
  isPortrait ? 2 : 3
), [isPortrait]);

<FlatList
  data={items}
  numColumns={numColumns}
  renderItem={renderItem}
/>
```

### Why High?

- **Inline functions are recreated on every render** → triggers re-render of ALL items
- **Inline objects break React.memo** → even with memoized ItemCard, parent causes re-renders
- **Result: Janky scrolling, battery drain, UI lag**

---

## Rule 2: keyExtractor Stability (Never Use Index)

### ❌ Incorrect

```tsx
// Index as key when list can change → causes bugs
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item, index) => index.toString()}
/>

// Non-stable keys (changes between renders)
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => Math.random().toString()}
/>

// Composite unstable keys
<FlatList
  data={items}
  keyExtractor={(item) => `${item.name}-${Math.random()}`}
/>
```

### ✅ Correct

```tsx
// Use unique, stable identifier
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>

// If no ID, create stable composite key
<FlatList
  data={items}
  keyExtractor={(item) => `${item.categoryId}-${item.timestamp}`}
/>

// Memoize keyExtractor function
const keyExtractor = useCallback(
  (item: Item) => item.id,
  []
);

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
/>
```

### Why High?

- **Index keys break state preservation** → items reorder → state gets mixed
- **Causes bugs when filtering, sorting, or deleting items**
- **React cannot track item identity → wrong animations, cached data**

---

## Rule 3: FlashList for Large Lists (1000+ Items)

### ❌ Incorrect

```tsx
// FlatList with 5000 items → jank, memory issues
<FlatList
  data={largeDataset} // 5000+ items
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>

// No virtualization optimization
<ScrollView>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</ScrollView>
```

### ✅ Correct

```tsx
// Install: npm install react-native-flash-list
import { FlashList } from 'react-native-flash-list';

// For 1000+ items, use FlashList
<FlashList
  data={largeDataset}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}
  numColumns={2}
/>

// FlatList is fine for < 1000 items
<FlatList
  data={items} // < 1000 items
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  maxToRenderPerBatch={30}
  updateCellsBatchingPeriod={50}
/>
```

### Why High?

- **FlatList struggles with 1000+ items** → memory leak, janky scrolling
- **FlashList is optimized for large lists** → 60fps guaranteed
- **estimatedItemSize improves performance** → better recycling

### Setup

```bash
npm install react-native-flash-list
# Restart Expo
```

---

## Rule 4: Item Component Optimization (React.memo Required)

### ❌ Incorrect

```tsx
// ItemCard re-renders on every parent render
const ItemCard = ({ item }: { item: Item }) => (
  <View className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
    <Text className="font-semibold text-gray-900 dark:text-gray-100">
      {item.name}
    </Text>
    <Text className="text-gray-500">{item.amount}</Text>
  </View>
);

<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
/>
```

### ✅ Correct

```tsx
// Memoize item component
const ItemCard = React.memo(
  ({ item }: { item: Item }) => (
    <View className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <Text className="font-semibold text-gray-900 dark:text-gray-100">
        {item.name}
      </Text>
      <Text className="text-gray-500">{item.amount}</Text>
    </View>
  ),
  (prevProps, nextProps) => prevProps.item.id === nextProps.item.id
);

// With callbacks, memoize them
const ItemCard = React.memo(
  ({ item, onDelete }: { item: Item; onDelete: (id: string) => void }) => (
    <Pressable onPress={() => onDelete(item.id)}>
      <Text>{item.name}</Text>
    </Pressable>
  )
);

// In parent, memoize callback
const handleDelete = useCallback(
  (id: string) => {
    setItems(items.filter(i => i.id !== id));
  },
  [items]
);

<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} onDelete={handleDelete} />}
/>
```

### Why High?

- **Without memoization, every list re-render triggers all item re-renders**
- **React.memo prevents unnecessary renders** if props unchanged
- **Critical for smooth scrolling performance**

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| `renderItem={() => <Component />}` | Extract to `const renderItem = ...` outside |
| `keyExtractor={(item, index) => index}` | `keyExtractor={(item) => item.id}` |
| `FlatList` with 1000+ items | Switch to `FlashList` with `estimatedItemSize` |
| `<View>` in renderItem without memo | Wrap in `React.memo(...)` |
| `onPress={() => handleClick(item.id)}` in renderItem | Use `useCallback` for handler |

---

## References

- [React Native FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [React.memo](https://react.dev/reference/react/memo)
- [Flash List (React Native)](https://shopify.github.io/flash-list/)
