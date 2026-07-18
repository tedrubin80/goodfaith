from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.accounts.models import Role
from apps.accounts.test_utils import satisfy_mandatory_2fa
from apps.catalog.models import Artist, Label, LabelMembership

from .models import LabelExpense, RecoupmentEntry, RecoupmentEntryType

User = get_user_model()


class ERPAPITests(TestCase):
    def setUp(self):
        self.label = Label.objects.create(name="ERP Label", slug="erp-label")
        self.finance = User.objects.create_user(
            username="erpfin",
            password="testpass123",
            role=Role.FINANCE,
        )
        satisfy_mandatory_2fa(self.finance)
        LabelMembership.objects.create(user=self.finance, label=self.label)

        self.ar_user = User.objects.create_user(
            username="erpar",
            password="testpass123",
            role=Role.AR,
        )
        LabelMembership.objects.create(user=self.ar_user, label=self.label)

        self.artist_user = User.objects.create_user(
            username="erpartist",
            password="testpass123",
            role=Role.ARTIST,
        )
        LabelMembership.objects.create(user=self.artist_user, label=self.label)
        self.artist = Artist.objects.create(
            label=self.label,
            name="ERP Act",
            slug="erp-act",
            user=self.artist_user,
        )
        self.client = APIClient()

    def test_finance_creates_expense_and_recoupment(self):
        self.client.force_authenticate(user=self.finance)
        expense = self.client.post(
            "/api/erp/expenses/",
            {
                "label": self.label.pk,
                "artist": self.artist.pk,
                "category": "advance",
                "description": "Signing advance",
                "amount": "5000.00",
                "incurred_on": "2026-01-15",
                "is_recoupable": True,
            },
            format="json",
        )
        self.assertEqual(expense.status_code, 201)

        entry = self.client.post(
            "/api/erp/recoupment/",
            {
                "label": self.label.pk,
                "artist": self.artist.pk,
                "entry_type": RecoupmentEntryType.CHARGE,
                "amount": "5000.00",
                "effective_on": "2026-01-15",
                "description": "Signing advance",
                "expense": expense.data["id"],
            },
            format="json",
        )
        self.assertEqual(entry.status_code, 201)

        credit = self.client.post(
            "/api/erp/recoupment/",
            {
                "label": self.label.pk,
                "artist": self.artist.pk,
                "entry_type": RecoupmentEntryType.CREDIT,
                "amount": "1200.00",
                "effective_on": "2026-03-01",
                "description": "Q1 royalty recoup",
            },
            format="json",
        )
        self.assertEqual(credit.status_code, 201)

        balances = self.client.get("/api/erp/recoupment/balances/")
        self.assertEqual(balances.status_code, 200)
        self.assertEqual(len(balances.data), 1)
        self.assertEqual(balances.data[0]["unrecouped"], "3800.00")

    def test_ar_denied(self):
        self.client.force_authenticate(user=self.ar_user)
        response = self.client.get("/api/erp/expenses/")
        self.assertEqual(response.status_code, 403)

    def test_artist_sees_own_recoupment_only(self):
        other = Artist.objects.create(label=self.label, name="Other", slug="other-erp")
        RecoupmentEntry.objects.create(
            label=self.label,
            artist=self.artist,
            entry_type=RecoupmentEntryType.CHARGE,
            amount=Decimal("1000.00"),
            effective_on=date(2026, 1, 1),
            description="Mine",
        )
        RecoupmentEntry.objects.create(
            label=self.label,
            artist=other,
            entry_type=RecoupmentEntryType.CHARGE,
            amount=Decimal("999.00"),
            effective_on=date(2026, 1, 1),
            description="Theirs",
        )
        self.client.force_authenticate(user=self.artist_user)
        response = self.client.get("/api/erp/recoupment/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["description"], "Mine")
