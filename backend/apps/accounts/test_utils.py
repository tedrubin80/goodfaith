"""Test helpers for accounts / 2FA."""


def satisfy_mandatory_2fa(user) -> None:
    """Mark a user as 2FA-enabled for tests that hit financial APIs."""
    user.is_2fa_enabled = True
    if not user.totp_secret:
        user.totp_secret = "TESTSECRET000000"
    user.save(update_fields=["is_2fa_enabled", "totp_secret"])
