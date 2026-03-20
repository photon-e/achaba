import random

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import RiderProfile
from .serializers import (
    OTPRequestSerializer,
    OTPVerifySerializer,
    RegisterSerializer,
    RiderStatusSerializer,
    UserSerializer,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "token": token.key,
                "message": "Registration successful",
            },
            status=status.HTTP_201_CREATED,
        )


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        user, _ = User.objects.get_or_create(
            phone_number=phone_number,
            defaults={"role": User.Role.CUSTOMER, "otp_verified": False},
        )
        otp_code = f"{random.randint(0, 999999):06d}"
        user.otp_code = otp_code
        user.save(update_fields=["otp_code"])
        return Response(
            {
                "message": "OTP generated for MVP flow",
                "phone_number": phone_number,
                "otp_code": otp_code,
            }
        )


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        otp_code = serializer.validated_data["otp_code"]
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if user.otp_code != otp_code:
            return Response({"detail": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        user.otp_verified = True
        user.save(update_fields=["otp_verified"])
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ToggleRiderStatusView(APIView):
    def post(self, request):
        if request.user.role != User.Role.RIDER:
            return Response({"detail": "Only riders can toggle status"}, status=status.HTTP_403_FORBIDDEN)

        profile = request.user.rider_profile
        serializer = RiderStatusSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Rider status updated", "profile": serializer.data})
