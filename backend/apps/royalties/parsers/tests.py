from decimal import Decimal
from io import StringIO

import pandas as pd
from django.test import TestCase

from apps.royalties.models import Distributor
from apps.royalties.parsers.aliases import aliases_for
from apps.royalties.parsers.base import build_column_map, normalize_rows


class ParserAliasTests(TestCase):
    def test_fuga_headers_map(self):
        columns = [
            "Reporting Month",
            "Digital Service Provider",
            "Territory",
            "Track Artist",
            "Track Title",
            "ISRC Code",
            "UPC Code",
            "Units",
            "Net Amount",
        ]
        column_map = build_column_map(columns, aliases_for(Distributor.FUGA))
        self.assertIn("amount", column_map)
        self.assertIn("isrc", column_map)
        self.assertIn("track_title", column_map)

    def test_the_orchard_headers_map(self):
        columns = [
            "Period",
            "Digital Store",
            "Country of Sale",
            "Track Artist",
            "Track Title",
            "ISRC",
            "Product UPC",
            "Stream Count",
            "Label Share Net Receipts",
        ]
        column_map = build_column_map(columns, aliases_for(Distributor.THE_ORCHARD))
        self.assertIn("amount", column_map)
        self.assertEqual(column_map["amount"], "Label Share Net Receipts")

    def test_toolost_csv_normalizes_rows(self):
        csv_data = """Period,Platform,Country,Artist Name,Track Title,ISRC,UPC,Streams,Net Revenue
2024-01,Spotify,US,Test Artist,Test Song,USRC17607899,123456789012,1000,12.50
"""
        df = pd.read_csv(StringIO(csv_data), dtype=str)
        rows, skipped = normalize_rows(df, aliases_for(Distributor.TOOLOST))
        self.assertEqual(skipped, 0)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].isrc, "USRC17607899")
        self.assertEqual(rows[0].amount, Decimal("12.50"))
