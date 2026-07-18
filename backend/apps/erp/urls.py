from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("expenses", views.LabelExpenseViewSet, basename="erp-expense")
router.register("budgets", views.BudgetViewSet, basename="erp-budget")
router.register("recoupment", views.RecoupmentEntryViewSet, basename="erp-recoupment")

urlpatterns = [
    path("", include(router.urls)),
]
