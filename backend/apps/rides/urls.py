from django.urls import path

from .views import (
    NearbyRidersView,
    RideAcceptView,
    RideCompleteView,
    RideHistoryView,
    RideRequestView,
    RideStartView,
)


urlpatterns = [
    path("request/", RideRequestView.as_view(), name="ride-request"),
    path("nearby-riders/", NearbyRidersView.as_view(), name="nearby-riders"),
    path("accept/", RideAcceptView.as_view(), name="ride-accept"),
    path("start/", RideStartView.as_view(), name="ride-start"),
    path("complete/", RideCompleteView.as_view(), name="ride-complete"),
    path("history/", RideHistoryView.as_view(), name="ride-history"),
]
