from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("campaigns", views.MarketingCampaignViewSet, basename="marketing-campaign")

urlpatterns = [
    path("", include(router.urls)),
]
