from django.contrib import admin
from django.urls import path, include, re_path
from api.views import FrontendAppView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("api/", include("api.urls")),
    path("admin/", admin.site.urls),
    # Catch-all pattern for frontend routing
    re_path(r"^.*$", FrontendAppView.as_view(), name="frontend"),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
