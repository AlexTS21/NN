from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('crear_red/', views.crear_red, name='crear_red'),
    path('entrenar_paso/', views.entrenar_paso, name='entrenar_paso'),
]