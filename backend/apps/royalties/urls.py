from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("statements", views.RoyaltyStatementViewSet, basename="royalty-statement")
router.register("runs", views.RoyaltyRunViewSet, basename="royalty-run")

urlpatterns = [
    path("my-earnings/", views.MyEarningsView.as_view(), name="royalty-my-earnings"),
    path("", include(router.urls)),
]
