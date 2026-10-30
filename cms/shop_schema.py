#!/usr/bin/env python3
"""Create the editor-owned KHLA shop catalog in Hygraph (no product content)."""

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

MANAGEMENT_URL = "https://management-us-west-2.hygraph.com/graphql"
ENVIRONMENT_ID = "16f12a52db7e46238ecda194026cff41"


def token():
    value = os.environ.get("HYGRAPH_MANAGEMENT_TOKEN")
    if value:
        return value
    for line in (Path(__file__).resolve().parents[1] / ".env").read_text().splitlines():
        if line.startswith("HYGRAPH_MANAGEMENT_TOKEN="):
            return line.partition("=")[2].strip().strip('"')
    raise RuntimeError("HYGRAPH_MANAGEMENT_TOKEN is missing")


def gql(query):
    request = urllib.request.Request(
        MANAGEMENT_URL,
        data=json.dumps({"query": query}).encode(),
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + token()},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Hygraph HTTP {error.code}: {error.read().decode()[:500]}") from error
    if result.get("errors"):
        raise RuntimeError("Hygraph: " + json.dumps(result["errors"])[:600])
    return result["data"]


def models():
    result = gql('''{ viewer { ... on TokenViewer { project {
      environment(name: "master") { contentModel {
        models { id apiId fields { apiId } }
      } }
    } } } }''')
    return {model["apiId"]: model for model in result["viewer"]["project"]["environment"]["contentModel"]["models"]}


def migrate(query, label):
    gql(query)
    for _ in range(90):
        time.sleep(1)
        result = gql('''{ viewer { ... on TokenViewer { project {
          environment(name: "master") { runningMigration { status errors } }
        } } } }''')
        running = result["viewer"]["project"]["environment"]["runningMigration"]
        if running is None:
            print(label)
            return
        if running["status"] in ("FAILED", "TIMEOUT"):
            raise RuntimeError(f"{label} failed: {running['errors']}")
    raise TimeoutError(f"{label} did not finish")


def model(api_id, plural, name):
    existing = models().get(api_id)
    if existing:
        return existing["id"]
    migrate(f'''mutation {{ createModel(data: {{
      environmentId: "{ENVIRONMENT_ID}" apiId: "{api_id}"
      apiIdPlural: "{plural}" displayName: "{name}"
    }}) {{ migration {{ id }} }} }}''', f"Created {api_id}")
    return models()[api_id]["id"]


def field(model_id, model_api, api_id, name, field_type, required=False, unique=False):
    if api_id in {item["apiId"] for item in models()[model_api]["fields"]}:
        return
    migrate(f'''mutation {{ createSimpleField(data: {{
      modelId: "{model_id}" apiId: "{api_id}" displayName: "{name}"
      type: {field_type} isRequired: {str(required).lower()}
      isUnique: {str(unique).lower()} isList: false isLocalized: false
    }}) {{ migration {{ id }} }} }}''', f"Created {model_api}.{api_id}")


def asset(model_id):
    if "heroImage" in {item["apiId"] for item in models()["ShopProduct"]["fields"]}:
        return
    migrate(f'''mutation {{ createRelationalField(data: {{
      modelId: "{model_id}" apiId: "heroImage" displayName: "Product image"
      type: ASSET isList: false isRequired: false
      reverseSide: {{ modelId: "{model_id}" field: {{
        apiId: "shopProductHeroImages" displayName: "Shop product hero images" isList: true
      }} }}
    }}) {{ migration {{ id }} }} }}''', "Created ShopProduct.heroImage")


def variants(product_id, variant_id):
    if "product" in {item["apiId"] for item in models()["ShopVariant"]["fields"]}:
        return
    migrate(f'''mutation {{ createRelationalField(data: {{
      modelId: "{variant_id}" apiId: "product" displayName: "Product"
      type: RELATION isList: false isRequired: true
      reverseSide: {{ modelId: "{product_id}" field: {{
        apiId: "variants" displayName: "Variants" isList: true
      }} }}
    }}) {{ migration {{ id }} }} }}''', "Created ShopVariant.product relation")


def main():
    product_id = model("ShopProduct", "ShopProducts", "Shop product")
    variant_id = model("ShopVariant", "ShopVariants", "Shop variant")
    for api_id, name, field_type, required, unique in (
        ("slug", "URL slug", "STRING", True, True),
        ("titleEn", "English name", "STRING", True, False),
        ("titleEs", "Spanish name", "STRING", False, False),
        ("descriptionEn", "English description", "STRING", False, False),
        ("descriptionEs", "Spanish description", "STRING", False, False),
        ("category", "Category (apparel or accessory)", "STRING", False, False),
        ("sortOrder", "Display order", "INT", False, False),
    ):
        field(product_id, "ShopProduct", api_id, name, field_type, required, unique)
    asset(product_id)
    for api_id, name, field_type, required, unique in (
        ("sku", "SKU", "STRING", True, True),
        ("labelEn", "English option label", "STRING", True, False),
        ("labelEs", "Spanish option label", "STRING", False, False),
        ("unitAmount", "Price in US cents", "INT", True, False),
    ):
        field(variant_id, "ShopVariant", api_id, name, field_type, required, unique)
    variants(product_id, variant_id)
    print("Hygraph shop schema ready; no entries published")


if __name__ == "__main__":
    main()
