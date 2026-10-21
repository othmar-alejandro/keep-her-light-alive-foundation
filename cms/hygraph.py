#!/usr/bin/env python3
"""
Hygraph Management + Content API client for Keep Her Light Alive Foundation.
Handles schema creation (Management API) and content seeding (Content API).
"""
import json, ssl, urllib.request, os, sys, time

TOKEN      = os.environ.get("HYGRAPH_MANAGEMENT_TOKEN", "")
PROJECT_ID = "cmm1zo3c701dl07wctz81kt8e"
MGMT_URL   = "https://management-us-west-2.hygraph.com/graphql"
CONTENT_URL= "https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master"
DRY_RUN    = os.environ.get("DRY_RUN", "").lower() == "true"

# Bypass local cert store issue (macOS Python 3.13)
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

def _call(url, query, variables=None):
    if DRY_RUN:
        print(f"[DRY] {query.strip()[:80]} vars={variables}")
        return {"data": {}}
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req, context=CTX) as r:
        body = json.loads(r.read())
    if body.get("errors"):
        raise RuntimeError(f"GraphQL error: {json.dumps(body['errors'], indent=2)}")
    return body

def mgmt(query, variables=None):
    return _call(MGMT_URL, query, variables)

def content(query, variables=None):
    return _call(CONTENT_URL, query, variables)

# ── get environment ID ──────────────────────────────────────────
def get_env_id():
    r = mgmt("""
    { viewer { project(id: "%s") {
        environment(name: "master") { id name }
    } } }
    """ % PROJECT_ID)
    env = r["data"]["viewer"]["project"]["environment"]
    print(f"  Environment: {env['name']} ({env['id']})")
    return env["id"]

# ── get existing models ─────────────────────────────────────────
def get_models(env_id):
    r = mgmt("""
    { viewer { project(id: "%s") {
        environment(name: "master") {
          models { id apiId displayName isSystem }
        }
    } } }
    """ % PROJECT_ID)
    models = r["data"]["viewer"]["project"]["environment"]["models"]
    return {m["apiId"]: m["id"] for m in models if not m.get("isSystem")}

# ── create model ────────────────────────────────────────────────
def create_model(env_id, api_id, display_name, description="", is_singleton=False):
    r = mgmt("""
    mutation($env: ID!, $apiId: String!, $displayName: String!, $description: String!) {
      createModel(data: {
        environmentId: $env
        apiId: $apiId
        apiIdPlural: "%ss"
        displayName: $displayName
        description: $description
      }) { id apiId }
    }
    """ % api_id, {
        "env": env_id,
        "apiId": api_id,
        "displayName": display_name,
        "description": description,
    })
    model_id = r["data"]["createModel"]["id"]
    print(f"    ✓ Model created: {api_id} ({model_id})")
    return model_id

# ── create simple (String/Int/Boolean/Date/DateTime) field ──────
def add_field(model_id, api_id, display_name, field_type,
              required=False, unique=False, is_list=False,
              initial_value=None, default=None):
    type_map = {
        "String":   "createSimpleField",
        "Int":      "createSimpleField",
        "Float":    "createSimpleField",
        "Boolean":  "createSimpleField",
        "Date":     "createSimpleField",
        "DateTime": "createSimpleField",
        "Json":     "createSimpleField",
        "RichText": "createSimpleField",
        "Asset":    "createAssetField",
    }
    mutation_name = type_map.get(field_type, "createSimpleField")

    type_gql = {
        "String": "STRING",
        "Int": "INT",
        "Float": "FLOAT",
        "Boolean": "BOOLEAN",
        "Date": "DATE",
        "DateTime": "DATETIME",
        "Json": "JSON",
        "RichText": "RICHTEXT",
    }.get(field_type, "STRING")

    if field_type == "Asset":
        r = mgmt("""
        mutation($modelId: ID!, $apiId: String!, $displayName: String!, $required: Boolean!) {
          createAssetField(data: {
            modelId: $modelId
            apiId: $apiId
            displayName: $displayName
            isRequired: $required
            isList: false
          }) { id apiId }
        }
        """, {"modelId": model_id, "apiId": api_id, "displayName": display_name, "required": required})
        field_id = r["data"]["createAssetField"]["id"]
    else:
        r = mgmt("""
        mutation($modelId: ID!, $apiId: String!, $displayName: String!,
                 $type: SimpleFieldType!, $required: Boolean!, $unique: Boolean!, $isList: Boolean!) {
          createSimpleField(data: {
            modelId: $modelId
            apiId: $apiId
            displayName: $displayName
            type: $type
            isRequired: $required
            isUnique: $unique
            isList: $isList
          }) { id apiId }
        }
        """, {
            "modelId": model_id, "apiId": api_id, "displayName": display_name,
            "type": type_gql, "required": required, "unique": unique, "isList": is_list,
        })
        field_id = r["data"]["createSimpleField"]["id"]
    print(f"      + field: {api_id} ({field_type})")
    return field_id

# ── create enum ─────────────────────────────────────────────────
def create_enum(env_id, api_id, display_name, values):
    r = mgmt("""
    mutation($env: ID!, $apiId: String!, $displayName: String!, $values: [EnumerationValueCreateInput!]!) {
      createEnumeration(data: {
        environmentId: $env
        apiId: $apiId
        displayName: $displayName
        values: $values
      }) { id apiId }
    }
    """, {
        "env": env_id,
        "apiId": api_id,
        "displayName": display_name,
        "values": [{"apiId": v, "displayName": v.replace("_", " ").title()} for v in values],
    })
    enum_id = r["data"]["createEnumeration"]["id"]
    print(f"  ✓ Enum created: {api_id} ({enum_id})")
    return enum_id

# ── add enum field to model ──────────────────────────────────────
def add_enum_field(model_id, api_id, display_name, enum_id, required=False):
    r = mgmt("""
    mutation($modelId: ID!, $apiId: String!, $displayName: String!, $enumId: ID!, $required: Boolean!) {
      createEnumerableField(data: {
        modelId: $modelId
        apiId: $apiId
        displayName: $displayName
        enumerationId: $enumId
        isRequired: $required
      }) { id apiId }
    }
    """, {"modelId": model_id, "apiId": api_id, "displayName": display_name,
          "enumId": enum_id, "required": required})
    field_id = r["data"]["createEnumerableField"]["id"]
    print(f"      + enum field: {api_id}")
    return field_id

# ── publish (make a model's content queryable on PUBLISHED stage) ─
def publish_entry(model_api_id, entry_id):
    r = content(f"""
    mutation {{ publish{model_api_id}(where: {{id: "{entry_id}"}}, to: PUBLISHED) {{ id }} }}
    """)
    key = f"publish{model_api_id}"
    return r["data"][key]["id"]

# ── create content entry (generic) ──────────────────────────────
def create_entry(model_api_id, data_dict):
    fields = []
    vars_  = {}
    for k, v in data_dict.items():
        if isinstance(v, dict):
            # Rich text input
            fields.append(f'{k}: $_{k}')
            vars_[f"_{k}"] = v
        elif isinstance(v, bool):
            fields.append(f'{k}: {str(v).lower()}')
        elif isinstance(v, int):
            fields.append(f'{k}: {v}')
        elif isinstance(v, str):
            escaped = v.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
            fields.append(f'{k}: "{escaped}"')
        elif v is None:
            pass  # skip nulls

    # Inject rich text vars inline (simplified approach: pass as JSON string)
    # For simplicity we'll use a dynamic mutation
    r = content(f"""
    mutation {{ create{model_api_id}(data: {{
        {chr(10).join(fields)}
    }}) {{ id }} }}
    """)
    key = f"create{model_api_id}"
    return r["data"][key]["id"]


if __name__ == "__main__":
    print("\nHygraph connection test:")
    env_id = get_env_id()
    models = get_models(env_id)
    print(f"  Existing custom models: {list(models.keys()) or '(none)'}")
    print("\nReady to proceed with schema creation.")
    print("Run: python3 cms/hygraph.py --create-schema")
