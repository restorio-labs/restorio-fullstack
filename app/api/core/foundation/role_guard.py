"""Retired role guard module.

Authorization is defined by explicit actions in ``core.authorization``.
This module remains only to give old imports a clear migration failure.
"""


def __getattr__(name: str) -> None:
    message = (
        f"{name} was removed; use an explicit action dependency from "
        "core.authorization.dependencies"
    )
    raise AttributeError(message)
