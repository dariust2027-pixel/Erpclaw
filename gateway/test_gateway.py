"""Contract checks for the self-hosted ERPClaw action gateway.

Run with ERPCLAW_SOURCE pointing at an ERPClaw checkout. The test keeps its
database in a temporary ERPCLAW_HOME and proves a newly initialized engine has
no companies, the catalog hides demo seeding, and a read action works through
the same router the mobile client uses.
"""
from __future__ import annotations
import os
import tempfile
import unittest
from pathlib import Path

os.environ.setdefault("ERPCLAW_SOURCE", "/home/ubuntu/erpclaw-source")
os.environ.setdefault("ERPCLAW_HOME", tempfile.mkdtemp(prefix="erpclaw-gateway-test-"))

from erpclaw_gateway import engine_actions, run_router  # noqa: E402


class GatewayContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        run_router("initialize-database")

    def test_new_engine_has_no_companies(self):
        response = run_router("list-companies")
        self.assertEqual(response["companies"], [])
        self.assertEqual(response["total_count"], 0)

    def test_catalog_hides_demo_seeding(self):
        actions = engine_actions()
        self.assertIn("list-companies", actions)
        self.assertNotIn("seed-demo-data", actions)

    def test_read_actions_are_routed(self):
        response = run_router("list-all-actions")
        self.assertEqual(response["status"], "ok")
        self.assertGreater(response["total"], 100)


if __name__ == "__main__":
    unittest.main()
