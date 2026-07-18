from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("obligations", views.ContractObligationViewSet, basename="contract-obligation")
router.register("", views.ContractViewSet, basename="contract")

urlpatterns = [
    path("", include(router.urls)),
]
