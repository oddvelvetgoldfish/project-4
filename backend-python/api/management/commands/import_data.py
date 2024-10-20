from django.core.management.base import BaseCommand
from api.models import Balance, Portfolio, Transaction
import csv
from django.utils import timezone
from datetime import datetime
from dateutil import parser  # Add this import if using dateutil


class Command(BaseCommand):
    help = "Import data from CSV files into the database"

    def handle(self, *args, **kwargs):
        # Import Balance
        with open("balance.csv", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                Balance.objects.update_or_create(
                    id=int(row["id"]), defaults={"amount": float(row["amount"])}
                )
        self.stdout.write(self.style.SUCCESS("Successfully imported Balance data"))

        # Import Portfolio
        with open("portfolio.csv", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                Portfolio.objects.update_or_create(
                    symbol=row["symbol"], defaults={"quantity": int(row["quantity"])}
                )
        self.stdout.write(self.style.SUCCESS("Successfully imported Portfolio data"))

        # Import Transactions
        with open("transactions.csv", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Parse the date string
                date_str = row["date"]

                # Option 1: Using datetime.strptime with updated format
                # parsed_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                # parsed_date = timezone.make_aware(parsed_date, timezone.utc)

                # Option 2: Using dateutil.parser.isoparse
                parsed_date = parser.isoparse(date_str)

                # Option 3: Handle optional milliseconds (if needed)
                # date_str = date_str.rstrip('Z')
                # try:
                #     parsed_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%f")
                # except ValueError:
                #     parsed_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
                # parsed_date = timezone.make_aware(parsed_date, timezone.utc)

                Transaction.objects.update_or_create(
                    id=int(row["id"]),
                    defaults={
                        "type": row["type"],
                        "symbol": row["symbol"],
                        "price": float(row["price"]),
                        "quantity": int(row["quantity"]),
                        "date": parsed_date,
                    },
                )
        self.stdout.write(self.style.SUCCESS("Successfully imported Transactions data"))
