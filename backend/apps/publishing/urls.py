from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("works", views.MusicalWorkViewSet, basename="musical-work")

urlpatterns = [
    path("", include(router.urls)),
]
