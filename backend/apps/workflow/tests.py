from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.catalog.models import Artist, Label, LabelMembership, Release

from .models import ReleaseTask, TaskStatus

User = get_user_model()


class WorkflowAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="WF Label", slug="wf-label")
        self.manager = User.objects.create_user(
            username="wfmgr", password="testpass123", role=Role.MANAGER
        )
        LabelMembership.objects.create(user=self.manager, label=self.label)
        self.artist_user = User.objects.create_user(
            username="wfartist", password="testpass123", role=Role.ARTIST
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label, name="WF Act", slug="wf-act", user=self.artist_user
        )
        self.release = Release.objects.create(
            label=self.label,
            primary_artist=self.artist,
            title="WF Single",
            release_type="single",
        )
        self.client = APIClient()

    def test_manager_creates_task(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/workflow/tasks/",
            {
                "label": self.label.pk,
                "release": self.release.pk,
                "title": "Deliver masters",
                "status": TaskStatus.TODO,
                "priority": "high",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ReleaseTask.objects.count(), 1)

    def test_artist_sees_own_release_tasks(self):
        other = Artist.objects.create(label=self.label, name="Other", slug="wf-other")
        other_rel = Release.objects.create(
            label=self.label, primary_artist=other, title="Other", release_type="ep"
        )
        ReleaseTask.objects.create(
            label=self.label, release=self.release, title="Mine", created_by=self.manager
        )
        ReleaseTask.objects.create(
            label=self.label, release=other_rel, title="Theirs", created_by=self.manager
        )
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/workflow/tasks/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Mine")
