from django.http import HttpResponse
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import Mandatory2FAEnforced
from apps.catalog.models import Label
from apps.catalog.views import _user_label_ids

from .export import build_export_payload, export_filename, payload_to_csv_zip, payload_to_json


class LabelExportQuerySerializer(serializers.Serializer):
    label = serializers.IntegerField(required=False)
    export_format = serializers.ChoiceField(
        choices=["json", "csv"],
        default="json",
        required=False,
    )

    def validate(self, attrs):
        request = self.context["request"]
        label_ids = _user_label_ids(request.user)
        label_id = attrs.get("label")
        if label_id is None:
            if len(label_ids) != 1:
                raise serializers.ValidationError(
                    {"label": "Required when you belong to more than one label."}
                )
            attrs["label"] = label_ids[0]
        elif label_id not in label_ids:
            raise serializers.ValidationError({"label": "Label not accessible."})
        return attrs


class LabelExportView(APIView):
    """Full label data export in JSON or CSV (ZIP). Scope follows user role (Gap 6)."""

    permission_classes = [IsAuthenticated, Mandatory2FAEnforced]

    def get(self, request):
        if not request.user.label_memberships.exists():
            return Response({"detail": "No label membership."}, status=403)

        query = LabelExportQuerySerializer(data=request.query_params, context={"request": request})
        query.is_valid(raise_exception=True)

        label_id = query.validated_data["label"]
        try:
            label = Label.objects.get(pk=label_id)
        except Label.DoesNotExist:
            return Response({"detail": "Label not found."}, status=404)

        payload = build_export_payload(request.user, label)
        export_format = query.validated_data["export_format"]
        filename = export_filename(label, export_format)

        if export_format == "json":
            content = payload_to_json(payload)
            content_type = "application/json"
        else:
            content = payload_to_csv_zip(payload)
            content_type = "application/zip"

        response = HttpResponse(content, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
