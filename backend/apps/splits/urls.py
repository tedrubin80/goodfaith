from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("sheets", views.SplitSheetViewSet, basename="split-sheet")

urlpatterns = [
    path("", include(router.urls)),
]
