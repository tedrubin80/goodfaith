import base64
import io
import secrets

import pyotp
import qrcode


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def build_provisioning_uri(*, secret: str, username: str, issuer: str = "Good Faith") -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer)


def verify_totp_code(secret: str, code: str, *, valid_window: int = 1) -> bool:
    if not secret or not code:
        return False
    normalized = str(code).strip().replace(" ", "")
    if not normalized.isdigit() or len(normalized) != 6:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(normalized, valid_window=valid_window)


def qr_code_data_uri(provisioning_uri: str) -> str:
    image = qrcode.make(provisioning_uri)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def generate_backup_codes(count: int = 10) -> list[str]:
    return [secrets.token_hex(4).upper() for _ in range(count)]
