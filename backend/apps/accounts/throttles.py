"""Auth endpoint rate limits that apply even when a token/session is present."""

from rest_framework.throttling import SimpleRateThrottle


class AuthEndpointThrottle(SimpleRateThrottle):
    """
    Always throttle by client IP.

    AnonRateThrottle skips authenticated requests, which would let anyone with
    any valid API token bypass login / 2FA verify limits.
    """

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class LoginRateThrottle(AuthEndpointThrottle):
    scope = "login"


class TwoFactorVerifyRateThrottle(AuthEndpointThrottle):
    scope = "two_factor"
