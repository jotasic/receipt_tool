# Rendering Rules (CRITICAL)

**Essential rules to prevent app crashes and runtime errors**

---

## Rule 1: && Operator Forbidden (Falsy Rendering Prevention)

### ❌ Incorrect

```tsx
// When count=0, renders "0" on screen → crash
{count && <Text>{count} items</Text>}

// When data.length=0, renders "0"
{data.length && <List data={data} />}

// When isEmpty=false, renders "false"
{isEmpty && <EmptyState />}
```

### ✅ Correct

```tsx
// Ternary operator
{count ? <Text>{count} items</Text> : null}

// Explicit comparison
{count > 0 && <Text>{count} items</Text>}

// Boolean coercion
{!!count && <Text>{count} items</Text>}

// Length check
{data.length > 0 && <List data={data} />}
```

### Why Critical?

React Native renders `0`, `false`, `NaN` as strings → **App crash**

---

## Rule 2: Text Component Wrapping Required

### ❌ Incorrect

```tsx
// View cannot have string as direct child
<View>Hello World</View>

<View>{userName}</View>

<View>
  Welcome
</View>
```

### ✅ Correct

```tsx
<View>
  <Text>Hello World</Text>
</View>

<View>
  <Text>{userName}</Text>
</View>

<View>
  <Text className="text-gray-900 dark:text-gray-100">
    Welcome
  </Text>
</View>
```

### Why Critical?

React Native requires **all text to be wrapped in `<Text>` component**. Violation causes **runtime error**.

---

## Auto-Fix Patterns

When reviewing code, immediately fix:

| Pattern | Fix |
|---------|-----|
| `count && <Component>` | `count ? <Component> : null` |
| `data.length && <Component>` | `data.length > 0 && <Component>` |
| `<View>text</View>` | `<View><Text>text</Text></View>` |
| `<View>{variable}</View>` | `<View><Text>{variable}</Text></View>` |

---

## References

- [React Native Text Component](https://reactnative.dev/docs/text)
- [Conditional Rendering](https://react.dev/learn/conditional-rendering)
