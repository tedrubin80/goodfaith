from django.db import connection
from django.db.utils import OperationalError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from config.celery import app as celery_app


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    checks = {"database": _check_database(), "celery": _check_celery()}
    healthy = all(checks.values())
    return Response({"status": "ok" if healthy else "degraded", "checks": checks}, status=200 if healthy else 503)


def _check_database() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return True
    except OperationalError:
        return False


def _check_celery() -> bool:
    try:
        return bool(celery_app.control.ping(timeout=1.0))
    except Exception:
        return False
