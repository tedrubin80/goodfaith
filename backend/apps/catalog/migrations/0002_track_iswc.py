from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="track",
            name="iswc",
            field=models.CharField(
                blank=True,
                help_text="International Standard Musical Work Code (T-xxx.xxx.xxx-x).",
                max_length=15,
                null=True,
            ),
        ),
    ]
