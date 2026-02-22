import base64
import hashlib
import json

from core.foundation.infra.config import settings


class P24Service:
    def __init__(self) -> None:
        self._merchant_id = settings.PRZELEWY24_MERCHANT_ID
        self._pos_id = settings.PRZELEWY24_POS_ID
        self._crc = settings.PRZELEWY24_CRC
        self._api_key = settings.PRZELEWY24_API_KEY
        self._api_url = settings.PRZELEWY24_API_URL

    _PRZELEWY24_SERVICE_NAME = "Przelewy24"

    @staticmethod
    def _przelewy24_sign(
        session_id: str,
        merchant_id: int,
        amount: int,
        currency: str,
        crc: str,
    ) -> str:
        sign_data = {
            "sessionId": session_id,
            "merchantId": merchant_id,
            "amount": amount,
            "currency": currency,
            "crc": crc,
        }
        payload = json.dumps(sign_data, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha384(payload.encode("utf-8")).hexdigest()

    def _przelewy24_basic_auth(self) -> str:
        raw = f"{self._merchant_id}:{self._api_key}"
        return f"Basic {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"
