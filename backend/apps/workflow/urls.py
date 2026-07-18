from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("tasks", views.ReleaseTaskViewSet, basename="release-task")

urlpatterns = [path("", include(router.urls))]
