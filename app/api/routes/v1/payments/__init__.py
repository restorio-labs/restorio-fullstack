from fastapi import APIRouter

from routes.v1.payments import p24_config, payments, transactions

router = APIRouter()

router.include_router(payments.router, tags=["payments"])
router.include_router(transactions.router, tags=["transactions"])
router.include_router(p24_config.router, tags=["p24-config"])
