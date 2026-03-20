from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import RiderProfile


User = get_user_model()


class RiderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiderProfile
        fields = ("is_online", "bike_number", "phone", "current_lat", "current_lng", "rating")


class UserSerializer(serializers.ModelSerializer):
    rider_profile = RiderProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "phone_number", "role", "rider_profile")


class RegisterSerializer(serializers.ModelSerializer):
    bike_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ("phone_number", "role", "password", "bike_number")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        bike_number = validated_data.pop("bike_number", "")
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password, otp_verified=True)
        if user.role == User.Role.RIDER:
            RiderProfile.objects.create(
                user=user,
                bike_number=bike_number or f"OKD-{user.id:04d}",
                phone=user.phone_number,
            )
        return user


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    otp_code = serializers.CharField(max_length=6)


class RiderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiderProfile
        fields = ("is_online", "current_lat", "current_lng")
