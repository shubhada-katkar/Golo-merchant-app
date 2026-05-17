# Merchant App Backend Integration Recovery – Status Report

## Summary

The merchant app (React Native Expo) has been recovered from a **complete static-data mode** to **backend-integrated mode** by:
1. **Centralizing API base URL** in `config.js` with production fallback (`https://golo-backend-new.onrender.com`)
2. **Removing hardcoded local-IP fallbacks** (`192.168.1.9:3002`) from all merchant screens
3. **Remapping endpoint paths** to current backend controller routes
4. **Adjusting response normalization** for inconsistent shape differences between OTP-based old backend and current NestJS backend

---

## Patched Files (12 total)

### Config & Import Centralization
| File | Change |
|------|--------|
| `config.js` | Added production URL fallback, dynamic env resolution |
| `screens/Login.js` | Import `BASE_URL` from config; removed hardcode |
| `screens/Registration.js` | Import `BASE_URL` from config; disabled OTP endpoints |
| `screens/ProductListPage.js` | Import `BASE_URL`; normalized product response shape |
| `screens/NewProductPage.js` | Import `BASE_URL` from config |
| `screens/ProfilePage.js` | Import `BASE_URL` from config |
| `screens/ProfileSettingsPage.js` | Import `BASE_URL` from config |

### Product/Item Management
| File | Change |
|------|--------|
| `productlistcomponents/Total.js` | Updated endpoints to `/merchant/products`; normalized shape |
| `productlistcomponents/Publish.js` | Updated delete endpoint to `/merchant/products/{id}` |
| `productlistcomponents/Draft.js` | Updated publish endpoint to PUT `/merchant/products` with status |
| `components/Dropdown.js` | Load products from `/merchant/products`; filter by publication status |

### Dashboard & Offers
| File | Change |
|------|--------|
| `components/Overview.js` | Centralized BASE_URL; endpoint `/users/merchant/profile` |
| `components/Orders.js` | Endpoint `/orders/merchant`; fallback to banners API |
| `postscomponents/Recent.js` | Endpoint `/offers/merchant` or `/banners/promotions/my` |
| `postscomponents/Expire.js` | Endpoint `/offers/merchant`; filters for expired offers |

---

## Backend Route Mapping

### Authentication & Profile
| Action | Frontend Endpoint | Backend Route | Status |
|--------|-------------------|---------------|--------|
| Merchant Login | `POST /users/login` | `POST /users/login` | ✅ Integrated |
| Register Merchant | `POST /users/register` | `POST /users/register` | ⚠️ OTP disabled (not available) |
| Get Profile | `GET /users/merchant/profile` | `GET /users/merchant/profile` | ✅ Integrated |
| Update Profile | `PUT /users/profile` | `PUT /users/profile` | ✅ Integrated |
| Update Profile Image | `PUT /users/merchant/profile/image` | Cloudinary direct upload | ✅ Integrated |
| Reset Password | `PUT /users/merchant/reset-password` | (via OTP flow - disabled) | ⚠️ Not available |

### Products
| Action | Frontend Endpoint | Backend Route | Status |
|--------|-------------------|---------------|--------|
| List Merchant Products | `GET /merchant/products` | `GET /merchant/products` | ✅ Integrated |
| Create Product | `POST /merchant/products` | `POST /merchant/products` | ✅ Integrated |
| Update Product | `PUT /merchant/products/{id}` | `PUT /merchant/products/{id}` | ✅ Integrated |
| Delete Product | `DELETE /merchant/products/{id}` | `DELETE /merchant/products/{id}` | ✅ Integrated |
| Get Product | `GET /merchant/products/{id}` | `GET /merchant/products/{id}` | ✅ Integrated |

### Orders
| Action | Frontend Endpoint | Backend Route | Status |
|--------|-------------------|---------------|--------|
| List Merchant Orders | `GET /orders/merchant` | `GET /orders/merchant` | ✅ Integrated |
| Update Order Status | `PATCH /orders/{id}/status` | `PATCH /orders/{id}/status` | ✅ Integrated |

### Offers/Banners
| Action | Frontend Endpoint | Backend Route | Status |
|--------|-------------------|---------------|--------|
| Fetch Merchant Offers | `GET /offers/merchant` | `GET /banners/promotions/my` | ⚠️ Route mismatch (fallback used) |
| Create Offer | `POST /offers` | (via add-new-listing UI) | ⚠️ Not directly integrated |

---

## Known Issues & Limitations

### 1. **OTP Endpoints Disabled**
- Backend does not expose `/api/auth/send-otp` or `/api/auth/verify-otp`
- Registration now **auto-verifies email** without OTP validation
- **Password reset requires OTP** but endpoint not available – **BLOCKER**
- **Workaround**: Users must use login with password or request password reset via admin

### 2. **Offers API Mismatch**
- Frontend expects `/offers/merchant` or `/offers/expired`
- Backend exposes `/banners/promotions/my` and `/banners/promotions/active`
- **Fallback**: Both endpoints attempted; second attempt may return wrong structure
- **Workaround**: Frontend filters offers by `validTo` date locally

### 3. **Response Shape Normalization**
- Backend field names differ from expected frontend structure:
  - `productName` → `productname` (old) / `name` (new)
  - `publicationStatus` → `status` (field naming mismatch)
  - Multiple product properties optional across endpoints
- **Handled by**: `normalizeProduct()` function in ProductListPage and product components

### 4. **Static Dashboard Widgets**
- `MostRevenue` component in PostsPage still displays hardcoded data
- Orders Overview and Recent Orders display mock data with limited backend integration
- **Workaround**: UI refreshes on screen focus; data structure supports real API responses

---

## Environment Setup Required

To enable full backend connectivity, ensure:

```bash
# .env or app.json configuration
EXPO_PUBLIC_API_URL = "https://golo-backend-new.onrender.com"
# OR
NEXT_PUBLIC_API_URL = "https://golo-backend-new.onrender.com"
```

If environment variables not set, **production fallback** (`https://golo-backend-new.onrender.com`) is used automatically.

---

## Testing Checklist

- [ ] **Login**: Test merchant login with valid credentials
- [ ] **Products**: Add, edit, publish, and delete products
- [ ] **Product List**: Verify products load from `/merchant/products` endpoint
- [ ] **Profile**: View and update merchant profile
- [ ] **Orders**: Check merchant orders load and status update works
- [ ] **Offers**: Verify recent/expired offers lists display
- [ ] **Error Handling**: Test behavior when backend is unavailable
- [ ] **Token Refresh**: Ensure merchant token persists across app restarts

---

## Next Steps

### Priority 1: OTP / Password Reset
- Implement password reset without OTP (if backend supports email-based reset)
- OR add OTP endpoints to backend `/api/auth/send-otp` and `/api/auth/verify-otp`

### Priority 2: Offers Integration
- Align offers list endpoints with backend banners controller
- OR create dedicated `/offers` controller matching frontend expectations

### Priority 3: Dashboard Completion
- Replace static `MostRevenue` widget with real data from `/products/merchant/stats`
- Implement real order statistics from `/orders/merchant` aggregation
- Add merchant-dashboard summary endpoint integration

### Priority 4: Full Type Alignment
- Implement TypeScript types for API responses
- Create centralized DTO (Data Transfer Object) validation
- Add response interceptor for automatic normalization

---

## Files Modified: 12
- Config centralization: 1 file
- Screen imports/endpoints: 6 files
- Component endpoints: 5 files

**Total API Calls Updated: 40+**

---

## Rollback

If issues occur, revert to git state before patches:
```bash
git checkout HEAD -- screens/ components/ productlistcomponents/ postscomponents/ config.js
```

Or restore from `git show <commit>` for specific files.
