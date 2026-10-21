#!/usr/bin/env python3
"""Seed only Resources and LegalPages (everything else already seeded)."""
import json, ssl, urllib.request, os, datetime

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

def publish(model, eid):
    gql(f'mutation {{ publish{model}(where: {{id: "{eid}"}}, to: PUBLISHED) {{ id }} }}')

# ── Resources ──────────────────────────────────────────────────────
print("[1] Resources...")
resources = [
    ("FWC Boating Safety Checklist", "pdf", "checklist",
     "Official Florida Fish and Wildlife Conservation Commission boating safety checklist.",
     "Florida FWC", "https://myfwc.com/boating/safety-education/", 1, True),
    ("U.S. Coast Guard Boating Safety", "link", "guidelines",
     "Comprehensive water safety guidelines from the U.S. Coast Guard.",
     "U.S. Coast Guard", "https://www.uscgboating.org/", 2, False),
    ("Florida Boating Regulations", "link", "regulations",
     "Florida state boating laws and regulations reference guide.",
     "Florida DHSMV", "https://www.flhsmv.gov/motor-vehicles-tags-titles/vessels/", 3, False),
]
for title, rtype, rcat, desc, src, url, order, featured in resources:
    print(f"  {title}...", end=" ", flush=True)
    r = gql(f"""mutation {{
      createResource(data: {{
        title: "{title}"
        resourceType: {rtype}
        resourceCategory: {rcat}
        description: "{desc}"
        sourceLabel: "{src}"
        url: "{url}"
        sortOrder: {order}
        isFeatured: {str(featured).lower()}
      }}) {{ id }}
    }}""")
    eid = r["createResource"]["id"]
    publish("Resource", eid)
    print(f"✓ ({eid})")

# ── LegalPages ─────────────────────────────────────────────────────
print("\n[2] LegalPages...")
today = datetime.date.today().isoformat()

privacy_body = {"children": [{"type": "paragraph", "children": [{"text": "This Privacy Policy describes how Keep Her Light Alive Foundation collects, uses, and protects your information. We collect only the information necessary to respond to your inquiries and process donations. We do not sell or share your personal information with third parties except as required by law. For questions, contact us at Keepherlightalivesmr@gmail.com."}]}]}
terms_body = {"children": [{"type": "paragraph", "children": [{"text": "By accessing and using keepherlightalive.com, you agree to these Terms of Use. The content on this site is provided for informational purposes only. Keep Her Light Alive Foundation is not liable for any damages arising from the use of this website. All content is copyright Keep Her Light Alive Foundation unless otherwise noted."}]}]}

for slug, title, body in [
    ("privacy-policy", "Privacy Policy", privacy_body),
    ("terms-of-use", "Terms of Use", terms_body),
]:
    print(f"  {title}...", end=" ", flush=True)
    r = gql("""mutation($body: RichTextAST!) {
      createLegalPage(data: {
        slug: \"""" + slug + """\"
        title: \"""" + title + """\"
        lastUpdated: \"""" + today + """\"
        body: $body
      }) { id }
    }""", {"body": body})
    eid = r["createLegalPage"]["id"]
    publish("LegalPage", eid)
    print(f"✓ ({eid})")

print("\n✅ Done! Resources and LegalPages seeded.")
