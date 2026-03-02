from fastapi import APIRouter

from routes.v1.payments import create_payment, list_transactions, update_p24_config

router = APIRouter()
router.include_router(create_payment.router, prefix="/createPayment")
router.include_router(list_transactions.router, prefix="/transactions")
router.include_router(update_p24_config.router)
