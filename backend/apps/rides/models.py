from django.conf import settings
from django.db import models


class Ride(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        ACCEPTED = "accepted", "Accepted"
        ONGOING = "ongoing", "Ongoing"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="customer_rides")
    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_rides",
    )
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    destination_lat = models.FloatField()
    destination_lng = models.FloatField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    fare = models.DecimalField(max_digits=10, decimal_places=2)
    distance_km = models.FloatField(default=0)
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"Ride<{self.id}> {self.status}"
