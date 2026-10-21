#!/usr/bin/env python3
"""
Seed all content entries for Keep Her Light Alive Foundation.
Reads HYGRAPH_MANAGEMENT_TOKEN from .env, posts to Content API.
Run AFTER schema is fully created.
"""
import json, ssl, urllib.request, os, sys

_env_raw = open(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")).read()
TOKEN = ""
for _line in _env_raw.split("\n"):
    if _line.startswith("HYGRAPH_MANAGEMENT_TOKEN="):
        TOKEN = _line.split("=", 1)[1].strip(); break
if not TOKEN:
    TOKEN = os.environ.get("HYGRAPH_MANAGEMENT_TOKEN", "")

CONTENT_URL = "https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

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

class Enum:
    def __init__(self, v): self.v = v

def enum(v): return Enum(v)

def richtext(text):
    """Wrap plain text as a Hygraph RichTextAST value."""
    return {"children": [{"type": "paragraph", "children": [{"text": text}]}]}

def create(model, fields_dict):
    """Create a content entry and return its ID."""
    pairs = []
    vars_def = []
    vars_val = {}
    var_idx = 0
    for k, v in fields_dict.items():
        if v is None:
            continue
        elif isinstance(v, dict):
            # Rich text AST — pass as variable
            var_name = f"v{var_idx}"; var_idx += 1
            vars_def.append(f"${var_name}: RichTextAST!")
            vars_val[var_name] = v
            pairs.append(f'{k}: ${var_name}')
        elif isinstance(v, Enum):
            pairs.append(f'{k}: {v.v}')
        elif isinstance(v, bool):
            pairs.append(f'{k}: {str(v).lower()}')
        elif isinstance(v, int):
            pairs.append(f'{k}: {v}')
        elif isinstance(v, str):
            esc = v.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
            pairs.append(f'{k}: "{esc}"')
    vars_clause = f'({", ".join(vars_def)})' if vars_def else ''
    body_str = "\n    ".join(pairs)
    r = gql(f'mutation{vars_clause} {{ create{model}(data: {{ {body_str} }}) {{ id }} }}', vars_val)
    return r[f"create{model}"]["id"]

def publish(model, entry_id):
    r = gql(f'mutation {{ publish{model}(where: {{id: "{entry_id}"}}, to: PUBLISHED) {{ id }} }}')
    return r[f"publish{model}"]["id"]

def seed(model, fields_dict, label=""):
    print(f"  {model}: {label}...", end=" ", flush=True)
    eid = create(model, fields_dict)
    publish(model, eid)
    print(f"✓ ({eid})")
    return eid

# ── 1. Global Site Settings ──────────────────────────────────────
print("\n[1] GlobalSiteSetting...")
seed("GlobalSiteSetting", {
    "siteName": "Keep Her Light Alive Foundation",
    "primaryEmail": "Keepherlightalivesmr@gmail.com",
    "primaryPhone": "786-874-1881",
    "locationText": "Florida, United States",
    "donateUrl": "https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ",
    "instagramUrl": "https://www.instagram.com/keepherlightalive",
    "facebookUrl": None,
    "footerText": "© 2024 Keep Her Light Alive Foundation. All rights reserved.",
    "seoDefaultTitle": "Keep Her Light Alive Foundation",
    "seoDefaultDescription": "Dedicated to water safety education and drowning prevention in Florida and beyond.",
}, "GlobalSiteSetting")

# ── 2. Coin Initiative Settings ──────────────────────────────────
print("\n[2] CoinInitiativeSetting...")
seed("CoinInitiativeSetting", {
    "heading": "The Coin Initiative",
    "body": richtext("The Coin Initiative is a unique fundraising and awareness program. Each commemorative coin represents a commitment to water safety and helps fund our educational outreach. Request a coin with a donation and carry the mission with you."),
    "requestCoinCtaUrl": "https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ",
    "donateCtaUrl": "https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ",
}, "CoinInitiativeSetting")

# ── 3. Founders ───────────────────────────────────────────────────
print("\n[3] Founders...")
seed("Founder", {"name": "Magaly Bea", "roleTitle": "Co-Founder", "sortOrder": 1}, "Magaly")
seed("Founder", {"name": "Midalys Armas", "roleTitle": "Co-Founder", "sortOrder": 2}, "Midalys")
seed("Founder", {"name": "Natalie Fitoria", "roleTitle": "Co-Founder", "sortOrder": 3}, "Natalie")

# ── 4. FAQ Items ──────────────────────────────────────────────────
print("\n[4] FAQItems...")
faqs = [
    ("Who can benefit from this foundation?",
     "Anyone who wants to learn about water safety, especially families with young children, swimmers of all skill levels, and communities near bodies of water.",
     1),
    ("How can I get involved or volunteer?",
     "We welcome volunteers! Reach out via our contact form or email us directly at Keepherlightalivesmr@gmail.com to learn about upcoming opportunities.",
     2),
    ("Are your programs free?",
     "Many of our programs and resources are offered free of charge to ensure broad access to water safety education.",
     3),
    ("Where do you operate?",
     "We are based in Florida and primarily serve communities across the state, though our resources and educational materials are available to anyone.",
     4),
    ("How can I donate?",
     "You can donate securely through PayPal using the Donate button on our website. Every contribution goes directly toward water safety programs.",
     5),
    ("What is the Coin Initiative?",
     "The Coin Initiative is a unique fundraising and awareness program. Each coin represents a commitment to water safety and helps fund our educational outreach.",
     6),
]
for question, answer, order in faqs:
    seed("FAQItem", {"question": question, "answer": richtext(answer), "sortOrder": order}, f"FAQ {order}")

# ── 5. Contact Topics ─────────────────────────────────────────────
print("\n[5] ContactTopics...")
topics = [
    ("General Inquiry", "general", 1),
    ("Volunteer / Get Involved", "volunteer", 2),
    ("Donation Question", "donation", 3),
    ("Partnership / Sponsorship", "partnership", 4),
    ("Media & Press", "media", 5),
]
for label, value, order in topics:
    seed("ContactTopic", {"label": label, "value": value, "sortOrder": order}, label)

# ── 6. Initiatives ────────────────────────────────────────────────
print("\n[6] Initiatives...")
initiatives = [
    ("Water Safety Education",
     "Delivering life-saving water safety knowledge to schools, community centers, and families across Florida.",
     1, True),
    ("Swim Lessons Access",
     "Partnering with local pools to provide affordable swim lessons to underserved communities.",
     2, False),
    ("Drowning Prevention Advocacy",
     "Working with legislators and community leaders to strengthen drowning prevention policies and safety standards.",
     3, False),
    ("Community Outreach Events",
     "Hosting events, workshops, and awareness campaigns that bring water safety resources directly to families.",
     4, False),
]
for title, summary, order, featured in initiatives:
    seed("Initiative", {
        "title": title,
        "summary": summary,
        "sortOrder": order,
        "isFeatured": featured,
    }, title)

# ── 7. Resources ──────────────────────────────────────────────────
print("\n[7] Resources...")
seed("Resource", {
    "title": "FWC Boating Safety Checklist",
    "resourceType": enum("pdf"),
    "resourceCategory": enum("checklist"),
    "description": "Official Florida Fish and Wildlife Conservation Commission boating safety checklist.",
    "sourceLabel": "Florida FWC",
    "url": "https://myfwc.com/boating/safety-education/",
    "sortOrder": 1,
    "isFeatured": True,
}, "FWC Checklist")
seed("Resource", {
    "title": "U.S. Coast Guard Boating Safety",
    "resourceType": enum("link"),
    "resourceCategory": enum("guidelines"),
    "description": "Comprehensive water safety guidelines from the U.S. Coast Guard.",
    "sourceLabel": "U.S. Coast Guard",
    "url": "https://www.uscgboating.org/",
    "sortOrder": 2,
    "isFeatured": False,
}, "Coast Guard")
seed("Resource", {
    "title": "Florida Boating Regulations",
    "resourceType": enum("link"),
    "resourceCategory": enum("regulations"),
    "description": "Florida state boating laws and regulations reference guide.",
    "sourceLabel": "Florida DHSMV",
    "url": "https://www.flhsmv.gov/motor-vehicles-tags-titles/vessels/",
    "sortOrder": 3,
    "isFeatured": False,
}, "FL Regulations")

# ── 8. Legal Pages ────────────────────────────────────────────────
print("\n[8] LegalPages...")
import datetime
today = datetime.date.today().isoformat()

seed("LegalPage", {
    "slug": "privacy-policy",
    "title": "Privacy Policy",
    "lastUpdated": today,
    "body": richtext("This Privacy Policy describes how Keep Her Light Alive Foundation collects, uses, and protects your information. We collect only the information necessary to respond to your inquiries and process donations. We do not sell or share your personal information with third parties except as required by law. For questions, contact us at Keepherlightalivesmr@gmail.com."),
}, "Privacy Policy")

seed("LegalPage", {
    "slug": "terms-of-use",
    "title": "Terms of Use",
    "lastUpdated": today,
    "body": richtext("By accessing and using keepherlightalive.com, you agree to these Terms of Use. The content on this site is provided for informational purposes only. Keep Her Light Alive Foundation is not liable for any damages arising from the use of this website. All content is copyright Keep Her Light Alive Foundation unless otherwise noted."),
}, "Terms of Use")

print("\n" + "="*60)
print("✅ All content seeded and published!")
print("\nManual steps remaining:")
print("  1. Upload founder photos in Hygraph UI → Assets")
print("     then link each to their Founder entry")
print("  2. Add 'image' Asset field to RichTextSection and SplitSection")
print("     (Schema → component → + Add Field → Asset → apiId: image)")
print("  3. Create read-only HYGRAPH_TOKEN in Hygraph → Project Settings → API Access")
print("  4. Set up Netlify webhook in Hygraph → Project Settings → Webhooks")
print("="*60)
