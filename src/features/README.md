# ATR Sales PWA - Feature Modules README

> **Purpose:** Explain the modular architecture and feature organization
> **Audience:** IT Developers
> **Last Updated:** 2026-02-07

---

## 📁 Feature Modules Structure

```
src/features/
├── auth/           # Authentication & Authorization
├── sales/          # Sales workflows (Inquiry, Dashboard, Leads)
├── operations/     # Admin operations & tools
├── commission/     # Commission tracking & payment
├── performance/    # Leaderboard & analytics
└── core/           # Core pages (Settings, Debug)
```

---

## 🏗️ Module Architecture

Each feature module follows this structure:

```
features/[module-name]/
├── pages/          # Page components (routes)
├── components/     # Module-specific components
├── services/       # API calls & business logic
└── README.md       # Module documentation
```

### Example: Operations Module

```
features/operations/
├── pages/
│   └── OperationsPage.jsx      # Main operations dashboard
├── components/
│   └── AdminQuickEdit.jsx      # Quick edit component
└── README.md                    # Operations documentation
```

---

## 📝 Operations Module

### Purpose
Admin tools for managing inquiries, revenue, AWB, and commissions.

### Components

#### AdminQuickEdit
**File:** `components/AdminQuickEdit.jsx`

**Purpose:** Allow admin to edit revenue, GP, commission, and AWB in one interface

**Features:**
- ✅ Edit revenue & GP
- ✅ Auto-calculate commission (GP × 2%)
- ✅ Input AWB with format validation
- ✅ Save all fields in one API call

**Usage:**
```jsx
import AdminQuickEdit from '../operations/components/AdminQuickEdit';

<AdminQuickEdit 
    inquiry={inquiry} 
    onUpdate={() => fetchInquiries()} 
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `inquiry` | Object | Inquiry data object |
| `onUpdate` | Function | Callback after successful update |

**API Calls:**
- `admin_update_inquiry_financials()` - Update all fields

---

## 🔗 Cross-Module Communication

### Shared Services
Located in `src/services/`:
- `inquiryService.js` - Inquiry CRUD operations
- `commissionService.js` - Commission operations
- `userService.js` - User operations

### Shared Components
Located in `src/components/`:
- `Button.jsx` - Reusable button
- `Modal.jsx` - Reusable modal
- `Toast.jsx` - Toast notifications

### Example: Using Shared Service
```javascript
// In any feature module
import { inquiryService } from '../../../services/inquiryService';

const inquiry = await inquiryService.getById(id);
```

---

## 🎯 Modular Design Principles

### 1. Feature Isolation
Each feature module is self-contained:
- ✅ Module-specific components stay in module
- ✅ Shared components go to `src/components/`
- ✅ Module-specific logic stays in module services

### 2. Data vs Logic Separation
- **Logic (Code):** Stored in Vercel/Code (`services/`)
- **Data (Config):** Stored in Supabase Database

**Example:**
```javascript
// ❌ Bad: Hardcoded logic
const commission = gp * 0.02;

// ✅ Good: Centralized logic
import { calculateCommission } from '../../../services/commissionService';
const commission = calculateCommission(gp);
```

### 3. Single Responsibility
Each component has one clear purpose:
- ✅ `AdminQuickEdit` - Edit inquiry financials
- ✅ `DashboardPage` - Display dashboard
- ✅ `InquiryFormPage` - Create/edit inquiry

---

## 📚 Documentation Standards

### File-Level Comments
Every component should have:
```javascript
/**
 * COMPONENT: AdminQuickEdit
 * 
 * PURPOSE: Allow admin to edit revenue, GP, commission, and AWB
 * 
 * WORKFLOW:
 * 1. Admin clicks "Quick Edit" button
 * 2. Form displays with current values
 * 3. Admin edits fields
 * 4. Commission auto-calculated (GP × 2%)
 * 5. Save calls admin_update_inquiry_financials RPC
 * 6. Toast notification on success/error
 * 
 * PROPS:
 * - inquiry (Object): Inquiry data
 * - onUpdate (Function): Callback after update
 * 
 * API CALLS:
 * - admin_update_inquiry_financials()
 */
```

### Function-Level Comments
```javascript
/**
 * Handle save button click
 * 
 * Calls RPC function to update revenue, GP, commission, and AWB
 * Shows toast notification on success/error
 * Triggers onUpdate callback to refresh parent data
 */
const handleSave = async () => {
    // Implementation...
};
```

---

## 🔄 Adding New Features

### Step 1: Plan
1. Document workflow in `docs/WORKFLOWS.md`
2. Identify which module it belongs to
3. Check if it needs a new module or fits existing

### Step 2: Create Structure
```bash
# If new module needed
mkdir -p src/features/new-module/pages
mkdir -p src/features/new-module/components
mkdir -p src/features/new-module/services
touch src/features/new-module/README.md
```

### Step 3: Implement
1. Create components with file-level comments
2. Create services for business logic
3. Add to routing in `App.jsx`

### Step 4: Document
1. Update `docs/WORKFLOWS.md`
2. Create module README
3. Add inline comments

---

## 🧪 Testing Guidelines

### Component Testing
```javascript
// Test AdminQuickEdit
test('should calculate commission from GP', () => {
    const gp = 8000000;
    const expectedCommission = gp * 0.02;
    // Assert...
});
```

### Integration Testing
```javascript
// Test full workflow
test('admin can update revenue and see it in dashboard', async () => {
    // 1. Update revenue via AdminQuickEdit
    // 2. Check dashboard displays new revenue
    // Assert...
});
```

---

## 📖 Related Documentation

- [WORKFLOWS.md](../docs/WORKFLOWS.md) - All business workflows
- [REVENUE_FLOW.md](../docs/REVENUE_FLOW.md) - Revenue workflow
- [AWB_FLOW.md](../docs/AWB_FLOW.md) - AWB workflow
- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) - Architecture overview
