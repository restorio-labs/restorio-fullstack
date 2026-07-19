from sqlalchemy.types import UserDefinedType


class GeographyPoint(UserDefinedType[object]):
    cache_ok = True

    def get_col_spec(self, **_kwargs: object) -> str:
        return "geography(POINT,4326)"
