#!/usr/bin/env python3
"""Inspect current Hygraph project state via Management API."""
import json, urllib.request, os

TOKEN = os.environ.get("HYGRAPH_MANAGEMENT_TOKEN", "")
PROJECT_ID = "cmm1zo3c701dl07wctz81kt8e"
MGMT_URL = "https://management-us-west-2.hygraph.com/graphql"

def mgmt(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        MGMT_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

result = mgmt("""
{
  viewer {
    project(id: "%s") {
      id
      name
      environment(name: "master") {
        id
        name
        models {
          id
          apiId
          displayName
          isSystem
          fields {
            id
            apiId
            displayName
            type
            isSystem
            isRequired
            isUnique
          }
        }
      }
    }
  }
}
""" % PROJECT_ID)

proj = result.get("data", {}).get("viewer", {}).get("project", {})
env = proj.get("environment", {})
models = env.get("models", [])

print(f"Project: {proj.get('name')} ({proj.get('id')})")
print(f"Environment: {env.get('name')} ({env.get('id')})")
print(f"\nModels ({len(models)}):")
for m in models:
    tag = " [SYSTEM]" if m.get("isSystem") else ""
    print(f"  - {m['displayName']} (apiId={m['apiId']}){tag}")
    for f in m.get("fields", []):
        if not f.get("isSystem"):
            req = " *" if f.get("isRequired") else ""
            unq = " [unique]" if f.get("isUnique") else ""
            print(f"      {f['apiId']}: {f['type']}{req}{unq}")
