"""
URL configuration for the core app
"""

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('trips/', views.trips, name='trips'),  # GET: list trips, POST: create trip
    path('trips/<int:trip_id>/', views.trip_detail, name='trip-detail'),  # GET: trip details
    path('routes/calculate/', views.calculate_route_api, name='calculate-route'),
    path('test-cors/', views.test_cors, name='test-cors'),  # Test CORS endpoint
    path('test-middleware/', views.test_middleware, name='test-middleware'),  # Test middleware
    path('cors-options/', views.cors_options, name='cors-options'),  # CORS preflight
]
