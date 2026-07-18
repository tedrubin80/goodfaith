import tempfile
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership

from .models import AssetType, DigitalAsset

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class DAMAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="DAM Label", slug="dam-label")
        self.manager = User.objects.create_user(
            username="dammgr", password="testpass123", role=Role.MANAGER
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label, name="DAM Act", slug="dam-act"
        )
        self.client = APIClient()

    def test_manager_uploads_asset(self):
        self.client.force_authenticate(user=self.manager)
        upload = SimpleUploadedFile("master.wav", b"RIFF....WAVE", content_type="audio/wav")
        response = self.client.post(
            "/api/dam/assets/",
            {
                "label": self.label.pk,
                "artist": self.artist.pk,
                "asset_type": AssetType.MASTER,
                "title": "Master v1",
                "version_label": "v1",
                "file": upload,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(DigitalAsset.objects.count(), 1)
        asset = DigitalAsset.objects.get()
        self.assertTrue(Path(asset.file.path).exists())
