from enum import StrEnum


class AuthorizationAction(StrEnum):
    APP_ADMIN_ACCESS = "app.admin.access"
    APP_WAITER_ACCESS = "app.waiter.access"
    APP_KITCHEN_ACCESS = "app.kitchen.access"

    TENANT_LIST = "tenant.list"
    TENANT_CREATE = "tenant.create"
    TENANT_VIEW = "tenant.view"
    TENANT_UPDATE = "tenant.update"
    TENANT_DELETE = "tenant.delete"

    PROFILE_VIEW = "profile.view"
    PROFILE_UPDATE = "profile.update"
    PROFILE_LOGO_READ = "profile.logo.read"
    PROFILE_LOGO_WRITE = "profile.logo.write"

    MOBILE_CONFIG_READ = "mobile_config.read"
    MOBILE_CONFIG_WRITE = "mobile_config.write"

    MENU_READ = "menu.read"
    MENU_WRITE = "menu.write"
    MENU_AVAILABILITY_UPDATE = "menu.availability.update"
    MENU_ASSET_WRITE = "menu.asset.write"

    FLOOR_CANVAS_READ = "floor_canvas.read"
    FLOOR_CANVAS_WRITE = "floor_canvas.write"
    FLOOR_CANVAS_VERSION_READ = "floor_canvas.version.read"

    ORDER_READ = "order.read"
    ORDER_CREATE = "order.create"
    ORDER_UPDATE = "order.update"
    ORDER_TRANSITION = "order.transition"
    ORDER_DELETE = "order.delete"
    ORDER_ARCHIVE = "order.archive"
    ORDER_REFUND = "order.refund"
    TABLE_SESSION_READ = "table_session.read"
    TABLE_SESSION_UNLOCK = "table_session.unlock"

    PAYMENT_CREATE = "payment.create"
    PAYMENT_CONFIG_READ = "payment.config.read"
    PAYMENT_CONFIG_WRITE = "payment.config.write"
    PAYMENT_VERIFY = "payment.verify"
    PAYMENT_TRANSACTION_READ = "payment.transaction.read"
    PAYMENT_RECONCILE = "payment.reconcile"

    STAFF_READ = "staff.read"
    STAFF_CREATE = "staff.create"
    STAFF_DELETE = "staff.delete"

    ACCESS_GROUP_READ = "access_group.read"
    ACCESS_GROUP_WRITE = "access_group.write"
    ACCESS_GROUP_ASSIGN = "access_group.assign"

    KITCHEN_CONFIG_READ = "kitchen_config.read"
    KITCHEN_CONFIG_WRITE = "kitchen_config.write"
