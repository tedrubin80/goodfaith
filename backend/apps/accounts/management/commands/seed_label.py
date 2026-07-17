from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from apps.accounts.models import Role, User
from apps.catalog.models import Artist, Label, LabelMembership, Release, ReleaseType, Track


class Command(BaseCommand):
    help = "Create a label with a manager user (and optional demo catalog) for first-time setup."

    def add_arguments(self, parser):
        parser.add_argument("--label-name", required=True, help="Display name for the label.")
        parser.add_argument("--label-slug", help="URL slug (auto-generated from name if omitted).")
        parser.add_argument("--manager-username", required=True)
        parser.add_argument("--manager-password", required=True)
        parser.add_argument("--manager-email", default="", help="Optional manager email.")
        parser.add_argument(
            "--demo",
            action="store_true",
            help="Seed a demo artist, release, and track for walkthrough testing.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        label_name: str = options["label_name"].strip()
        label_slug: str = options["label_slug"] or slugify(label_name)
        username: str = options["manager_username"].strip()
        password: str = options["manager_password"]

        if Label.objects.filter(slug=label_slug).exists():
            raise CommandError(f"Label slug '{label_slug}' already exists.")
        if User.objects.filter(username=username).exists():
            raise CommandError(f"User '{username}' already exists.")

        label = Label.objects.create(name=label_name, slug=label_slug)
        manager = User.objects.create_user(
            username=username,
            password=password,
            email=options["manager_email"],
            role=Role.MANAGER,
        )
        LabelMembership.objects.create(user=manager, label=label)

        self.stdout.write(self.style.SUCCESS(f"Label created: {label.name} (id={label.pk})"))
        self.stdout.write(self.style.SUCCESS(f"Manager user: {manager.username} (role=manager)"))

        if options["demo"]:
            artist = Artist.objects.create(
                label=label,
                name="Demo Artist",
                slug="demo-artist",
            )
            release = Release.objects.create(
                label=label,
                primary_artist=artist,
                title="Demo Single",
                release_type=ReleaseType.SINGLE,
                upc="123456789012",
            )
            Track.objects.create(
                release=release,
                title="Demo Track",
                isrc="USRC17607801",
                track_number=1,
                duration_seconds=210,
            )
            self.stdout.write(self.style.SUCCESS("Demo catalog: Demo Artist / Demo Single / Demo Track"))

        self.stdout.write("")
        self.stdout.write("Sign in at the portal with the manager credentials above.")
