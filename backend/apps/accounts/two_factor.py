import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache

PENDING_2FA_PREFIX = "auth:2fa_pending:"
PENDING_2FA_TTL = 300


def create_pending_2fa_token(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    cache.set(f"{PENDING_2FA_PREFIX}{token}", user_id, PENDING_2FA_TTL)
    return token


def consume_pending_2fa_token(token: str) -> int | None:
    key = f"{PENDING_2FA_PREFIX}{token}"
    user_id = cache.get(key)
    if user_id is not None:
        cache.delete(key)
    return user_id


def hash_backup_codes(codes: list[str]) -> list[str]:
    return [make_password(code) for code in codes]


def verify_backup_code(stored_hashes: list[str], code: str) -> tuple[bool, list[str]]:
    normalized = str(code).strip().replace(" ", "").upper()
    if not normalized:
        return False, stored_hashes

    remaining = list(stored_hashes)
    for index, hashed in enumerate(remaining):
        if check_password(normalized, hashed):
            remaining.pop(index)
            return True, remaining
    return False, stored_hashes
