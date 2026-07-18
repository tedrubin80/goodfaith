from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/royalties/", include("apps.royalties.urls")),
    path("api/splits/", include("apps.splits.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/contracts/", include("apps.contracts.urls")),
    path("api/publishing/", include("apps.publishing.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/ar/", include("apps.ar.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
    path("api/sync/", include("apps.sync.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
