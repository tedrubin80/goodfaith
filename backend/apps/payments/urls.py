from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("batches", views.PayoutBatchViewSet, basename="payout-batch")
router.register("payouts", views.PayoutViewSet, basename="payout")

urlpatterns = [
    path("", include(router.urls)),
]
