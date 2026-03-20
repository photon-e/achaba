from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.serializers import RiderProfileSerializer, UserSerializer

from .models import Ride
from .services import calculate_fare, haversine_distance_km


User = get_user_model()


class RideSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    rider = UserSerializer(read_only=True)

    class Meta:
        model = Ride
        fields = (
            "id",
            "user",
            "rider",
            "pickup_lat",
            "pickup_lng",
            "destination_lat",
            "destination_lng",
            "status",
            "fare",
            "distance_km",
            "rating",
            "created_at",
            "accepted_at",
            "started_at",
            "completed_at",
            "updated_at",
        )


class RideRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ride
        fields = ("pickup_lat", "pickup_lng", "destination_lat", "destination_lng")

    def create(self, validated_data):
        distance_km = haversine_distance_km(
            validated_data["pickup_lat"],
            validated_data["pickup_lng"],
            validated_data["destination_lat"],
            validated_data["destination_lng"],
        )
        return Ride.objects.create(
            user=self.context["request"].user,
            distance_km=distance_km,
            fare=calculate_fare(distance_km),
            **validated_data,
        )


class RideActionSerializer(serializers.Serializer):
    ride_id = serializers.IntegerField()


class NearbyRiderSerializer(serializers.Serializer):
    rider = RiderProfileSerializer()
    distance_km = serializers.FloatField()
