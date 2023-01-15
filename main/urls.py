from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('area', views.area, name='area'),
    path('items', views.items, name='items'),
    path('history', views.history, name='history'),
]