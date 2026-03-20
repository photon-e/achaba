from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import RiderProfile

from .firebase import publish_ride_update
from .models import Ride
from .serializers import NearbyRiderSerializer, RideActionSerializer, RideRequestSerializer, RideSerializer
from .services import find_nearest_riders


User = get_user_model()


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.CUSTOMER


class IsRider(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.RIDER


class RideRequestView(generics.CreateAPIView):
    serializer_class = RideRequestSerializer
    permission_classes = [IsCustomer]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ride = serializer.save()
        nearest_riders = find_nearest_riders(ride.pickup_lat, ride.pickup_lng, limit=1)
        assigned_rider = None
        if nearest_riders:
            _, profile = nearest_riders[0]
            assigned_rider = profile.user
            ride.rider = assigned_rider
            ride.save(update_fields=["rider", "updated_at"])
            publish_ride_update(
                f"rider-{assigned_rider.id}",
                {"event": "ride_requested", "ride_id": ride.id, "status": ride.status},
            )
        data = RideSerializer(ride).data
        return Response(
            {
                "ride": data,
                "auto_assigned_rider_id": assigned_rider.id if assigned_rider else None,
                "message": "Ride created successfully",
            },
            status=status.HTTP_201_CREATED,
        )


class NearbyRidersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        lat = float(request.query_params.get("lat", 6.5244))
        lng = float(request.query_params.get("lng", 3.3792))
        nearby = find_nearest_riders(lat, lng, limit=5)
        serializer = NearbyRiderSerializer(
            [{"rider": item[1], "distance_km": round(item[0], 2)} for item in nearby],
            many=True,
        )
        return Response(serializer.data)


class RideActionBaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    allowed_from_statuses: tuple[str, ...] = ()
    target_status: str = ""
    timestamp_field: str = ""

    def post(self, request):
        serializer = RideActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ride = generics.get_object_or_404(Ride, id=serializer.validated_data["ride_id"])
        self.validate_actor(request.user, ride)
        if ride.status not in self.allowed_from_statuses:
            return Response(
                {"detail": f"Ride must be in {', '.join(self.allowed_from_statuses)} state"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ride.status = self.target_status
        if self.timestamp_field:
            setattr(ride, self.timestamp_field, timezone.now())
        if self.target_status == Ride.Status.ACCEPTED and not ride.rider:
            ride.rider = request.user
        ride.save()
        publish_ride_update(f"ride-{ride.id}", {"event": "ride_status_changed", "status": ride.status})
        return Response({"message": f"Ride {self.target_status}", "ride": RideSerializer(ride).data})

    def validate_actor(self, user, ride: Ride):
        raise NotImplementedError


class RideAcceptView(RideActionBaseView):
    permission_classes = [IsRider]
    allowed_from_statuses = (Ride.Status.REQUESTED,)
    target_status = Ride.Status.ACCEPTED
    timestamp_field = "accepted_at"

    def validate_actor(self, user, ride: Ride):
        if not RiderProfile.objects.filter(user=user, is_online=True).exists():
            raise PermissionDenied("Rider must be online to accept rides")
        if ride.rider and ride.rider != user:
            raise PermissionDenied("Ride assigned to another rider")


class RideStartView(RideActionBaseView):
    permission_classes = [IsRider]
    allowed_from_statuses = (Ride.Status.ACCEPTED,)
    target_status = Ride.Status.ONGOING
    timestamp_field = "started_at"

    def validate_actor(self, user, ride: Ride):
        if ride.rider != user:
            raise PermissionDenied("Only assigned rider can start")


class RideCompleteView(RideActionBaseView):
    permission_classes = [IsRider]
    allowed_from_statuses = (Ride.Status.ONGOING,)
    target_status = Ride.Status.COMPLETED
    timestamp_field = "completed_at"

    def validate_actor(self, user, ride: Ride):
        if ride.rider != user:
            raise PermissionDenied("Only assigned rider can complete")


class RideHistoryView(generics.ListAPIView):
    serializer_class = RideSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.RIDER:
            return Ride.objects.filter(rider=user)
        return Ride.objects.filter(user=user)
