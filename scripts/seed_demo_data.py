#!/usr/bin/env python3
"""
SecureCross V2.0 Demo Data Seeder
Populates initial synthetic branches, customers, and operators.
"""
import sys
import json
import urllib.request
import urllib.error

API_URL = "http://localhost:3000/api/v1"

def seed_data():
    print("[SecureCross] Seeding synthetic banking records...")
    req = urllib.request.Request(
        f"{API_URL}/admin/reset-data",
        data=json.dumps({}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"[SecureCross] SUCCESS: {data.get('message')}")
    except urllib.error.URLError as e:
        print(f"[SecureCross] Note: Local server not reachable at {API_URL} ({e}).")
        print("[SecureCross] Seed dataset is built-in to server.ts and ready on startup.")

if __name__ == "__main__":
    seed_data()
