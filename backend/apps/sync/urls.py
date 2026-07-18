from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("opportunities", views.SyncOpportunityViewSet, basename="sync-opportunity")

urlpatterns = [
    path("", include(router.urls)),
]
