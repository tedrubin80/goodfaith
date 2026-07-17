from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.login, name="auth-login"),
    path("2fa/verify/", views.verify_2fa, name="auth-2fa-verify"),
    path("2fa/setup/", views.setup_2fa, name="auth-2fa-setup"),
    path("2fa/confirm/", views.confirm_2fa, name="auth-2fa-confirm"),
    path("2fa/disable/", views.disable_2fa, name="auth-2fa-disable"),
    path("password/", views.change_password, name="auth-change-password"),
    path("logout/", views.logout, name="auth-logout"),
    path("me/", views.me, name="auth-me"),
]
