from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import RiderProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ("id",)
    list_display = ("id", "phone_number", "role", "is_staff", "otp_verified")
    search_fields = ("phone_number",)
    fieldsets = (
        (None, {"fields": ("phone_number", "password", "role", "otp_code", "otp_verified")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone_number", "role", "password1", "password2"),
            },
        ),
    )


@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "is_online", "bike_number", "current_lat", "current_lng")
