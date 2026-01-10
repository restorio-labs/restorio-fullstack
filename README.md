# Restorio Platform

## Multi-tenant Restaurant Creation & Management System

## 1. Project Overview

### Project name

**Restorio Platform**

### Description

Restorio is a cloud-hosted, multi-tenant SaaS platform designed for small and medium restaurant owners. It enables restaurant operators to create and customize their restaurant presence, manage menus, accept waiterless orders via QR codes or tablets, process payments, and analyze basic business metrics.

The platform is designed with scalability, security, and cost-efficiency in mind, making it suitable both as a production-ready system and an academic engineer-degree project.

---

## 2. Problem Statement

Small restaurant owners often lack affordable, integrated digital tools that allow them to:

- present a modern restaurant website and menu,
- accept digital orders without waiter involvement,
- manage staff workflows and kitchen operations,
- integrate modern online payments,
- analyze sales and customer behavior.

Existing solutions are often expensive, closed-source, or overly complex for small businesses. Restorio aims to fill this gap.

---

## 3. Project Goals

- Provide an easy-to-use restaurant management platform
- Enable waiterless ordering via QR codes and tablets
- Support multi-location restaurants
- Ensure secure, multi-tenant architecture
- Offer extensible CMS and analytics features
- Remain cost-efficient and deployable without vendor lock-in

---

## 4. Target Users

- **Primary users:** Small restaurant owners (single or multiple locations)
- **Secondary users:** Waiters, kitchen staff
- **End users:** Restaurant customers (no login required)
- **Administrators:** Platform admins and super-admins

---

## 5. Engineering Focus

This project emphasizes:

- Multi-tenant SaaS architecture
- Distributed systems (async processing, WebSockets)
- Modular backend design
- CMS extensibility via shared packages
- Security, RBAC, and regulatory compliance

---

## 6. MVP Scope

### Included Features

#### Restaurant Management

- Restaurant and venue creation
- Multi-location support
- Menu management (categories, items, modifiers)
- Allergens and nutritional metadata
- Table management with QR codes

#### Ordering System

- QR-based browser ordering (anonymous sessions)
- PWA-based ordering
- Tablet/kiosk ordering
- Order modification and cancellation (time-limited)
- Split bills
- Payment processing (Stripe, Przelewy24)

#### Staff & Permissions

- Role-Based Access Control (RBAC)
- Roles: Owner, Manager, Waiter, Kitchen Staff, Admin, Super-Admin
- Custom role creation

#### CMS

- Static pages (About, Contact)
- Dynamic pages (Events, Promotions)
- SEO metadata per page

#### Analytics (Basic)

- Orders per day
- Revenue overview
- Popular menu items
- Table turnover time
- Basic sales display

#### Infrastructure

- Dockerized services
- Real-time order updates
- Async task processing

---

### Explicitly Out of Scope (MVP)

- Offline mode
- Fiscal printer integration
- Inventory and stock management
- Staff scheduling
- Loyalty programs

These features are intentionally excluded to control scope and complexity.

---

## 7. System Architecture

### High-Level Architecture

```
Client (Browser / Tablet / PWA)
        |
        v
Cloudflare (DNS + CDN)
        |
        v
NGINX (Mikrus VPS)
 ├─ Next.js (Public pages, SEO)
 ├─ React Apps (Admin, Kitchen, Tablet)
 └─ FastAPI (Backend API)
        |
        ├─ PostgreSQL (Transactional, relational data)
        ├─ MongoDB (Order drafts, live sessions)
        ├─ Redis (Sessions, Pub/Sub, Queues)
        └─ Payment Providers (Stripe, Przelewy24)
```

---

## 8. Frontend Architecture

### Hybrid Frontend Strategy

- **Next.js**
  - Public restaurant websites
  - SEO and metadata handling
  - Marketplace and preview mode (Post-MVP)

- **React (Vite)**
  - Admin dashboard
  - Kitchen interface
  - Tablet / kiosk UI

- **Shared Packages**
  - UI components
  - Type definitions
  - API client
  - Authentication utilities

---

## 9. Backend Architecture

### Backend Style

**Modular Monolith (FastAPI)**

### Core Modules

- Authentication & RBAC
- Tenant resolution
- Restaurant management
- Menu management
- Orders
- Payments
- Analytics
- CMS

Each module is logically separated but deployed as a single service.

---

## 10. Multi-Tenancy Model

- Subdomain-based tenant resolution
- Each request resolves a `tenant_id`
- Data partitioned by tenant
- Shared infrastructure with isolated data access

---

## 11. Real-Time & Async Processing

### Real-Time

- WebSockets for kitchen order updates
- Redis pub/sub for event fan-out

### Async Tasks

- Payment webhooks
- Analytics aggregation
- Backup processes

---

## 12. Security & Compliance

### Authentication

- JWT access tokens
- Refresh tokens
- Anonymous customer session tokens

### Authorization

- Role-Based Access Control (RBAC)
- Custom roles and permission inheritance

### GDPR Compliance

- Minimal personal data storage
- Consent handling
- Data deletion mechanisms
- Audit logging for administrative actions

---

## 13. Deployment Strategy

### Hosting

- Mikrus VPS (Poland)

### Deployment Stack

- Docker & Docker Compose
- NGINX reverse proxy
- PostgreSQL (Transactional data)
- MongoDB (Document-oriented data)
- Redis (Sessions, Pub/Sub, Queues)
- Cloudflare (DNS & CDN)

### Benefits

- Low operational cost
- Predictable billing
- No vendor lock-in
- Production-grade setup

---

## 14. Roadmap

### Phase 0 – Foundation

- Monorepo setup
- CI/CD (GitHub Actions)
- Docker environment
- Authentication and tenancy
- Core data models

### Phase 1 – MVP

- Restaurant onboarding wizard
- Menu management
- Ordering flow
- Payment integration
- Kitchen real-time UI
- Basic analytics
- Demo mode (7-day trial)

### Phase 2 – Post-MVP

- Multi-language support
- Advanced analytics
- Public marketplace
- Preview mode
- Custom domains

---

## 15. Academic Justification

### Architectural Decisions

- Modular monolith reduces complexity while maintaining scalability
- Hybrid frontend avoids future rewrites
- NoSQL databases provide schema flexibility
- Redis enables real-time and async features

### Risks & Mitigation

- Scope creep → strict MVP definition
- Payment complexity → external providers

---

## 16. Summary

Restorio Platform is a scalable, secure, and cost-efficient restaurant management system that demonstrates advanced engineering concepts suitable for an engineer-degree project. The platform balances real-world applicability with academic rigor and controlled scope.
