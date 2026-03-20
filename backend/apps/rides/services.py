from math import asin, cos, radians, sin, sqrt

from django.conf import settings

from apps.accounts.models import RiderProfile


def haversine_distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    earth_radius_km = 6371
    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)
    a = (
        sin(delta_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(delta_lng / 2) ** 2
    )
    return 2 * earth_radius_km * asin(sqrt(a))


def calculate_fare(distance_km: float) -> float:
    return settings.BASE_FARE_NAIRA + (settings.PER_KM_RATE_NAIRA * distance_km)


def find_nearest_riders(lat: float, lng: float, limit: int = 5):
    riders = RiderProfile.objects.filter(is_online=True).select_related("user")
    ranked = []
    for rider in riders:
        distance = haversine_distance_km(lat, lng, rider.current_lat, rider.current_lng)
        ranked.append((distance, rider))
    ranked.sort(key=lambda item: item[0])
    return ranked[:limit]
