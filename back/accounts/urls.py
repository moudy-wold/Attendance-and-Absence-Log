from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ChangePasswordView, LoginView, RegisterView, UpdateUserView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", RegisterView.as_view(), name="register"),
    path("users/<int:pk>/", UpdateUserView.as_view(), name="user_update"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
