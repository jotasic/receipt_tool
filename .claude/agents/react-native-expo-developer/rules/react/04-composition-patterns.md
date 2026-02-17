# Composition Patterns (HIGH)

**Bad composition breeds complexity. This rule enforces clean, composable design.**

---

## Rule 1: Avoid Boolean Prop Proliferation

Boolean props create combinatorial explosion. Use composition instead.

### ❌ Incorrect (Prop Hell)

```tsx
// ❌ Each boolean = 2x complexity
function Button({
  variant,
  size,
  isLoading,
  isDisabled,
  hasBorder,
  isFullWidth,
  hasShadow,
  isRounded,
  // ... 20 more boolean props
}) {
  return (
    <TouchableOpacity
      disabled={isDisabled || isLoading}
      style={{
        width: isFullWidth ? '100%' : 'auto',
        borderRadius: isRounded ? 8 : 0,
        // ...many conditions...
        boxShadow: hasShadow ? '0 2px 4px' : 'none',
        borderWidth: hasBorder ? 1 : 0,
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading && <ActivityIndicator />}
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}

// Usage: Endless combinations to read/maintain
<Button isLoading isDisabled hasBorder isFullWidth hasShadow isRounded>
  Click me
</Button>

// Problem: 2^N combinations, hard to test, hard to read
```

### ✅ Correct (Composition)

```tsx
// ✅ Compose functionality with sub-components
function Button({ variant = 'default', size = 'md', children, ...props }) {
  return (
    <TouchableOpacity
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

// ✅ Sub-components for complex behavior
function ButtonWithLoading({ isLoading, children, ...props }) {
  return (
    <Button {...props} disabled={isLoading}>
      {isLoading && <ActivityIndicator style={{ marginRight: 8 }} />}
      {children}
    </Button>
  );
}

// ✅ Sub-components for styling
function PrimaryButton({ children, ...props }) {
  return <Button variant="primary" {...props}>{children}</Button>;
}

// ✅ Compose together
<PrimaryButton size="lg">
  {isLoading && <ActivityIndicator />}
  Click me
</PrimaryButton>

// Problem solved: Explicit, readable, composable
```

### Pattern: The Composition Hierarchy

```tsx
// Base component (minimal)
function Button({ children, ...props }) {
  return <TouchableOpacity {...props}>{children}</TouchableOpacity>;
}

// Variant components (specific use)
function PrimaryButton(props) {
  return <Button className="bg-blue" {...props} />;
}

function DangerButton(props) {
  return <Button className="bg-red" {...props} />;
}

// Feature variants
function LoadingButton({ isLoading, ...props }) {
  return <Button {...props}>{isLoading && <Spinner />}</Button>;
}

// Combine: Variants + Features
function PrimaryLoadingButton(props) {
  return <LoadingButton variant="primary" {...props} />;
}
```

---

## Rule 2: Compound Components Pattern

When components are tightly coupled, use compound components (render as children).

### ❌ Incorrect (Prop Drilling)

```tsx
// ❌ Props scattered everywhere
function Dialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDangerous,
}) {
  return (
    <Modal visible={isOpen}>
      <View className="bg-white p-4">
        <Text className="text-lg font-bold">{title}</Text>
        <Text className="text-gray-600">{description}</Text>

        <View className="flex-row gap-2">
          <Button
            onPress={onCancel}
            variant={isDangerous ? 'secondary' : 'default'}
          >
            {cancelText}
          </Button>
          <Button
            onPress={onConfirm}
            variant={isDangerous ? 'danger' : 'primary'}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

// Usage: Hard to see structure
<Dialog
  isOpen={open}
  title="Delete?"
  description="This cannot be undone"
  onConfirm={handleDelete}
  onCancel={handleCancel}
  confirmText="Delete"
  cancelText="Keep"
  isDangerous={true}
/>
```

### ✅ Correct (Compound Components)

```tsx
// ✅ Compound pattern: composable structure
function Dialog({ children, isOpen }) {
  return (
    <Modal visible={isOpen}>
      <View className="bg-white p-4">
        {children}
      </View>
    </Modal>
  );
}

function DialogTitle({ children }) {
  return <Text className="text-lg font-bold">{children}</Text>;
}

function DialogDescription({ children }) {
  return <Text className="text-gray-600">{children}</Text>;
}

function DialogActions({ children }) {
  return <View className="flex-row gap-2">{children}</View>;
}

// Usage: Clear structure, self-documenting
<Dialog isOpen={open}>
  <DialogTitle>Delete?</DialogTitle>
  <DialogDescription>This cannot be undone</DialogDescription>
  <DialogActions>
    <Button onPress={handleCancel} variant="secondary">
      Keep
    </Button>
    <Button onPress={handleDelete} variant="danger">
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

### Pattern: Sharing State in Compound Components

```tsx
// ✅ Parent manages state, children access via context
const DialogContext = createContext<{
  isOpen: boolean;
  isDangerous?: boolean;
} | null>(null);

function Dialog({ children, isOpen, isDangerous = false }) {
  return (
    <DialogContext.Provider value={{ isOpen, isDangerous }}>
      <Modal visible={isOpen}>
        <View className="bg-white p-4">
          {children}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

function DialogActions({ children }) {
  const context = useContext(DialogContext);

  return (
    <View className="flex-row gap-2">
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          variant: context?.isDangerous ? 'danger' : 'primary',
        })
      )}
    </View>
  );
}
```

---

## Rule 3: Children Composition Over Render Props

Prefer `children` for simple cases, `render props` for advanced cases.

### ❌ Incorrect (Over-complicated)

```tsx
// ❌ Render prop when children work fine
function DataFetcher({
  url,
  render,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [url]);

  return render(data, loading);
}

// Usage: Confusing nested functions
<DataFetcher
  url="/api/users"
  render={(data, loading) => (
    <>
      {loading && <Spinner />}
      {data && <UserList users={data} />}
    </>
  )}
/>
```

### ✅ Correct (Children)

```tsx
// ✅ Children composition for better readability
function DataFetcher({ url, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [url]);

  return (
    // Pass data to children as props
    <>
      {typeof children === 'function' ? children(data, loading) : children}
    </>
  );
}

// Usage: Clearer structure
<DataFetcher url="/api/users">
  {(data, loading) => (
    <>
      {loading && <Spinner />}
      {data && <UserList users={data} />}
    </>
  )}
</DataFetcher>

// Or static children
<DataFetcher url="/api/users">
  <UserList />
</DataFetcher>
```

### When to Use Each

```tsx
// ✅ Use children for normal rendering
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>

// ✅ Use render props when you need render-time logic
<Query query={QUERY}>
  {(data, loading, error) => (
    // Complex logic based on data
  )}
</Query>

// ❌ Don't mix both
<Component render={(x) => <div>{x}</div>}>
  This is confusing
</Component>
```

---

## Rule 4: State/UI Separation

Keep state logic separate from UI. Use hooks to extract behavior.

### ❌ Incorrect (Mixed Logic)

```tsx
// ❌ State logic mixed with UI
function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation logic
    const newErrors = {};
    if (!name) newErrors.name = 'Required';
    if (!email.includes('@')) newErrors.email = 'Invalid';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    // Submission logic
    setIsSubmitting(true);
    try {
      await api.createUser({ name, email, password });
      // Success handling
    } catch (err) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hard to test, hard to reuse
  return (
    <View>
      <Input value={name} onChangeText={setName} />
      {errors.name && <Text className="text-red">{errors.name}</Text>}
      {/* More inputs... */}
      <Button onPress={handleSubmit}>Submit</Button>
    </View>
  );
}
```

### ✅ Correct (Separated)

```tsx
// ✅ Extract form logic to hook
function useUserForm(onSuccess) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (data) => {
    const newErrors = {};
    if (!data.name) newErrors.name = 'Required';
    if (!data.email.includes('@')) newErrors.email = 'Invalid';
    return newErrors;
  };

  const submit = async () => {
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await api.createUser(formData);
      onSuccess?.();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    submit,
  };
}

// ✅ UI component stays simple
function UserForm({ onSuccess }) {
  const form = useUserForm(onSuccess);

  return (
    <View>
      <Input
        value={form.formData.name}
        onChangeText={(text) =>
          form.setFormData({ ...form.formData, name: text })
        }
      />
      {form.errors.name && <Text className="text-red">{form.errors.name}</Text>}
      <Button onPress={form.submit} disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </View>
  );
}

// ✅ Reuse logic in other components
function AdminUserForm() {
  const form = useUserForm(() => navigation.goBack());
  // Different UI, same logic
}
```

---

## Composition Checklist

When reviewing code, look for:

- [ ] Components with 5+ boolean props (use composition)
- [ ] Prop drilling 3+ levels (use compound components or context)
- [ ] Inconsistent patterns for similar features (standardize)
- [ ] State and UI mixed together (extract to hooks)
- [ ] Complex components (break into smaller composable pieces)

---

## References

- [React: Composition vs Inheritance](https://react.dev/learn/thinking-in-react)
- [Advanced Patterns: Compound Components](https://epic-react-com.vercel.app/)
- [Custom Hooks: Code Reuse](https://react.dev/learn/reusing-logic-with-custom-hooks)
