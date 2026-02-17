# Pipeline Handoff — Picnic Shopping Integration

## Task Description
Integrate Picnic grocery delivery API into the family app:
1. Picnic product search from the boodschappen page
2. Add products to Picnic cart (with confirmation)
3. Add meal ingredients to Picnic cart from maaltijden/weekmenu pages (with approval)

## Stage 1: Test Writer
- Files created:
  - `src/lib/validation.picnic.test.ts` — Zod schema tests for picnicLoginSchema, picnicSearchSchema, picnicCartAddSchema
  - `src/app/api/picnic/login/route.test.ts` — POST login: auth, validation, success, failure
  - `src/app/api/picnic/search/route.test.ts` — GET search: auth, query validation, no-connection, results
  - `src/app/api/picnic/cart/route.test.ts` — GET/POST/DELETE cart: auth, validation, no-connection
  - `src/app/api/picnic/status/route.test.ts` — GET/DELETE status: auth, connected/disconnected states
  - `src/hooks/usePicnic.test.ts` — Hook tests: loading, status, login, search, addToCart, disconnect
  - `src/components/PicnicLogin.test.tsx` — Login form render, submit, error, loading states
  - `src/components/PicnicSearch.test.tsx` — Search input, results display, add to cart, empty state
  - `src/components/PicnicAddToCartModal.test.tsx` — Ingredient list, search results, select, confirm, cancel
- Test count: 38 tests across 12 describe blocks (all 9 files, 12 individual test failures)
- Coverage: Auth checks, validation, Picnic connection status, search, cart CRUD, UI components, error states

## Stage 3: Performance Review

### Critical (must fix)
_(none)_

### Warnings (should fix)

- **Missing debounce on search input**: `src/components/PicnicSearch.tsx:38` — Every keystroke does not trigger a search (it uses form submit), but the `PicnicAddToCartModal` fires `onSearch` for every ingredient in a tight `useEffect` loop without throttling. If a meal has 15 ingredients, this fires 15 concurrent API calls to Picnic simultaneously, which may trigger rate limiting.
  ```tsx
  // src/components/PicnicAddToCartModal.tsx:26-33 — Add a small stagger/queue
  useEffect(() => {
    let cancelled = false;
    async function searchAll() {
      for (const ingredient of ingredients) {
        if (cancelled) break;
        if (!searchedIngredients.has(ingredient) && !searchResults[ingredient]) {
          setSearchedIngredients((prev) => new Set(prev).add(ingredient));
          await onSearch(ingredient); // sequential instead of parallel fire-and-forget
        }
      }
    }
    searchAll();
    return () => { cancelled = true; };
  }, [ingredients, searchResults, searchedIngredients, onSearch]);
  ```

- **Potential infinite re-render loop in PicnicAddToCartModal useEffect**: `src/components/PicnicAddToCartModal.tsx:26-33` — `searchedIngredients` is listed as a dependency but is also mutated inside the effect via `setSearchedIngredients`. Additionally `searchResults` (an object) will be a new reference each time the parent re-renders from `setPicnicSearchResults`, causing the effect to re-run. This can cause repeated API calls. Fix: remove `searchedIngredients` and `searchResults` from the dependency array and use refs, or move to an event-driven approach.
  ```tsx
  // Use a ref to track what has been searched:
  const searchedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const ingredient of ingredients) {
      if (!searchedRef.current.has(ingredient)) {
        searchedRef.current.add(ingredient);
        onSearch(ingredient);
      }
    }
  }, [ingredients, onSearch]);
  ```

- **Sequential cart additions in handlePicnicConfirm**: `src/app/maaltijden/page.tsx:58-60` — Adding items to cart is done sequentially in a `for...of` loop. If 10 items are selected, the user waits for 10 serial network round-trips. Use `Promise.all` (or `Promise.allSettled` for resilience).
  ```tsx
  await Promise.allSettled(
    selections.map((sel) => addToCart(sel.productId, sel.count))
  );
  ```

- **No pagination on search results**: `src/app/api/picnic/search/route.ts:50` — The entire `results` array from the Picnic API is mapped and returned without any limit. If the Picnic API returns hundreds of results, this generates a large JSON response. Add a `.slice(0, 20)` or similar cap.
  ```tsx
  const products = results.slice(0, 20).map((item) => ({
  ```

### Suggestions

- **Timer cleanup on unmount**: `src/app/boodschappen/page.tsx:54,57` — `setTimeout` calls for `setCartMessage(null)` are not cleaned up on unmount. If the component unmounts before 3s, this causes a setState-on-unmounted-component warning. Store the timer ID in a ref and clear it on unmount or on the next message.

- **`picnic-client.ts` creates a new instance per request**: `src/lib/picnic-client.ts:3` — Every API call creates a fresh `PicnicApi` instance. This is fine for stateless requests but prevents connection reuse. Consider caching instances per authKey if the library supports it, though this is low priority since these are serverless functions.

**Total: 0 critical, 4 warnings, 2 suggestions**

---

## Stage 4: Security Review

### Critical (must fix before merge)

- **SEC-01: Picnic authKey stored in plain text in Firestore**: `src/app/api/picnic/login/route.ts:47-52` — The Picnic `authKey` (an authentication token equivalent to a session credential) is stored unencrypted in the `picnic_connections` collection. Any Firestore data breach exposes all connected Picnic accounts. **OWASP A02:2021 – Cryptographic Failures**.
  - **Remediation**: Encrypt the authKey at rest using AES-256-GCM with a key from an environment variable before storing, and decrypt on retrieval:
  ```ts
  // src/lib/encryption.ts
  import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

  const ENCRYPTION_KEY = process.env.PICNIC_ENCRYPTION_KEY!; // 32-byte hex key
  const key = Buffer.from(ENCRYPTION_KEY, "hex");

  export function encrypt(text: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
  }

  export function decrypt(data: string): string {
    const [ivHex, tagHex, encHex] = data.split(":");
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return decipher.update(Buffer.from(encHex, "hex")) + decipher.final("utf8");
  }
  ```

### High (should fix before merge)

- **SEC-02: No authKey expiry or rotation**: `src/app/api/picnic/login/route.ts:47-52` — The Picnic authKey is stored indefinitely with no TTL or expiration check. If the key is compromised or the user changes their Picnic password, the stored key remains active. Add a `connectedAt` timestamp (already present) and check staleness, or add an `expiresAt` field.

- **SEC-03: Error swallowing hides auth failures on Picnic API calls**: `src/app/api/picnic/search/route.ts:65-69`, `src/app/api/picnic/cart/route.ts:60-64,107-111,154-158` — When the Picnic API returns a 401 (expired/invalid authKey), the generic catch returns a 500 error to the client instead of detecting the auth failure and clearing the stale connection. This leaves a broken connection in place.
  ```ts
  } catch (err: unknown) {
    // Check if the Picnic authKey is expired/invalid
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 401) {
      await adminDb.collection("picnic_connections").doc(user.familyId).delete();
      return NextResponse.json({ message: "Picnic sessie verlopen, log opnieuw in" }, { status: 401 });
    }
    return NextResponse.json({ message: "Zoeken mislukt" }, { status: 500 });
  }
  ```

- **SEC-04: Password briefly in server memory, not zeroed**: `src/app/api/picnic/login/route.ts:33` — The Picnic password is destructured and passed to `picnicClient.login()`. It remains in memory until garbage collected. This is low risk in serverless (short-lived processes) but worth noting. No practical fix in JS — informational.

### Medium

- **SEC-05: No rate limiting on login endpoint**: `src/app/api/picnic/login/route.ts:7` — The Picnic login endpoint has no rate limiting. An attacker with a valid app session could brute-force Picnic credentials via this proxy. Add rate limiting (e.g., per-user, max 5 attempts per minute).

- **SEC-06: No CSRF protection on mutation endpoints**: `src/app/api/picnic/login/route.ts`, `src/app/api/picnic/cart/route.ts` — POST and DELETE endpoints rely solely on the `auth_token` cookie. While Next.js API routes do not automatically set CORS headers (making cross-origin requests fail by default), a `SameSite` cookie policy should be verified on the `auth_token` cookie.

### Low / Informational

- **SEC-07: Generic error messages — good**: All API routes return user-friendly Dutch error messages without leaking stack traces or internal details. This is correct practice.

- **SEC-08: Auth checks consistent**: All 4 API route files check `auth_token` cookie and call `verifyToken()` before processing. Good.

- **SEC-09: Input validation present**: Login uses `picnicLoginSchema`, cart uses `picnicCartAddSchema`/`picnicCartRemoveSchema`, search validates query param manually (consistent with GET param pattern). Good.

**Total: 1 critical, 3 high, 2 medium**

---

## Stage 5: Code Quality Review

### Must Fix

- **Duplicated auth-check boilerplate**: `src/app/api/picnic/login/route.ts:8-15`, `src/app/api/picnic/status/route.ts:5-14`, `src/app/api/picnic/search/route.ts:8-15`, `src/app/api/picnic/cart/route.ts:21-29,69-77,116-124` — The exact same 8-line auth check block is repeated 7 times across 4 files. Extract a helper:
  ```ts
  // src/lib/api-auth.ts
  import { NextRequest, NextResponse } from "next/server";
  import { verifyToken } from "@/lib/auth";
  import type { User } from "@/types/auth";

  type AuthResult =
    | { user: User; error: null }
    | { user: null; error: NextResponse };

  export async function requireAuth(request: NextRequest): Promise<AuthResult> {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }
    const user = await verifyToken(token);
    if (!user) {
      return { user: null, error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }
    return { user, error: null };
  }
  ```

- **Duplicated Picnic-connection-check pattern**: `src/app/api/picnic/search/route.ts:32-43`, `src/app/api/picnic/cart/route.ts:7-18` — The "fetch doc, check authKey, create client" pattern is duplicated. The cart route already has a `getPicnicClient` helper, but the search route duplicates it inline. Extract to a shared utility or reuse the cart route's helper.
  ```ts
  // Move getPicnicClient from cart/route.ts to src/lib/picnic-client.ts
  export async function getPicnicClientForFamily(familyId: string) { ... }
  ```

### Should Fix

- **MaaltijdenPage is 355 lines**: `src/app/maaltijden/page.tsx` — This page component handles meal CRUD, editing modal, random meal selection, and Picnic modal orchestration. It exceeds the 150-line guideline. Extract the meal editing modal into its own component (e.g., `MealEditModal.tsx`) and the Picnic orchestration logic into a custom hook.

- **Silent error swallowing**: `src/app/maaltijden/page.tsx:63` — The comment says `// error handled silently` but the error is actually dropped entirely. At minimum show a toast/message to the user:
  ```tsx
  } catch {
    // TODO: Show error feedback to the user
  }
  ```

- **Search route uses manual validation instead of Zod**: `src/app/api/picnic/search/route.ts:17-29` — A `picnicSearchSchema` exists in `validation.ts` but is never used. The search route manually validates the query parameter. For consistency with all other routes, use the schema:
  ```ts
  const parsed = picnicSearchSchema.safeParse({ query: request.nextUrl.searchParams.get("query") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
  }
  const { query } = parsed.data;
  ```

### Nitpicks

- **Inconsistent import grouping**: `src/app/boodschappen/page.tsx:3,13` — `useEffect` is imported from react on line 13, but `useState` and `useCallback` are imported on line 3. Merge into a single import statement.

- **Non-null assertion `doc.data()!`**: `src/app/api/picnic/search/route.ts:45`, `src/app/api/picnic/cart/route.ts:17` — The `!` is safe because the preceding check ensures `doc.exists`, but a safer pattern is:
  ```ts
  const data = doc.data();
  if (!data?.authKey) { ... }
  const authKey = data.authKey as string;
  ```

**Total: 2 must-fix, 3 should-fix, 2 nitpicks**

---

## Stage 6: Accessibility Review

### Critical (WCAG A — must fix)

- **Modal does not trap focus**: `src/components/PicnicAddToCartModal.tsx:56-128` — **WCAG 2.4.3 Focus Order** — The modal overlay does not trap keyboard focus. A user pressing Tab can navigate behind the modal to the underlying page content. Add focus trapping (e.g., using a `useEffect` with `focusTrap` logic or a library like `@headlessui/react Dialog`).
  ```tsx
  // Minimal focus trap approach:
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableEls = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    firstEl?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [ingredients, searchResults]); // re-run when focusable elements change
  ```

- **Modal does not close on Escape**: `src/components/PicnicAddToCartModal.tsx:56-128` — **WCAG 2.1.2 No Keyboard Trap** — There is no keyboard handler to close the modal with the Escape key.
  ```tsx
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);
  ```

- **Modal lacks `role="dialog"` and `aria-modal`**: `src/components/PicnicAddToCartModal.tsx:57` — **WCAG 4.1.2 Name, Role, Value** — The modal `<div>` has no ARIA dialog role. Screen readers will not announce it as a modal.
  ```tsx
  <div
    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="picnic-modal-title"
  >
  ```
  And add `id="picnic-modal-title"` to the `<h2>` on line 59.

### Important (WCAG AA — should fix)

- **Clicking backdrop does not close modal**: `src/components/PicnicAddToCartModal.tsx:56` — The backdrop overlay `<div>` has no click handler. Users expect clicking outside the modal to dismiss it. Add `onClick={onCancel}` to the outer div and `onClick={(e) => e.stopPropagation()}` to the inner dialog to prevent event bubbling.

- **"Zoeken..." loading state not announced**: `src/components/PicnicAddToCartModal.tsx:78` — **WCAG 4.1.3 Status Messages** — The "Zoeken..." text appears visually but is not in an `aria-live` region, so screen reader users are not informed that results are loading. Wrap in a `<span role="status">`.

- **Picnic toggle button lacks `aria-expanded`**: `src/app/boodschappen/page.tsx:83-95` — **WCAG 4.1.2 Name, Role, Value** — The button that toggles the Picnic section should communicate its expanded/collapsed state:
  ```tsx
  <button
    onClick={() => setShowPicnic(!showPicnic)}
    aria-expanded={showPicnic}
    className="..."
  >
  ```

- **Product selection buttons lack `aria-pressed`**: `src/components/PicnicAddToCartModal.tsx:83-97` — **WCAG 4.1.2** — The toggle-style product selection buttons visually indicate selection via background color but do not communicate the pressed/selected state to screen readers. Add `aria-pressed={selectedProductId === product.id}`.

### Best Practice

- **Cart message timeout should use `aria-live`**: `src/app/boodschappen/page.tsx:107` — The cart confirmation message has `role="status"` which is good. This is correctly implemented.

- **Touch targets**: Button sizes appear adequate (py-2 px-4 minimum) for the 44x44px mobile touch target guideline.

**Total: 3 critical, 4 important, 2 best-practice**

---

## Stage 7: Type Safety Review

### Must Fix (type errors or unsafe patterns)

- **Untyped Picnic search results mapping**: `src/app/api/picnic/search/route.ts:50-62` — The `results` variable is typed as `SearchResult[]` from picnic-api. However, `item.display_price` is typed as `string` in `SearchResult`, yet the code checks `typeof item.display_price === "string"` (line 54) as if it could also be a number. According to the picnic-api types (`SearchResult.display_price: string`), this branch for numbers is dead code. Either the picnic-api types are wrong (in which case the runtime check is prudent but the mapping should be documented) or this is unnecessary complexity. If the types are trusted, simplify:
  ```ts
  price: parseInt(item.display_price, 10),
  displayPrice: item.display_price,
  ```
  If the types are not trusted (runtime values differ), add a comment explaining why.

- **`as string` type assertions**: `src/app/api/picnic/search/route.ts:45`, `src/app/api/picnic/cart/route.ts:17` — `doc.data()!.authKey as string` uses both a non-null assertion and a type assertion. Firestore's `doc.data()` returns `DocumentData | undefined` where values are `any`. A safer approach:
  ```ts
  const data = doc.data();
  const authKey = typeof data?.authKey === "string" ? data.authKey : null;
  if (!authKey) {
    return NextResponse.json({ message: "Niet verbonden met Picnic" }, { status: 403 });
  }
  ```

### Should Fix (weak typing)

- **Missing return type on `getPicnicClient`**: `src/app/api/picnic/cart/route.ts:7` — The helper function `getPicnicClient` has no explicit return type. Since it is used across multiple handlers in the same file, add one:
  ```ts
  import PicnicApi from "picnic-api";
  // The picnic-api default export is a constructor, so the instance type is:
  type PicnicApiInstance = InstanceType<typeof PicnicApi>;

  async function getPicnicClient(familyId: string): Promise<PicnicApiInstance | null> {
  ```

- **`PicnicProduct` type does not match Picnic API's `SearchResult`**: `src/types/picnic.ts:1-9` — The `PicnicProduct` interface defines `price: number` and `displayPrice: string`, but the Picnic API's `SearchResult` type has `display_price: string` (not a number). The manual transformation in the search route converts this, but the type mismatch is implicit and undocumented. Add a JSDoc comment on `PicnicProduct` clarifying it is a transformed/normalized type, not a direct API response shape.

- **`onSearch` in PicnicSearch has wrong return type in props**: `src/components/PicnicSearch.tsx:8` — `onSearch: (query: string) => Promise<void>` but the actual handler in `boodschappen/page.tsx` returns `Promise<void>`. This is fine. However, the `PicnicAddToCartModal` has `onSearch: (ingredient: string) => Promise<void>` at line 9, and the actual implementation (`handlePicnicSearch` in `maaltijden/page.tsx:46`) also returns `Promise<void>`. This is consistent. No issue here.

- **`Record<string, PicnicProduct[]>` could be more specific**: `src/components/PicnicAddToCartModal.tsx:8` and `src/app/maaltijden/page.tsx:37` — The `searchResults` state uses `Record<string, PicnicProduct[]>` where keys are ingredient strings. This is acceptable but a named type alias would improve readability:
  ```ts
  type IngredientSearchResults = Record<string, PicnicProduct[]>;
  ```

### Suggestions

- **`createPicnicClient` return type is inferred**: `src/lib/picnic-client.ts:3` — The return type is inferred from the `PicnicApi` constructor. For an exported function, consider adding an explicit return type annotation. However, since the picnic-api module uses a complex anonymous class export pattern, the inferred type is actually the most practical approach here. No change needed.

- **Zod schemas produce inferred types that are not exported**: `src/lib/validation.ts:246-263` — Consider exporting `z.infer<typeof picnicLoginSchema>` etc. as named types for use in route handlers, reducing reliance on manual destructuring:
  ```ts
  export type PicnicLoginInput = z.infer<typeof picnicLoginSchema>;
  export type PicnicSearchInput = z.infer<typeof picnicSearchSchema>;
  export type PicnicCartAddInput = z.infer<typeof picnicCartAddSchema>;
  export type PicnicCartRemoveInput = z.infer<typeof picnicCartRemoveSchema>;
  ```

**Total: 2 must-fix, 3 should-fix, 2 suggestions**

---

## Combined Review Summary

| Stage | Critical | High/Warning | Medium/Should-Fix | Low/Suggestion |
|-------|----------|-------------|-------------------|----------------|
| 3 — Performance | 0 | 4 | — | 2 |
| 4 — Security | 1 | 3 | 2 | 3 |
| 5 — Code Quality | 2 | 3 | — | 2 |
| 6 — Accessibility | 3 | 4 | — | 2 |
| 7 — Type Safety | 2 | 3 | — | 2 |
| **Totals** | **8** | **17** | **2** | **11** |

### Priority Items for Stage 8 (Feedback Processor)
1. **SEC-01** (Critical): Encrypt Picnic authKey at rest in Firestore
2. **A11y** (Critical): Add focus trap, Escape key handler, and ARIA dialog role to `PicnicAddToCartModal`
3. **Perf** (Warning): Fix `useEffect` infinite loop risk in `PicnicAddToCartModal`
4. **Quality** (Must-fix): Extract duplicated auth-check boilerplate
5. **Quality** (Must-fix): Extract duplicated Picnic connection-check to shared utility
6. **Type Safety** (Must-fix): Replace `as string` / `!` assertions with runtime type guards
7. **SEC-03** (High): Detect Picnic 401 errors and clear stale connections
8. **A11y** (Important): Add `aria-expanded` to Picnic toggle, `aria-pressed` to selection buttons

---

## Stage 8: Feedback Processor

### Fixes Applied

| # | Finding | Status | Details |
|---|---------|--------|---------|
| 2 | A11y: Focus trap + Escape + ARIA dialog | Fixed | `PicnicAddToCartModal.tsx` — added `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap with Tab cycling, Escape key handler, `aria-pressed` on selection buttons, `aria-live="polite"` on loading text |
| 3 | Perf: useEffect infinite loop | Fixed | `PicnicAddToCartModal.tsx` — replaced `useState` `searchedIngredients` with `useRef` `searchedRef` to prevent re-renders |
| 4 | Quality: Duplicated auth-check | Fixed | Created `src/lib/api-auth.ts` with `requireAuth()` helper. All 4 route files now use it instead of inline auth checks |
| 5 | Quality: Duplicated Picnic connection-check | Fixed | Moved `getPicnicClient` to `src/lib/picnic-client.ts` as `getPicnicClientForFamily()`. Search + cart routes use shared helper |
| 6 | Type Safety: `as string` / `!` assertions | Fixed | `getPicnicClientForFamily` uses `typeof data?.authKey === "string"` runtime guard. Status route also updated |
| 7 | SEC-03: Detect Picnic 401, clear stale connections | Fixed | Added `handlePicnicAuthError()` in `picnic-client.ts`. Search + cart routes detect 401 from Picnic API, delete stale connection, return user-friendly message |
| 8 | A11y: `aria-expanded` on toggle | Fixed | `boodschappen/page.tsx` — Picnic toggle button now has `aria-expanded={showPicnic}` |
| — | Perf: Cap search results | Fixed | `search/route.ts` — added `.slice(0, 20)` to limit returned products |
| — | Perf: Sequential cart additions | Fixed | `maaltijden/page.tsx` — `handlePicnicConfirm` now uses `Promise.allSettled()` instead of sequential `for...of` loop |
| — | Quality: Search route uses manual validation | Fixed | `search/route.ts` now uses `picnicSearchSchema.safeParse()` for consistency |
| — | Quality: Inconsistent import grouping | Fixed | `boodschappen/page.tsx` and `maaltijden/page.tsx` — merged split React imports |

### Deferred

| # | Finding | Reason |
|---|---------|--------|
| 1 | SEC-01: Encrypt authKey at rest | Requires new `PICNIC_ENCRYPTION_KEY` env var and changes Firestore data model. Best done as a separate follow-up task with proper key management review |

---

## Stage 9: Final Tester

### Test Results
- **Vitest**: 58/58 Picnic tests pass (9 test files)
- **TypeScript**: 0 new errors (pre-existing errors in `EditFeedingModal.test.tsx` only)
- **ESLint**: 0 new warnings (pre-existing warnings in non-Picnic files only)

### Verdict: PASS

All new Picnic integration code passes tests, type checking, and linting. No regressions introduced.
