"""
hydrafloodviewer URL Configuration
"""
from __future__ import absolute_import, print_function, unicode_literals

from cms.sitemaps import CMSSitemap
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.static import serve
from django.views.generic import TemplateView
from mapclient import api as mapclient_api
from mapclient import controllers as controllers
admin.autodiscover()

urlpatterns = [
    url(r'^sitemap\.xml$', sitemap,
        {'sitemaps': {'cmspages': CMSSitemap}}),

]

urlpatterns += i18n_patterns(
    url(r'^admin/', include(admin.site.urls)),  # NOQA
    url(r'^$', TemplateView.as_view(template_name="home.html")),
    url(r'^home/', TemplateView.as_view(template_name="home.html")),
    url(r'^mapviewer/', TemplateView.as_view(template_name="map.html")),
    url(r'^usecase-viewer/', TemplateView.as_view(template_name="usecase-viewer.html")),
    url(r'^api/mapclient/$', mapclient_api.api),
    """  url(r'^usecase/', TemplateView.as_view(template_name="usecase.html")) """
    """  url(r'^usecase-viewer/', controllers.mapviewer, name='usecase-viewer') """
)
