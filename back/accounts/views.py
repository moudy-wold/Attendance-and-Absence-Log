from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminUser
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    MessageResponseSerializer,
    RegisterSerializer,
    UpdateUserSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAdminUser]

    @extend_schema(responses={201: UserSerializer})
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UpdateUserView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UpdateUserSerializer
    permission_classes = [IsAdminUser]

    def _update(self, partial: bool) -> Response:
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=self.request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)

    @extend_schema(responses={200: UserSerializer})
    def put(self, request, *args, **kwargs):
        return self._update(partial=False)

    @extend_schema(responses={200: UserSerializer})
    def patch(self, request, *args, **kwargs):
        return self._update(partial=True)


class ChangePasswordView(APIView):
    @extend_schema(request=ChangePasswordSerializer, responses={200: MessageResponseSerializer})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Incorrect password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["new_password"])
        user.is_first_login = False
        user.save(update_fields=["password", "is_first_login"])
        return Response({"detail": "Password changed successfully."})


