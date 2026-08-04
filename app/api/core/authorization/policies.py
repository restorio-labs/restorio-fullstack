from __future__ import annotations

from core.authorization.actions import AuthorizationAction
from core.models.enums import AccountType

ACCOUNT_ACTIONS = frozenset({AuthorizationAction.TENANT_LIST, AuthorizationAction.TENANT_CREATE})
TENANT_ACTIONS = frozenset(AuthorizationAction) - ACCOUNT_ACTIONS

NON_DELEGABLE_ACTIONS = ACCOUNT_ACTIONS | {
    AuthorizationAction.APP_ADMIN_ACCESS,
    AuthorizationAction.TENANT_UPDATE,
    AuthorizationAction.TENANT_DELETE,
    AuthorizationAction.PAYMENT_CONFIG_READ,
    AuthorizationAction.PAYMENT_CONFIG_WRITE,
    AuthorizationAction.STAFF_CREATE,
    AuthorizationAction.STAFF_DELETE,
    AuthorizationAction.ACCESS_GROUP_READ,
    AuthorizationAction.ACCESS_GROUP_WRITE,
    AuthorizationAction.ACCESS_GROUP_ASSIGN,
}
DELEGABLE_ACTIONS = TENANT_ACTIONS - NON_DELEGABLE_ACTIONS

COMMON_READ_ACTIONS = frozenset(
    {
        AuthorizationAction.TENANT_VIEW,
        AuthorizationAction.PROFILE_VIEW,
        AuthorizationAction.PROFILE_LOGO_READ,
        AuthorizationAction.MENU_READ,
        AuthorizationAction.ORDER_READ,
    }
)

WAITER_ACTIONS = COMMON_READ_ACTIONS | {
    AuthorizationAction.APP_WAITER_ACCESS,
    AuthorizationAction.FLOOR_CANVAS_READ,
    AuthorizationAction.FLOOR_CANVAS_VERSION_READ,
    AuthorizationAction.ORDER_CREATE,
    AuthorizationAction.ORDER_UPDATE,
    AuthorizationAction.ORDER_TRANSITION,
    AuthorizationAction.ORDER_DELETE,
    AuthorizationAction.ORDER_ARCHIVE,
    AuthorizationAction.TABLE_SESSION_READ,
    AuthorizationAction.TABLE_SESSION_UNLOCK,
    AuthorizationAction.PAYMENT_CREATE,
    AuthorizationAction.PAYMENT_VERIFY,
}

KITCHEN_ACTIONS = COMMON_READ_ACTIONS | {
    AuthorizationAction.APP_KITCHEN_ACCESS,
    AuthorizationAction.MENU_AVAILABILITY_UPDATE,
    AuthorizationAction.ORDER_TRANSITION,
    AuthorizationAction.ORDER_REFUND,
    AuthorizationAction.KITCHEN_CONFIG_READ,
}

OPERATIONAL_ACTIONS = (
    WAITER_ACTIONS
    | KITCHEN_ACTIONS
    | {
        AuthorizationAction.FLOOR_CANVAS_WRITE,
        AuthorizationAction.PAYMENT_TRANSACTION_READ,
        AuthorizationAction.PAYMENT_RECONCILE,
        AuthorizationAction.STAFF_READ,
    }
)

MANAGER_ACTIONS = OPERATIONAL_ACTIONS | {
    AuthorizationAction.APP_ADMIN_ACCESS,
    AuthorizationAction.APP_WAITER_ACCESS,
    AuthorizationAction.APP_KITCHEN_ACCESS,
    AuthorizationAction.PROFILE_UPDATE,
    AuthorizationAction.PROFILE_LOGO_WRITE,
    AuthorizationAction.MOBILE_CONFIG_READ,
    AuthorizationAction.MOBILE_CONFIG_WRITE,
    AuthorizationAction.MENU_WRITE,
    AuthorizationAction.MENU_ASSET_WRITE,
    AuthorizationAction.KITCHEN_CONFIG_WRITE,
    AuthorizationAction.ACCESS_GROUP_READ,
}

OWNER_ACTIONS = MANAGER_ACTIONS | {
    AuthorizationAction.TENANT_UPDATE,
    AuthorizationAction.TENANT_DELETE,
    AuthorizationAction.PAYMENT_CONFIG_READ,
    AuthorizationAction.PAYMENT_CONFIG_WRITE,
    AuthorizationAction.STAFF_CREATE,
    AuthorizationAction.STAFF_DELETE,
    AuthorizationAction.ACCESS_GROUP_WRITE,
    AuthorizationAction.ACCESS_GROUP_ASSIGN,
}

ROLE_ACTIONS: dict[AccountType, frozenset[AuthorizationAction]] = {
    AccountType.OWNER: OWNER_ACTIONS,
    AccountType.MANAGER: MANAGER_ACTIONS,
    AccountType.WAITER: WAITER_ACTIONS,
    AccountType.KITCHEN: KITCHEN_ACTIONS,
}


def capabilities_for_role(role: AccountType) -> frozenset[AuthorizationAction]:
    return ROLE_ACTIONS.get(role, frozenset())
