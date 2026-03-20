from django.urls import path

from .views import MeView, OTPRequestView, OTPVerifyView, RegisterView, ToggleRiderStatusView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("otp/request/", OTPRequestView.as_view(), name="otp-request"),
    path("otp/verify/", OTPVerifyView.as_view(), name="otp-verify"),
    path("me/", MeView.as_view(), name="me"),
    path("rider/toggle-status/", ToggleRiderStatusView.as_view(), name="toggle-rider-status"),
]
