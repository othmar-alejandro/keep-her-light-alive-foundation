#!/usr/bin/env python3
"""Delete duplicate content entries, keeping only the most recent set."""
import json, ssl, urllib.request, os

_env_raw = open(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")).read()
TOKEN = next(l.split("=",1)[1].strip() for l in _env_raw.split("\n") if l.startswith("HYGRAPH_MANAGEMENT_TOKEN="))
CONTENT_URL = "https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master"
CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE

def gql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(CONTENT_URL, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", "Bearer " + TOKEN)
    try:
        with urllib.request.urlopen(req, context=CTX) as r:
            body = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError("HTTP " + str(e.code) + ": " + e.read().decode()[:400])
    if body.get("errors"):
        raise RuntimeError("GQL: " + json.dumps(body["errors"])[:400])
    return body["data"]

PLURAL_MAP = {
    "GlobalSiteSetting": "globalSiteSettings",
    "CoinInitiativeSetting": "coinInitiativeSettings",
    "Founder": "founders",
    "FAQItem": "fAQItems",
    "Initiative": "initiatives",
}

def fetch_all(model, fields="id createdAt"):
    plural = PLURAL_MAP[model]
    r = gql(f'{{ {plural}(first: 100, orderBy: createdAt_ASC, stage: DRAFT) {{ {fields} }} }}')
    return r[plural]

def delete_entry(model, eid):
    r = gql(f'mutation {{ delete{model}(where: {{id: "{eid}"}}) {{ id }} }}')
    return r[f"delete{model}"]["id"]

def cleanup(model, keep_count, key_field=None):
    """Keep the last `keep_count` entries (by createdAt ASC = oldest first, so keep last N)."""
    fields = "id createdAt" + (f" {key_field}" if key_field else "")
    entries = fetch_all(model, fields)
    print(f"\n{model}: {len(entries)} entries found, keeping {keep_count}")
    to_delete = entries[:-keep_count] if len(entries) > keep_count else []
    for e in to_delete:
        label = e.get(key_field, e["id"]) if key_field else e["id"]
        print(f"  DELETE {label} ({e['id']})", end=" ", flush=True)
        delete_entry(model, e["id"])
        print("✓")
    if not to_delete:
        print("  Nothing to delete.")

# Singletons — keep exactly 1 (the latest)
cleanup("GlobalSiteSetting", 1)
cleanup("CoinInitiativeSetting", 1)

# Keep the correct count of each
cleanup("Founder", 4, key_field="name")
cleanup("FAQItem", 6, key_field="question")
cleanup("Initiative", 4, key_field="title")

print("\n✅ Cleanup complete.")
