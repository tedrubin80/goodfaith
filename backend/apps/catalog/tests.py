from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role

from .models import Artist, Label, LabelMembership, Release, ReleaseType, Track

User = get_user_model()


class CatalogModelTests(TestCase):
    def test_release_track_relationship(self):
        label = Label.objects.create(name="Test Label", slug="test-label")
        artist = Artist.objects.create(label=label, name="Test Artist", slug="test-artist")
        release = Release.objects.create(
            label=label,
            primary_artist=artist,
            title="Test Release",
            release_type=ReleaseType.SINGLE,
            upc="123456789012",
        )
        track = Track.objects.create(
            release=release,
            title="Test Track",
            isrc="USRC17607839",
            track_number=1,
            duration_seconds=210,
        )

        self.assertEqual(release.tracks.get(), track)
        self.assertEqual(track.release, release)


class CatalogAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Good Faith Demo", slug="good-faith-demo")
        self.manager = User.objects.create_user(
            username="manager",
            password="testpass123",
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)
        self.artist_user = User.objects.create_user(
            username="artist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Demo Artist",
            slug="demo-artist",
            user=self.artist_user,
        )
        self.client = APIClient()

    def test_manager_can_create_artist(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/catalog/artists/",
            {"label": self.label.pk, "name": "New Artist", "slug": "new-artist"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Artist.objects.filter(slug="new-artist").count(), 1)

    def test_artist_cannot_create_artist(self):
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.post(
            "/api/catalog/artists/",
            {"label": self.label.pk, "name": "Blocked", "slug": "blocked"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_artist_sees_only_own_releases(self):
        other_artist = Artist.objects.create(
            label=self.label,
            name="Other Artist",
            slug="other-artist",
        )
        Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="Mine",
            release_type=ReleaseType.SINGLE,
        )
        Release.objects.create(
            label=self.label,
            primary_artist=other_artist,
            title="Theirs",
            release_type=ReleaseType.SINGLE,
        )

        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/catalog/releases/")
        self.assertEqual(response.status_code, 200)
        titles = {item["title"] for item in response.data}
        self.assertEqual(titles, {"Mine"})

    def test_unauthenticated_cannot_access_catalog(self):
        response = self.client.get("/api/catalog/artists/")
        self.assertEqual(response.status_code, 403)
