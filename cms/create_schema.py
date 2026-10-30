#!/usr/bin/env python3
"""
Full Hygraph schema creation for Keep Her Light Alive Foundation.
Creates all models, enums, components, and fields via Management API.
All schema mutations are async (migration-based) — we poll for completion.
"""
import json, ssl, urllib.request, os, sys, time

# Read token from .env file
_env_raw = open(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")).read()
TOKEN = ""
for _line in _env_raw.split("\n"):
    if _line.startswith("HYGRAPH_MANAGEMENT_TOKEN="):
        TOKEN = _line.split("=", 1)[1].strip()
        break
if not TOKEN:
    TOKEN = os.environ.get("HYGRAPH_MANAGEMENT_TOKEN", "")

ENV_ID  = "16f12a52db7e46238ecda194026cff41"
MGMT    = "https://management-us-west-2.hygraph.com/graphql"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

ids = {}          # track created IDs
component_ids = set()  # which IDs are components (use componentId not modelId)

def load_existing():
    """Fetch existing schema state so we can skip already-created items."""
    r = gql("""{ viewer { ... on TokenViewer { project {
      environment(name: "master") {
        contentModel {
          enumerations { id apiId }
          models { id apiId }
          components { id apiId }
        }
      }
    } } } }""")
    cm = r["viewer"]["project"]["environment"]["contentModel"]
    for e in cm["enumerations"]:
        ids[e["apiId"]] = e["id"]
    for m in cm["models"]:
        ids[m["apiId"]] = m["id"]
    for c in cm["components"]:
        ids[c["apiId"]] = c["id"]
        component_ids.add(c["id"])
    if ids:
        print(f"  Resuming — found existing items: {list(ids.keys())}")

# ── GraphQL caller ───────────────────────────────────────────────
def gql(query, variables=None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(MGMT, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", "Bearer " + TOKEN)
    try:
        with urllib.request.urlopen(req, context=CTX) as r:
            body = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError("HTTP " + str(e.code) + ": " + e.read().decode()[:600])
    if body.get("errors"):
        raise RuntimeError("GQL Error: " + json.dumps(body["errors"], indent=2)[:600])
    return body["data"]

# ── Poll until no running migration ─────────────────────────────
def wait_idle(label=""):
    """Poll until Hygraph has no running/queued migration."""
    for attempt in range(90):  # max 90 seconds
        time.sleep(1)
        r = gql("""{ viewer { ... on TokenViewer { project {
          environment(name: "master") {
            runningMigration { id status errors }
          }
        } } } }""")
        m = r["viewer"]["project"]["environment"]["runningMigration"]
        if m is None:
            return  # no running migration — done
        status = m["status"]
        if status in ("FAILED", "TIMEOUT"):
            raise RuntimeError(f"Migration '{label}' failed ({status}): {m.get('errors')}")
        # QUEUED or RUNNING — keep polling
    raise RuntimeError(f"Migration '{label}' still running after 90s")

# ── Schema mutation wrapper ──────────────────────────────────────
def schema_mutation(mutation_str, label=""):
    """Run a schema mutation and poll until it completes."""
    r = gql(mutation_str)
    wait_idle(label)
    return r

# ════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ════════════════════════════════════════════════════════════════
def create_enum(api_id, display_name, values):
    if api_id in ids:
        print(f"  Enum: {api_id} [SKIP — already exists]")
        return ids[api_id]
    print(f"  Enum: {api_id}...", end=" ", flush=True)
    values_gql = " ".join(
        f'{{ apiId: "{v}", displayName: "{v.replace("_"," ").title()}" }}'
        for v in values
    )
    schema_mutation(f"""
    mutation {{
      createEnumeration(data: {{
        environmentId: "{ENV_ID}"
        apiId: "{api_id}"
        displayName: "{display_name}"
        values: [{values_gql}]
      }}) {{ migration {{ id }} }}
    }}
    """, label=f"createEnum:{api_id}")
    # After migration, fetch the enum ID
    r = gql("""{ viewer { ... on TokenViewer { project {
      environment(name: "master") {
        contentModel { enumerations { id apiId } }
      }
    } } } }""")
    enums = r["viewer"]["project"]["environment"]["contentModel"]["enumerations"]
    eid = next(e["id"] for e in enums if e["apiId"] == api_id)
    ids[api_id] = eid
    print(f"✓ ({eid})")
    return eid

# ════════════════════════════════════════════════════════════════
# MODEL CREATION
# ════════════════════════════════════════════════════════════════
def create_model(api_id, api_id_plural, display_name, description=""):
    if api_id in ids:
        print(f"\n  Model: {display_name} [SKIP — already exists]")
        return ids[api_id]
    print(f"\n  Model: {display_name}...", end=" ", flush=True)
    schema_mutation(f"""
    mutation {{
      createModel(data: {{
        environmentId: "{ENV_ID}"
        apiId: "{api_id}"
        apiIdPlural: "{api_id_plural}"
        displayName: "{display_name}"
        description: "{description.replace('"', "'")}"
      }}) {{ migration {{ id }} }}
    }}
    """, label=f"createModel:{api_id}")
    r = gql("""{ viewer { ... on TokenViewer { project {
      environment(name: "master") {
        contentModel { models { id apiId } }
      }
    } } } }""")
    models = r["viewer"]["project"]["environment"]["contentModel"]["models"]
    mid = next(m["id"] for m in models if m["apiId"] == api_id)
    ids[api_id] = mid
    print(f"✓ ({mid})")
    return mid

# ════════════════════════════════════════════════════════════════
# COMPONENT CREATION
# ════════════════════════════════════════════════════════════════
def create_component(api_id, api_id_plural, display_name, description=""):
    if api_id in ids:
        print(f"\n  Component: {display_name} [SKIP — already exists]")
        return ids[api_id]
    print(f"\n  Component: {display_name}...", end=" ", flush=True)
    schema_mutation(f"""
    mutation {{
      createComponent(data: {{
        environmentId: "{ENV_ID}"
        apiId: "{api_id}"
        apiIdPlural: "{api_id_plural}"
        displayName: "{display_name}"
        description: "{description.replace('"', "'")}"
      }}) {{ migration {{ id }} }}
    }}
    """, label=f"createComponent:{api_id}")
    r = gql("""{ viewer { ... on TokenViewer { project {
      environment(name: "master") {
        contentModel { components { id apiId } }
      }
    } } } }""")
    comps = r["viewer"]["project"]["environment"]["contentModel"]["components"]
    cid = next(c["id"] for c in comps if c["apiId"] == api_id)
    ids[api_id] = cid
    component_ids.add(cid)
    print(f"✓ ({cid})")
    return cid

# ════════════════════════════════════════════════════════════════
# FIELD HELPERS
# ════════════════════════════════════════════════════════════════
TYPE_MAP = {
    "String": "STRING", "Int": "INT", "Boolean": "BOOLEAN",
    "RichText": "RICHTEXT", "Date": "DATE", "DateTime": "DATETIME",
    "Json": "JSON", "Float": "FLOAT",
}

def _safe(fn, label, ftype_display):
    """Run a schema operation, skip if field already exists."""
    try:
        fn()
        print(f"      + {label}: {ftype_display}")
    except RuntimeError as e:
        err = str(e).lower()
        if "already" in err or "duplicate" in err or "pending" in err:
            print(f"      ~ {label}: {ftype_display} (skipped: {str(e)[:80]})")
        else:
            raise

def _parent_key(parent_id):
    return "parentId" if parent_id in component_ids else "modelId"

def add_simple(parent_id, api_id, display_name, ftype,
               required=False, unique=False, is_list=False):
    pk = _parent_key(parent_id)
    def _do():
        schema_mutation(f"""
        mutation {{
          createSimpleField(data: {{
            {pk}: "{parent_id}"
            apiId: "{api_id}"
            displayName: "{display_name}"
            type: {TYPE_MAP[ftype]}
            isRequired: {str(required).lower()}
            isUnique: {str(unique).lower()}
            isList: {str(is_list).lower()}
            isLocalized: false
          }}) {{ migration {{ id }} }}
        }}
        """, label=f"field:{api_id}")
    _safe(_do, api_id, ftype)

def add_enum_field(parent_id, api_id, display_name, enum_id, required=False):
    pk = _parent_key(parent_id)
    def _do():
        schema_mutation(f"""
        mutation {{
          createEnumerableField(data: {{
            {pk}: "{parent_id}"
            apiId: "{api_id}"
            displayName: "{display_name}"
            enumerationId: "{enum_id}"
            type: ENUMERATION
            isRequired: {str(required).lower()}
            isList: false
            isUnique: false
          }}) {{ migration {{ id }} }}
        }}
        """, label=f"enumField:{api_id}")
    _safe(_do, api_id, "Enum")

def add_asset_field(parent_id, api_id, display_name, required=False):
    if parent_id in component_ids:
        # Component asset fields can't be created via API (reverseSide incompatible).
        # Add manually in Hygraph UI: Schema → <Component> → + Add Field → Asset → apiId: <api_id>
        print(f"      ! {api_id}: Asset [MANUAL — add in Hygraph UI]")
        return
    def _do():
        schema_mutation(f"""
        mutation {{
          createRelationalField(data: {{
            modelId: "{parent_id}"
            apiId: "{api_id}"
            displayName: "{display_name}"
            type: ASSET
            isList: false
            isRequired: {str(required).lower()}
            reverseSide: {{
              modelId: "{parent_id}"
              field: {{
                apiId: "{api_id}Of"
                displayName: "{display_name} Of"
                isList: true
              }}
            }}
          }}) {{ migration {{ id }} }}
        }}
        """, label=f"assetField:{api_id}")
    _safe(_do, api_id, "Asset")

def add_relation(parent_id, api_id, display_name, target_model_id,
                 reverse_api_id, reverse_display, is_list=True, required=False):
    pk = _parent_key(parent_id)
    def _do():
        schema_mutation(f"""
        mutation {{
          createRelationalField(data: {{
            {pk}: "{parent_id}"
            apiId: "{api_id}"
            displayName: "{display_name}"
            type: RELATION
            isList: {str(is_list).lower()}
            isRequired: {str(required).lower()}
            reverseSide: {{
              modelId: "{target_model_id}"
              field: {{
                apiId: "{reverse_api_id}"
                displayName: "{reverse_display}"
                isList: true
              }}
            }}
          }}) {{ migration {{ id }} }}
        }}
        """, label=f"relation:{api_id}")
    _safe(_do, api_id, "Relation")

def add_component_union(parent_id, api_id, display_name, component_ids,
                        is_list=True, required=False):
    comp_ids_gql = ", ".join(f'"{cid}"' for cid in component_ids)
    def _do():
        schema_mutation(f"""
        mutation {{
          createComponentUnionField(data: {{
            parentId: "{parent_id}"
            apiId: "{api_id}"
            displayName: "{display_name}"
            components: [{comp_ids_gql}]
            isList: {str(is_list).lower()}
            isRequired: {str(required).lower()}
          }}) {{ migration {{ id }} }}
        }}
        """, label=f"compUnion:{api_id}")
    _safe(_do, api_id, f"ComponentUnion({len(component_ids)})")

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════
def main():
    print("\n" + "="*60)
    print("Keep Her Light Alive — Hygraph Schema Builder")
    print(f"Environment: {ENV_ID}")
    print("="*60)

    load_existing()

    # ── 1. Enumerations ─────────────────────────────────────────
    print("\n[STEP 1] Enumerations...")
    create_enum("EventStatus", "Event Status",
                ["planned", "scheduled", "completed", "canceled"])
    create_enum("ResourceType", "Resource Type", ["pdf", "link", "video"])
    create_enum("ResourceCategory", "Resource Category",
                ["checklist", "guidelines", "regulations", "other"])
    create_enum("ImagePosition", "Image Position", ["left", "right"])

    # ── 2. Standalone models ─────────────────────────────────────
    print("\n[STEP 2] Models...")

    # FAQItem
    m = create_model("FAQItem", "FAQItems", "FAQ Item",
                     "Individual FAQ question and answer.")
    add_simple(m, "question", "Question", "String", required=True)
    add_simple(m, "answer", "Answer", "RichText", required=True)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=True)

    # Founder
    m = create_model("Founder", "Founders", "Founder",
                     "Foundation co-founder profile.")
    add_simple(m, "name", "Full Name", "String", required=True)
    add_simple(m, "roleTitle", "Role / Title", "String", required=True)
    add_asset_field(m, "photo", "Photo", required=False)
    add_simple(m, "bio", "Bio", "RichText", required=False)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=True)

    # Initiative
    m = create_model("Initiative", "Initiatives", "Initiative",
                     "A pillar of action or program area.")
    add_simple(m, "title", "Title", "String", required=True)
    add_simple(m, "summary", "Short Summary", "String", required=True)
    add_simple(m, "body", "Body", "RichText", required=False)
    add_asset_field(m, "coverImage", "Cover Image", required=False)
    add_simple(m, "ctaLabel", "CTA Button Label", "String", required=False)
    add_simple(m, "ctaUrl", "CTA URL", "String", required=False)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=True)
    add_simple(m, "isFeatured", "Featured?", "Boolean", required=False)

    # Event
    m = create_model("Event", "Events", "Event",
                     "A community event or gathering.")
    add_simple(m, "title", "Title", "String", required=True)
    add_enum_field(m, "eventStatus", "Event Status", ids["EventStatus"], required=True)
    add_simple(m, "startDateTime", "Start Date and Time", "DateTime", required=True)
    add_simple(m, "endDateTime", "End Date and Time", "DateTime", required=False)
    add_simple(m, "timezone", "Timezone", "String", required=False)
    add_simple(m, "locationName", "Venue Name", "String", required=True)
    add_simple(m, "locationAddress", "Address", "String", required=False)
    add_simple(m, "city", "City", "String", required=False)
    add_simple(m, "registrationUrl", "Registration URL", "String", required=False)
    add_simple(m, "description", "Description", "RichText", required=False)
    add_asset_field(m, "coverImage", "Cover Image", required=False)
    add_simple(m, "isPublic", "Publicly Visible", "Boolean", required=False)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=False)

    # Resource
    m = create_model("Resource", "Resources", "Resource",
                     "Water safety resource — PDF download, external link, or video.")
    add_simple(m, "title", "Title", "String", required=True)
    add_enum_field(m, "resourceType", "Resource Type", ids["ResourceType"], required=True)
    add_enum_field(m, "resourceCategory", "Resource Category", ids["ResourceCategory"], required=True)
    add_simple(m, "description", "Short Description", "String", required=False)
    add_asset_field(m, "file", "PDF File", required=False)
    add_simple(m, "url", "External URL", "String", required=False)
    add_simple(m, "sourceLabel", "Source Label", "String", required=False)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=True)
    add_simple(m, "isFeatured", "Featured", "Boolean", required=False)

    # ContactTopic
    m = create_model("ContactTopic", "ContactTopics", "Contact Topic",
                     "Options for the contact form subject dropdown.")
    add_simple(m, "label", "Option Label", "String", required=True)
    add_simple(m, "value", "Form Value", "String", required=True, unique=True)
    add_simple(m, "sortOrder", "Sort Order", "Int", required=True)

    # GlobalSiteSettings
    m = create_model("GlobalSiteSetting", "GlobalSiteSettings", "Global Site Settings",
                     "Singleton — header, footer, contact info, default SEO. Create only one entry.")
    add_simple(m, "siteName", "Site Name", "String", required=True)
    add_simple(m, "primaryEmail", "Primary Email", "String", required=True)
    add_simple(m, "primaryPhone", "Primary Phone", "String", required=True)
    add_simple(m, "locationText", "Location Text", "String", required=True)
    add_simple(m, "donateUrl", "PayPal Donate URL", "String", required=True)
    add_simple(m, "instagramUrl", "Instagram URL", "String", required=False)
    add_simple(m, "facebookUrl", "Facebook URL", "String", required=False)
    add_simple(m, "footerText", "Footer Copyright Text", "String", required=True)
    add_simple(m, "seoDefaultTitle", "Default SEO Title", "String", required=True)
    add_simple(m, "seoDefaultDescription", "Default SEO Description", "String", required=True)
    add_asset_field(m, "ogImage", "Default OG Image", required=False)

    # CoinInitiativeSettings
    m = create_model("CoinInitiativeSetting", "CoinInitiativeSettings", "Coin Initiative Settings",
                     "Singleton — content for the Coin Initiative section.")
    add_simple(m, "heading", "Section Heading", "String", required=True)
    add_simple(m, "body", "Body Copy", "RichText", required=True)
    add_asset_field(m, "qrCodeImage", "QR Code Image", required=False)
    add_asset_field(m, "coinFrontImage", "Coin Front Image", required=False)
    add_simple(m, "requestCoinCtaUrl", "Request Coin CTA URL", "String", required=False)
    add_simple(m, "donateCtaUrl", "Donate CTA URL", "String", required=False)

    # LegalPage
    m = create_model("LegalPage", "LegalPages", "Legal Page",
                     "Privacy policy and terms of use — editable by admin.")
    add_simple(m, "slug", "Slug", "String", required=True, unique=True)
    add_simple(m, "title", "Page Title", "String", required=True)
    add_simple(m, "lastUpdated", "Last Updated", "Date", required=True)
    add_simple(m, "body", "Body Content", "RichText", required=True)

    # ── 3. Section components ────────────────────────────────────
    print("\n[STEP 3] Section components...")

    c = create_component("RichTextSection", "RichTextSections", "Rich Text Section",
                         "Heading + rich text + optional image + optional CTA button.")
    add_simple(c, "heading", "Heading", "String", required=True)
    add_simple(c, "body", "Body", "RichText", required=True)
    add_asset_field(c, "image", "Image", required=False)
    add_simple(c, "ctaLabel", "CTA Button Label", "String", required=False)
    add_simple(c, "ctaUrl", "CTA Button URL", "String", required=False)

    c = create_component("CardsSection", "CardsSections", "Cards Section",
                         "Grid of initiative cards.")
    add_simple(c, "heading", "Section Heading", "String", required=True)
    add_relation(c, "cards", "Initiative Cards",
                 ids["Initiative"], "cardSections", "In Card Sections",
                 is_list=True, required=False)

    c = create_component("SplitSection", "SplitSections", "Split Section",
                         "Two-column layout: image + body text.")
    add_simple(c, "heading", "Heading", "String", required=True)
    add_simple(c, "body", "Body", "RichText", required=True)
    add_asset_field(c, "image", "Image", required=False)
    add_enum_field(c, "imagePosition", "Image Position", ids["ImagePosition"], required=False)
    add_simple(c, "ctaLabel", "CTA Label", "String", required=False)
    add_simple(c, "ctaUrl", "CTA URL", "String", required=False)

    c = create_component("QuoteSection", "QuoteSections", "Quote Section",
                         "Highlighted pull quote.")
    add_simple(c, "quoteText", "Quote Text", "String", required=True)
    add_simple(c, "quoteAttribution", "Attribution", "String", required=False)

    c = create_component("FAQSection", "FAQSections", "FAQ Section",
                         "Embeds FAQ items from the FAQ Item model.")
    add_simple(c, "heading", "Section Heading", "String", required=True)
    add_relation(c, "faqs", "FAQ Items",
                 ids["FAQItem"], "faqSections", "In FAQ Sections",
                 is_list=True, required=False)

    c = create_component("FoundersSection", "FoundersSections", "Founders Section",
                         "Displays founder cards from the Founder model.")
    add_simple(c, "heading", "Section Heading", "String", required=True)
    add_relation(c, "founders", "Founders",
                 ids["Founder"], "founderSections", "In Founder Sections",
                 is_list=True, required=False)

    # ── 4. Page model ────────────────────────────────────────────
    print("\n[STEP 4] Page model with section union...")
    m = create_model("Page", "Pages", "Page",
                     "Content page driven by slug. IMPORTANT: Hero section is hardcoded in HTML — do not add hero content here.")
    add_simple(m, "slug", "Slug", "String", required=True, unique=True)
    add_simple(m, "title", "Page Title", "String", required=True)
    add_component_union(m, "sections", "Content Sections", [
        ids["RichTextSection"], ids["CardsSection"], ids["SplitSection"],
        ids["QuoteSection"], ids["FAQSection"], ids["FoundersSection"],
    ], is_list=True, required=False)
    add_simple(m, "seoTitle", "SEO Title Override", "String", required=False)
    add_simple(m, "seoDescription", "SEO Description Override", "String", required=False)
    add_asset_field(m, "ogImage", "OG Image Override", required=False)

    # ── Done ─────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("✅ Schema creation complete!")
    print("\nModel/Component IDs created:")
    for k, v in ids.items():
        print(f"  {k}: {v}")
    print("\nNext step: python3 cms/seed_content.py")
    print("="*60)

if __name__ == "__main__":
    main()
