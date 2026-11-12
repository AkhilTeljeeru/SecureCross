#!/usr/bin/env python3
"""
SecureCross V2.0 Demo Data Reset Script
Resets transactions, verification sessions, and daily limits to seed state.
"""
import sys
import json
import urllib.request
import urllib.error

API_URL = "http://localhost:3000/api/v1"

def reset_data():
    print("[SecureCross] Resetting synthetic demo database...")
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
        print(f"[SecureCross] Failed to contact API server at {API_URL}: {e}")

if __name__ == "__main__":
    reset_data()
