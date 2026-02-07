from fastapi import APIRouter

from routes.v1.payments import create_payment

router = APIRouter()
router.include_router(create_payment.router, prefix="/createPayment")
