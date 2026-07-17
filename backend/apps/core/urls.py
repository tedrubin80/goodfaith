from django.urls import path

from . import export_views, views

urlpatterns = [
    path("health/", views.health_check, name="health-check"),
    path("export/", export_views.LabelExportView.as_view(), name="label-export"),
]
