import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Balance, Portfolio, Transaction
from django.db import transaction as db_transaction
import yfinance as yf
from datetime import datetime
from django.views.generic import TemplateView


# Endpoint to reset account
@csrf_exempt
def reset_account(request):
    if request.method == "POST":
        try:
            with db_transaction.atomic():
                # Reset balance
                balance = Balance.objects.get(id=1)
                balance.amount = 100000
                balance.save()

                # Clear portfolio and transactions
                Portfolio.objects.all().delete()
                Transaction.objects.all().delete()

            return JsonResponse({"message": "Account has been reset."})
        except Exception as e:
            print("Error resetting account:", e)
            return JsonResponse({"error": "Failed to reset account."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to get current balance and portfolio
def get_account(request):
    if request.method == "GET":
        try:
            balance = Balance.objects.get(id=1)
            portfolio_items = Portfolio.objects.all()
            portfolio = {item.symbol: item.quantity for item in portfolio_items}
            return JsonResponse({"balance": balance.amount, "portfolio": portfolio})
        except Exception as e:
            print("Error fetching account data:", e)
            return JsonResponse({"error": "Failed to fetch account data."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to get transaction history
def get_transactions(request):
    if request.method == "GET":
        try:
            transactions = Transaction.objects.all().order_by("-date", "-id")
            transactions_list = [
                {
                    "type": t.type,
                    "symbol": t.symbol,
                    "price": t.price,
                    "quantity": t.quantity,
                    "date": t.date.isoformat(),
                }
                for t in transactions
            ]
            return JsonResponse(transactions_list, safe=False)
        except Exception as e:
            print("Error fetching transactions:", e)
            return JsonResponse({"error": "Failed to fetch transactions."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to buy shares
@csrf_exempt
def buy_shares(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            symbol = data.get("symbol")
            quantity = data.get("quantity")

            if not symbol or not isinstance(symbol, str):
                return JsonResponse({"error": "Invalid symbol."}, status=400)
            if not quantity or not isinstance(quantity, int) or quantity < 1:
                return JsonResponse({"error": "Invalid quantity."}, status=400)

            stock = yf.Ticker(symbol)
            hist = stock.history(period="1d")
            if hist.empty:
                return JsonResponse({"error": "No price data available."}, status=400)

            price = hist["Close"].iloc[-1]

            cost = price * quantity

            with db_transaction.atomic():
                balance = Balance.objects.get(id=1)
                if balance.amount < cost:
                    return JsonResponse({"error": "Insufficient funds."}, status=400)

                # Update balance
                balance.amount -= cost
                balance.save()

                # Update portfolio
                portfolio_item, created = Portfolio.objects.get_or_create(
                    symbol=symbol, defaults={"quantity": 0}
                )
                portfolio_item.quantity += quantity
                portfolio_item.save()

                # Insert transaction
                Transaction.objects.create(
                    type="buy",
                    symbol=symbol,
                    price=price,
                    quantity=quantity,
                )

            return JsonResponse({"message": "Purchase successful.", "price": price})
        except Exception as e:
            print("Error buying shares:", e)
            return JsonResponse({"error": "Failed to complete purchase."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to sell shares
@csrf_exempt
def sell_shares(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            symbol = data.get("symbol")
            quantity = data.get("quantity")

            if not symbol or not isinstance(symbol, str):
                return JsonResponse({"error": "Invalid symbol."}, status=400)
            if not quantity or not isinstance(quantity, int) or quantity < 1:
                return JsonResponse({"error": "Invalid quantity."}, status=400)

            stock = yf.Ticker(symbol)
            hist = stock.history(period="1d")
            if hist.empty:
                return JsonResponse({"error": "No price data available."}, status=400)

            price = hist["Close"].iloc[-1]
            if price is None:
                return JsonResponse({"error": "Invalid price data."}, status=400)

            with db_transaction.atomic():
                portfolio_item = Portfolio.objects.get(symbol=symbol)
                if portfolio_item.quantity < quantity:
                    return JsonResponse({"error": "Insufficient shares."}, status=400)

                proceeds = price * quantity

                # Update balance
                balance = Balance.objects.get(id=1)
                balance.amount += proceeds
                balance.save()

                # Update portfolio
                portfolio_item.quantity -= quantity
                if portfolio_item.quantity == 0:
                    portfolio_item.delete()
                else:
                    portfolio_item.save()

                # Insert transaction
                Transaction.objects.create(
                    type="sell",
                    symbol=symbol,
                    price=price,
                    quantity=quantity,
                )

            return JsonResponse({"message": "Sale successful.", "price": price})
        except Exception as e:
            print("Error selling shares:", e)
            return JsonResponse({"error": "Failed to complete sale."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to get current price of an instrument
def get_price(request, symbol):
    if request.method == "GET":
        try:
            stock = yf.Ticker(symbol)
            fast_info = stock.fast_info
            price = fast_info.get("lastPrice")

            if price is None:
                return JsonResponse({"error": "Invalid price data."}, status=400)
            return JsonResponse({"price": price})
        except Exception as e:
            print("Error fetching price data:", e)
            return JsonResponse({"error": "Error fetching price data."}, status=500)
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Endpoint to get historical data of an instrument
def get_history(request, symbol):
    if request.method == "GET":
        try:
            period1 = request.GET.get("period1", "2020-01-01")
            period2 = request.GET.get("period2", datetime.now().strftime("%Y-%m-%d"))
            interval = request.GET.get("interval", "1d")

            stock = yf.Ticker(symbol)
            history = stock.history(start=period1, end=period2, interval=interval)

            if history.empty:
                return JsonResponse({"error": "No historical data found."}, status=400)

            history.reset_index(inplace=True)
            data = history.to_dict(orient="records")

            return JsonResponse(data, safe=False)
        except Exception as e:
            print("Error fetching historical data:", e)
            return JsonResponse(
                {"error": "Error fetching historical data."}, status=500
            )
    else:
        return JsonResponse({"error": "Invalid request method."}, status=405)


# Frontend view to serve React app
class FrontendAppView(TemplateView):
    template_name = "index.html"
