# Security Specification – MD ART STUDIO (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Global Safety Net**: All unlisted paths match `/{document=**}` and deny all reads and writes.
2. **PII Isolation (Pillar 6)**: User contact PII (`email`, `phone`) is isolated in `/users_private/{userId}` and `/addresses/{addressId}`, strictly readable only by the document owner (`request.auth.uid == userId`) or a verified admin.
3. **Zero Privilege Escalation**: Regular users creating `/users/{userId}` can only set `role == 'customer'`. Only verified admins can assign `role == 'admin'` or write to `/admins/{adminId}`.
4. **Master Gate Relational Sync (Pillar 1)**:
   - `/carts/{userId}/items/{itemId}` requires the parent `/carts/{userId}` document to exist (`exists(...)`) and belong to `request.auth.uid`, and verify `productId` exists in `/products/{productId}`.
   - `/orders/{orderId}/items/{itemId}` requires the parent `/orders/{orderId}` document to belong to `request.auth.uid` via `get(...)` and verify `productId` exists in `/products/{productId}`.
5. **Strict Validation Blueprints & Size Enforcements (Pillar 2 & 3)**: Every `create` and `update` invokes `isValid[Entity](incoming())`, validates `isValidId()` on single-document operations, enforces `hasAll` and `hasOnly` keys, and bounds every `string` and `list` with `.size()`.
6. **Temporal Integrity & Immortality**: Every `createdAt` must equal `request.time` on creation and remain immutable (`incoming().createdAt == existing().createdAt`) on update. Every `updatedAt` must equal `request.time` on update.
7. **Terminal State Locking**: Once an `/orders/{orderId}` reaches terminal status `'Delivered'` or `'Cancelled'`, non-admin updates are locked out.
8. **Secure List Queries (Pillar 8)**: No `allow list` block delegates security to the client or performs `get()`/`exists()` calls. Private collections enforce `resource.data.userId == request.auth.uid` (or `isBootstrappedAdmin()`), and public collections evaluate `resource.data` invariants.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Test Suite)

1. **Payload 1 – Self-Assigned Admin Role Escalation (`users`)**:
   `{ "uid": "attacker_1", "displayName": "Attacker", "role": "admin", "createdAt": "SERVER_TIME", "updatedAt": "SERVER_TIME" }`
2. **Payload 2 – Shadow Field Injection (`products`)**:
   `{ "name": "Art", ..., "isVerified": true }` (injects unlisted ghost field `isVerified`)
3. **Payload 3 – Unverified Email Admin Spoof (`products`)**:
   Auth token `{ "email": "meghanabesatty@gmail.com", "email_verified": false }` attempting to create or delete a product.
4. **Payload 4 – Cross-User PII Scrape (`users_private`)**:
   Authenticated user `user_A` attempting `get` or `list` on `/users_private/user_B`.
5. **Payload 5 – Identity Spoofing on Order Creation (`orders`)**:
   Authenticated user `user_A` creating an order with `{ "userId": "user_B", ... }`.
6. **Payload 6 – Timestamp Forgery / Backdating (`orders`)**:
   Creating an order with a past client timestamp `createdAt: Timestamp(2020, 1, 1)` instead of `request.time`.
7. **Payload 7 – Immortal Field Mutation (`users`)**:
   Updating `/users/user_A` where `incoming().createdAt != existing().createdAt` or `incoming().uid != existing().uid`.
8. **Payload 8 – Terminal State Unlocking (`orders`)**:
   Attempting to update an order whose `existing().orderStatus == 'Delivered'` as a non-admin user.
9. **Payload 9 – Orphaned Subcollection Write (`orders/{orderId}/items/{itemId}`)**:
   Creating an `OrderItem` where `/orders/{orderId}` does not exist or belongs to another user, or `productId` does not exist.
10. **Payload 10 – Resource Exhaustion / ID Poisoning (`addresses`)**:
    Creating an address with a 500-character document ID or a 10,000-character `street` string.
11. **Payload 11 – Array Type & Size Overflow (`products`)**:
    Admin creating a product with `images` array containing 50 items or non-string elements `[12345]`.
12. **Payload 12 – Unauthorized Query Scraping (`orders`)**:
    Authenticated user executing an unconstrained `list` query across all documents in `/orders` without filtering `userId == request.auth.uid`.
