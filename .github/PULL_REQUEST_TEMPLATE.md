## 🚀 Pull Request Checklist

### 📋 Summary


---

### 📁 Changes Made

- `packages/`

---

### ✅ Checklists

### Multi-Tenancy & Security Checklist

- [ ] Tenant isolation respected
- [ ] RBAC rules applied correctly
- [ ] No cross-tenant data access possible
- [ ] Sensitive data handled securely

### Frontend Checklist (if applicable)

- [ ] Responsive UI
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Accessibility basics respected
- [ ] Server state uses TanStack Query or server components
- [ ] Shared UI state uses Zustand and does not duplicate server state
- [ ] Large unbounded lists use TanStack Virtual
- [ ] Production forms use React Hook Form

### Backend Checklist (if applicable)

- [ ] Validation added
- [ ] Proper HTTP status codes
- [ ] Async operations handled safely
- [ ] Idempotency considered (if relevant)

---

### Academic Justification

Briefly explain **why this solution was chosen**. Mention **trade-offs** if applicable.

---

## Screenshots / Logs (optional)

Attach screenshots, logs, or diagrams if useful.
