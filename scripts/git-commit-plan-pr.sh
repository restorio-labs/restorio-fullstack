#!/usr/bin/env bash
# Suggested git commands to split a large PR into focused commits.
# From repo root: bash scripts/git-commit-plan-pr.sh
# Or copy-paste blocks one at a time (recommended: review `git diff --cached` before each commit).
#
# Before starting:
#   git status
#   git branch                    # ensure you are on your feature branch
#   git fetch origin && git rebase origin/main   # optional, if you track main

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Working from: $ROOT"
echo ""
echo "Usage:"
echo "  source scripts/git-commit-plan-pr.sh"
echo "  commit_01_api_db_and_model    # then repeat for 02, 03, ..."
echo ""
echo "Or copy-paste the git add / git commit lines from each function below."
echo "Review with: git diff --cached"

# --- Optional: create branch ---
# git checkout -b feat/mobile-config-and-menu-images

commit_01_api_db_and_model() {
  git add app/api/alembic/versions/20260409_120000_add_tenant_mobile_configs.py
  git add app/api/core/models/tenant_mobile_config.py
  git add app/api/core/models/tenant.py
  git add app/api/core/models/__init__.py
  git add app/api/alembic/env.py
  git commit -m "feat(api): add tenant_mobile_configs table and SQLAlchemy model"
}

commit_02_api_storage_services() {
  git add app/api/services/tenant_mobile_config_service.py
  git add app/api/services/tenant_mobile_favicon_storage_service.py
  git add app/api/services/tenant_menu_image_storage_service.py
  git add app/api/services/tenant_logo_storage_service.py
  git add app/api/core/foundation/infra/config.py
  git commit -m "feat(api): MinIO services for mobile favicon and menu images"
}

commit_03_api_dtos_and_routes() {
  git add app/api/core/dto/v1/tenants/mobile_config.py
  git add app/api/core/dto/v1/public/responses.py
  git add app/api/core/dto/v1/menus/requests.py
  git add app/api/core/dto/v1/menus/responses.py
  git add app/api/routes/v1/mappers/tenant_mobile_config_mappers.py
  git add app/api/routes/v1/tenants/mobile_config.py
  git add app/api/routes/v1/tenants/__init__.py
  git add app/api/routes/v1/public/public.py
  git add app/api/routes/__init__.py
  git add app/api/core/foundation/dependencies.py
  git add app/api/core/foundation/tenant_guard.py
  git commit -m "feat(api): mobile-config and public tenant info endpoints"
}

commit_04_api_menu_mongo() {
  git add app/api/services/mongo_menu_service.py
  git add app/api/routes/v1/tenants/menu.py
  git add app/api/tests/unit/routes/v1/test_dto_menus.py
  git commit -m "feat(api): menu item imageUrl in DTOs and Mongo normalization"
}

commit_05_packages_shared() {
  git add app/packages/types/src/payment.ts
  git add app/packages/types/src/menu.ts
  git add app/packages/types/src/mobileConfig.ts
  git add app/packages/types/src/index.ts
  git add app/packages/api-client/src/resources/tenant-mobile-config.ts
  git add app/packages/api-client/src/resources/public.ts
  git add app/packages/api-client/src/resources/index.ts
  git add app/packages/api-client/src/endpoints.ts
  git commit -m "feat(types,api-client): PublicTenantInfo, mobile config resource, menu image types"
}

commit_06_admin_panel() {
  git add app/apps/admin-panel/src/pages/MobileConfigurationPage.tsx
  git add app/apps/admin-panel/src/App.tsx
  git add app/apps/admin-panel/src/features/sidebar/AdminSidebar.tsx
  git add app/apps/admin-panel/src/pages/MenuCreatorPage.tsx
  git add app/apps/admin-panel/src/locales/en.json
  git add app/apps/admin-panel/src/locales/pl.json
  git commit -m "feat(admin): mobile configuration page and menu item photos"
}

commit_07_mobile_app() {
  git add app/apps/mobile-app/index.html
  git add app/apps/mobile-app/src/vite-env.d.ts
  git add app/apps/mobile-app/src/lib/i18n.ts
  git add app/apps/mobile-app/src/lib/mobileDevice.ts
  git add app/apps/mobile-app/src/components/MobileDeviceGate.tsx
  git add app/apps/mobile-app/src/wrappers/AppProviders.tsx
  git add app/apps/mobile-app/src/layouts/AppLayout.tsx
  git add app/apps/mobile-app/src/App.tsx
  git add app/apps/mobile-app/src/pages/OrderPage.tsx
  git add app/apps/mobile-app/src/pages/PaymentReturnPage.tsx
  git add app/apps/mobile-app/src/features/order/components/MenuItemCard.tsx
  git add app/apps/mobile-app/src/features/order/components/MenuCategorySection.tsx
  git add app/apps/mobile-app/src/features/order/components/CartSummary.tsx
  git add app/apps/mobile-app/src/features/order/components/CheckoutForm.tsx
  git add app/apps/mobile-app/src/locales/en.json
  git add app/apps/mobile-app/src/locales/pl.json
  git add app/apps/mobile-app/src/locales/es.json
  git add app/apps/mobile-app/src/locales/ar.json
  git commit -m "feat(mobile): branding, i18n, device gate, menu images"
}

commit_08_misc_remaining() {
  git status --short
  git add -A
  git commit -m "chore: remaining PR changes"
}
