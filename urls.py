from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('upload/', views.upload_doc, name='upload'),
    path('ask/', views.ask, name='ask'),
    path('clear/', views.clear_kb, name='clear'),
]