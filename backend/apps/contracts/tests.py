from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.catalog.models import Artist, Label, LabelMembership

from .models import Contract, ContractStatus, ContractType

User = get_user_model()


class ContractAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="Contract Label", slug="contract-label")
        self.manager = User.objects.create_user(
            username="contractmgr",
            password="testpass123",
            role=Role.MANAGER,
        )
        satisfy_mandatory_2fa(self.manager)
        LabelMembership.objects.create(user=self.manager, label=self.label)

        self.ar_user = User.objects.create_user(
            username="contractar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.artist_user = User.objects.create_user(
            username="contractartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="Signed Artist",
            slug="signed-artist",
            user=self.artist_user,
        )
        self.client = APIClient()

    def test_manager_creates_contract(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.post(
            "/api/contracts/",
            {
                "label": self.label.pk,
                "artist": self.artist.pk,
                "title": "2026 Recording Deal",
                "contract_type": ContractType.RECORDING,
                "status": ContractStatus.ACTIVE,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Contract.objects.count(), 1)

    def test_ar_can_create_draft_contract(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.post(
            "/api/contracts/",
            {
                "label": self.label.pk,
                "title": "Pending Sync License",
                "contract_type": ContractType.SYNC,
                "status": ContractStatus.DRAFT,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_artist_sees_only_own_contracts(self):
        Contract.objects.create(
            label=self.label,
            artist=self.artist,
            title="My Deal",
            contract_type=ContractType.RECORDING,
        )
        Contract.objects.create(
            label=self.label,
            title="Label Distribution Agreement",
            contract_type=ContractType.DISTRIBUTION,
        )
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/contracts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "My Deal")
