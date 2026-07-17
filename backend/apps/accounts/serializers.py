from django.contrib.auth.hashers import check_password
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from rest_framework import serializers

from .models import User
from .permissions import role_requires_2fa
from .totp import verify_totp_code
from .two_factor import verify_backup_code


class UserSerializer(serializers.ModelSerializer):
    requires_2fa = serializers.BooleanField(read_only=True)
    must_enable_2fa = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_2fa_enabled",
            "requires_2fa",
            "must_enable_2fa",
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.")
        attrs["user"] = user
        return attrs


class TwoFactorVerifySerializer(serializers.Serializer):
    pending_token = serializers.CharField()
    code = serializers.CharField()

    def validate_code(self, value: str) -> str:
        normalized = value.strip().replace(" ", "")
        if not normalized:
            raise serializers.ValidationError("Enter your 6-digit code or backup code.")
        return normalized


class TwoFactorConfirmSerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value: str) -> str:
        normalized = value.strip().replace(" ", "")
        if not normalized.isdigit() or len(normalized) != 6:
            raise serializers.ValidationError("Enter the 6-digit code from your authenticator app.")
        return normalized


class TwoFactorDisableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    code = serializers.CharField()

    def validate(self, attrs):
        user = self.context["request"].user
        if not check_password(attrs["password"], user.password):
            raise serializers.ValidationError({"password": "Incorrect password."})
        if role_requires_2fa(user.role):
            raise serializers.ValidationError(
                "Two-factor authentication cannot be disabled for your role."
            )
        code = attrs["code"].strip().replace(" ", "")
        if user.totp_secret and verify_totp_code(user.totp_secret, code):
            attrs["verified"] = True
            return attrs
        ok, _ = verify_backup_code(user.backup_codes or [], code)
        if ok:
            attrs["verified"] = True
            return attrs
        raise serializers.ValidationError({"code": "Invalid authenticator or backup code."})


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not check_password(value, user.password):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value: str) -> str:
        if value == self.initial_data.get("current_password"):
            raise serializers.ValidationError("New password must differ from the current password.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
