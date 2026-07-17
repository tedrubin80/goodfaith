from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    TwoFactorConfirmSerializer,
    TwoFactorDisableSerializer,
    TwoFactorVerifySerializer,
    UserSerializer,
)
from .totp import (
    build_provisioning_uri,
    generate_backup_codes,
    generate_totp_secret,
    qr_code_data_uri,
    verify_totp_code,
)
from .two_factor import (
    consume_pending_2fa_token,
    create_pending_2fa_token,
    hash_backup_codes,
    verify_backup_code,
)


def _issue_token(user: User) -> Response:
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]

    if user.is_2fa_enabled:
        pending_token = create_pending_2fa_token(user.pk)
        return Response(
            {
                "requires_2fa": True,
                "pending_token": pending_token,
                "user": UserSerializer(user).data,
            }
        )

    return _issue_token(user)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_2fa(request):
    serializer = TwoFactorVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_id = consume_pending_2fa_token(serializer.validated_data["pending_token"])
    if user_id is None:
        return Response({"detail": "Session expired. Sign in again."}, status=400)

    try:
        user = User.objects.get(pk=user_id, is_active=True, is_2fa_enabled=True)
    except User.DoesNotExist:
        return Response({"detail": "Invalid session."}, status=400)

    code = serializer.validated_data["code"]
    if verify_totp_code(user.totp_secret, code):
        return _issue_token(user)

    ok, remaining = verify_backup_code(user.backup_codes or [], code)
    if ok:
        user.backup_codes = remaining
        user.save(update_fields=["backup_codes"])
        return _issue_token(user)

    return Response({"detail": "Invalid authenticator or backup code."}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "Password updated. Sign in again with your new password."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"detail": "Logged out."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_2fa(request):
    user = request.user
    if user.is_2fa_enabled:
        return Response({"detail": "Two-factor authentication is already enabled."}, status=400)

    secret = generate_totp_secret()
    user.totp_secret = secret
    user.backup_codes = []
    user.save(update_fields=["totp_secret", "backup_codes"])

    provisioning_uri = build_provisioning_uri(secret=secret, username=user.username)
    return Response(
        {
            "secret": secret,
            "provisioning_uri": provisioning_uri,
            "qr_code": qr_code_data_uri(provisioning_uri),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_2fa(request):
    user = request.user
    if user.is_2fa_enabled:
        return Response({"detail": "Two-factor authentication is already enabled."}, status=400)
    if not user.totp_secret:
        return Response({"detail": "Start setup before confirming."}, status=400)

    serializer = TwoFactorConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if not verify_totp_code(user.totp_secret, serializer.validated_data["code"]):
        return Response({"detail": "Invalid code. Check your authenticator app and try again."}, status=400)

    backup_codes = generate_backup_codes()
    user.is_2fa_enabled = True
    user.backup_codes = hash_backup_codes(backup_codes)
    user.save(update_fields=["is_2fa_enabled", "backup_codes"])

    return Response(
        {
            "detail": "Two-factor authentication enabled.",
            "backup_codes": backup_codes,
            "user": UserSerializer(user).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    user = request.user
    if not user.is_2fa_enabled:
        return Response({"detail": "Two-factor authentication is not enabled."}, status=400)

    serializer = TwoFactorDisableSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)

    user.totp_secret = ""
    user.is_2fa_enabled = False
    user.backup_codes = []
    user.save(update_fields=["totp_secret", "is_2fa_enabled", "backup_codes"])

    return Response(
        {
            "detail": "Two-factor authentication disabled.",
            "user": UserSerializer(user).data,
        }
    )
