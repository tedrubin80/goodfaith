from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("events", views.AuditEventViewSet, basename="audit-event")

urlpatterns = [
    path("", include(router.urls)),
]
