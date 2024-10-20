from django.db import models
from django.utils import timezone


class Balance(models.Model):
    id = models.IntegerField(primary_key=True)
    amount = models.FloatField()


class Portfolio(models.Model):
    symbol = models.CharField(max_length=10, primary_key=True)
    quantity = models.IntegerField()


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ("buy", "Buy"),
        ("sell", "Sell"),
    ]
    type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    symbol = models.CharField(max_length=10)
    price = models.FloatField()
    quantity = models.IntegerField()
    date = models.DateTimeField(default=timezone.now)
