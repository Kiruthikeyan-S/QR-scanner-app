#!/usr/bin/env python3
"""
Cleanup Script: cleanup_expired_files.py
Project: Qrinova
Purpose:
  Finds expired file records in Supabase (expires_at <= now() AND status = 'active'),
  deletes the storage objects using the Supabase Storage REST API (Storage API, NOT direct SQL),
  and marks the metadata record as 'deleted'.
Usage:
  python backend/scripts/cleanup_expired_files.py
"""

import sys
import os
import datetime
import urllib.request
import urllib.error
import json

# Add parent directory to path so settings can be imported if needed
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings

def main():
    supabase_url = (settings.SUPABASE_URL or os.environ.get("SUPABASE_URL", "")).rstrip("/")
    service_key = (
        settings.active_supabase_key
        or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        or os.environ.get("SUPABASE_SECRET_KEY", "")
    )
    bucket = settings.SUPABASE_BUCKET or "qr-files"

    if not supabase_url or not service_key:
        print("[ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")
        sys.exit(1)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(f"[CLEANUP] Starting expired file cleanup at {now_iso}")

    # 1. Fetch expired files from uploaded_files table
    rest_url = f"{supabase_url}/rest/v1/uploaded_files?status=eq.active&expires_at=lte.{now_iso}&select=id,storage_bucket,storage_path,expires_at"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    req = urllib.request.Request(rest_url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[ERROR] Failed to query uploaded_files: {e}")
        sys.exit(1)

    if not data:
        print("[CLEANUP] No expired files found.")
        return

    print(f"[CLEANUP] Found {len(data)} expired file(s).")

    # Group by bucket
    by_bucket = {}
    for item in data:
        b = item.get("storage_bucket") or bucket
        by_bucket.setdefault(b, []).append(item)

    total_deleted = 0

    # 2. Delete each batch using Supabase Storage API (.remove() / DELETE request)
    for b_name, items in by_bucket.items():
        paths = [item["storage_path"] for item in items]
        storage_delete_url = f"{supabase_url}/storage/v1/object/{b_name}"
        delete_payload = json.dumps({"prefixes": paths}).encode("utf-8")

        del_req = urllib.request.Request(
            storage_delete_url,
            data=delete_payload,
            headers={**headers, "Content-Type": "application/json"},
            method="DELETE",
        )

        try:
            with urllib.request.urlopen(del_req) as del_resp:
                res = json.loads(del_resp.read().decode("utf-8"))
                print(f"[CLEANUP] Deleted from storage bucket '{b_name}': {res}")

            # 3. Mark as deleted in uploaded_files
            success_ids = [item["id"] for item in items]
            patch_url = f"{supabase_url}/rest/v1/uploaded_files?id=in.({','.join(success_ids)})"
            patch_payload = json.dumps({
                "status": "deleted",
                "deleted_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }).encode("utf-8")

            patch_req = urllib.request.Request(
                patch_url,
                data=patch_payload,
                headers={**headers, "Prefer": "return=minimal"},
                method="PATCH",
            )
            with urllib.request.urlopen(patch_req) as patch_resp:
                pass

            total_deleted += len(success_ids)
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8")
            print(f"[ERROR] Storage deletion failed for bucket '{b_name}' (Status {he.code}): {err_body}")
        except Exception as ex:
            print(f"[ERROR] Unexpected exception during cleanup for bucket '{b_name}': {ex}")

    print(f"[CLEANUP] Finished. Total expired files cleaned: {total_deleted}")

if __name__ == "__main__":
    main()
