import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("catalog", "0002_track_iswc"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Contract",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=512)),
                ("contract_type", models.CharField(choices=[("recording", "Recording"), ("distribution", "Distribution"), ("license", "License"), ("sync", "Sync"), ("publishing", "Publishing"), ("other", "Other")], default="recording", max_length=16)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("active", "Active"), ("expired", "Expired"), ("terminated", "Terminated")], default="draft", max_length=16)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("term_notes", models.TextField(blank=True, help_text="Key terms, recoupment notes, territories, or obligations.")),
                ("file", models.FileField(blank=True, help_text="Signed contract PDF or scan.", null=True, upload_to="contracts/%Y/%m/")),
                ("artist", models.ForeignKey(blank=True, help_text="Primary artist on this deal, when applicable.", null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contracts", to="catalog.artist")),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="contracts_created", to=settings.AUTH_USER_MODEL)),
                ("label", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="contracts", to="catalog.label")),
            ],
            options={
                "ordering": ("-created_at", "title"),
            },
        ),
    ]
