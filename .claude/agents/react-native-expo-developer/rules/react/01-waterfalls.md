# Eliminating Waterfalls (CRITICAL)

**Sequential async operations kill performance. This rule prevents waterfalls.**

---

## Rule 1: Defer await Until Needed

Avoid awaiting in sequence when operations are independent. Calculate dependencies first, then await together.

### ❌ Incorrect (Waterfall)

```typescript
// Each fetch waits for the previous one → 3 seconds total
async function loadUserData(userId: string) {
  const user = await fetchUser(userId);  // 1s
  const posts = await fetchUserPosts(user.id);  // 1s (blocked)
  const comments = await fetchComments(user.id);  // 1s (blocked)

  return { user, posts, comments };  // Total: 3s
}
```

### ✅ Correct (Parallel)

```typescript
// All fetches run in parallel → 1 second total
async function loadUserData(userId: string) {
  const user = await fetchUser(userId);  // 1s

  // Start independent fetches together
  const [posts, comments] = await Promise.all([
    fetchUserPosts(user.id),  // 1s (parallel)
    fetchComments(user.id),   // 1s (parallel)
  ]);

  return { user, posts, comments };  // Total: 1s
}
```

### Why Critical?

**Waterfalls multiply load times.** N sequential 1-second operations = N seconds. Same operations in parallel = 1 second.

---

## Rule 2: Promise.all() for Independent Operations

When operations don't depend on each other, start them simultaneously.

### ❌ Incorrect (Sequential)

```tsx
async function Dashboard() {
  const analytics = await fetchAnalytics();  // 1s
  const revenue = await fetchRevenue();  // 1s (blocked)
  const users = await fetchUserCount();  // 1s (blocked)

  return <DashboardView analytics={analytics} revenue={revenue} users={users} />;
  // Total: 3s
}
```

### ✅ Correct (Parallel)

```tsx
async function Dashboard() {
  const [analytics, revenue, users] = await Promise.all([
    fetchAnalytics(),
    fetchRevenue(),
    fetchUserCount(),
  ]);

  return <DashboardView analytics={analytics} revenue={revenue} users={users} />;
  // Total: 1s (assuming same backend latency)
}
```

### Pattern: Identify Dependencies

```typescript
// ✅ No dependencies → use Promise.all()
const [user, settings, notifications] = await Promise.all([
  fetchUser(),
  fetchSettings(),
  fetchNotifications(),
]);

// ⚠️ Has dependency → chain correctly
const user = await fetchUser();  // Need user ID first
const [posts, followers] = await Promise.all([
  fetchUserPosts(user.id),  // Now parallel
  fetchUserFollowers(user.id),
]);
```

---

## Rule 3: Strategic Suspense Boundaries

Use Suspense to hide waterfalls by rendering partial UI while fetching non-critical data.

### ❌ Incorrect (All or Nothing)

```tsx
// Everything waits for slowest fetch
async function UserProfile() {
  const [user, timeline, recommendations] = await Promise.all([
    fetchUser(),  // 200ms
    fetchTimeline(),  // 3s ← blocks everything
    fetchRecommendations(),  // 2s ← blocks everything
  ]);

  return <Profile user={user} timeline={timeline} recommendations={recommendations} />;
  // User sees blank screen for 3 seconds
}
```

### ✅ Correct (Progressive Loading)

```tsx
// Core content loads first, secondary content streams in
async function UserProfile() {
  const user = await fetchUser();  // 200ms - critical path

  return (
    <Profile user={user}>
      {/* User profile renders immediately */}

      {/* Timeline loads independently */}
      <Suspense fallback={<TimelineSkeleton />}>
        <UserTimeline userId={user.id} />
      </Suspense>

      {/* Recommendations load independently */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendationsFeed userId={user.id} />
      </Suspense>
    </Profile>
  );
}

// These fetch independently
async function UserTimeline({ userId }: { userId: string }) {
  const timeline = await fetchTimeline(userId);
  return <Timeline data={timeline} />;
}

async function RecommendationsFeed({ userId }: { userId: string }) {
  const recommendations = await fetchRecommendations(userId);
  return <Feed data={recommendations} />;
}
```

### Pattern: Critical vs Non-Critical

```tsx
// ✅ Load critical path first, then secondary
export async function Page() {
  // Must have data to render
  const criticalData = await fetchCritical();

  return (
    <>
      <Header data={criticalData} />

      {/* Nice to have, can load async */}
      <Suspense fallback={<Skeleton />}>
        <SecondarySection />
      </Suspense>
    </>
  );
}
```

---

## Rule 4: Avoid Cascading Dependencies

When operations have dependencies, flatten the chain where possible.

### ❌ Incorrect (Cascading)

```typescript
async function checkoutFlow() {
  const user = await fetchUser();  // 1s
  const cart = await fetchCart(user.id);  // 1s (blocked)
  const address = await fetchAddress(user.id);  // 1s (blocked)
  const shipping = await calculateShipping(address);  // 1s (blocked)

  return { user, cart, address, shipping };  // Total: 4s
}
```

### ✅ Correct (Flattened)

```typescript
async function checkoutFlow() {
  const user = await fetchUser();  // 1s

  // cart and address don't depend on each other
  const [cart, address] = await Promise.all([
    fetchCart(user.id),  // 1s (parallel)
    fetchAddress(user.id),  // 1s (parallel)
  ]);

  const shipping = await calculateShipping(address);  // 1s

  return { user, cart, address, shipping };  // Total: 3s (saved 1s)
}
```

---

## Detection Checklist

When reviewing code, look for:

- [ ] Multiple `await` statements in sequence without data dependencies
- [ ] Async operations that could run in parallel
- [ ] All data blocking UI rendering (move to Suspense)
- [ ] Missing `Promise.all()` when available

---

## References

- [Web.dev: Eliminating Waterfalls](https://web.dev/vitals-tools-crux-api/)
- [React: Use() Hook for Sequential Data](https://react.dev/reference/react/use)
- [Promise.all() Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
