from django.db import migrations


def initialize_balance(apps, schema_editor):
    Balance = apps.get_model("api", "Balance")
    Balance.objects.create(id=1, amount=100000)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(initialize_balance),
    ]
