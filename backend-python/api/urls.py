from django.urls import path
from . import views

urlpatterns = [
    path("reset", views.reset_account, name="reset_account"),
    path("account", views.get_account, name="get_account"),
    path("transactions", views.get_transactions, name="get_transactions"),
    path("buy", views.buy_shares, name="buy_shares"),
    path("sell", views.sell_shares, name="sell_shares"),
    path("price/<str:symbol>", views.get_price, name="get_price"),
    path("history/<str:symbol>", views.get_history, name="get_history"),
]
