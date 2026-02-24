name = "taxmonitor-pro-api"
main = "src/index.js"
compatibility_date = "2025-02-09"

# ---------------------------------------
# Observability
# ---------------------------------------

[observability]
enabled = true

# ---------------------------------------
# Routes (API lives on api.taxmonitor.pro)
# ---------------------------------------

routes = [
  { pattern = "api.taxmonitor.pro/*", zone_name = "taxmonitor.pro" }
]

# ---------------------------------------
# R2 Buckets
# ---------------------------------------

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "taxmonitor-pro"

[[r2_buckets]]
binding = "TRANSCRIPT_R2"
bucket_name = "transcript-taxmonitor-pro"

# ---------------------------------------
# KV (legacy token balances; keep until migration confirmed)
# ---------------------------------------

[[kv_namespaces]]
binding = "TOKENS_KV"
id = "TOKENS_KV"

# ---------------------------------------
# Durable Object (consistent token ledger)
# ---------------------------------------

[[durable_objects.bindings]]
name = "TOKEN_LEDGER"
class_name = "TokenLedger"

[[migrations]]
tag = "v1"
new_classes = ["TokenLedger"]

# ---------------------------------------
# Vars (non-secret)
# ---------------------------------------

[vars]
CLICKUP_ACCOUNTS_LIST_ID = "901710909567"
CLICKUP_ORDERS_LIST_ID = "901710818340"
CLICKUP_SUPPORT_LIST_ID = "901710818377"
GOOGLE_CLIENT_EMAIL = "tax-monitor-worker@tax-monitor-pro.iam.gserviceaccount.com"
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_WORKSPACE_USER_INFO = "info@taxmonitor.pro"
GOOGLE_WORKSPACE_USER_NO_REPLY = "no-reply@taxmonitor.pro"
GOOGLE_WORKSPACE_USER_SUPPORT = "support@taxmonitor.pro"
MY_ORGANIZATION_ADDRESS = "1175 Avocado Avenue Suite 101 PMB 1010"
MY_ORGANIZATION_BUSINESS_LOGO = "https://taxmonitor.pro/assets/logo.svg"
MY_ORGANIZATION_CITY = "El Cajon"
MY_ORGANIZATION_NAME = "Tax Monitor Pro"
MY_ORGANIZATION_STATE_PROVINCE = "CA"
MY_ORGANIZATION_ZIP = "92020"

# Transcript pricing/token vars
CREDIT_MAP_JSON = "{\"price_1T4Ar2CMpIgwe61ZMzAI6yKa\":10,\"price_1T4AxzCMpIgwe61ZsWh7GGAb\":25,\"price_1T4B1gCMpIgwe61ZG12b5tjN\":100}"
PRICE_10 = "price_1T4Ar2CMpIgwe61ZMzAI6yKa"
PRICE_100 = "price_1T4B1gCMpIgwe61ZG12b5tjN"
PRICE_25 = "price_1T4AxzCMpIgwe61ZsWh7GGAb"

# ---------------------------------------
# Secrets (set via wrangler secret put)
# ---------------------------------------

# CAL_WEBHOOK_SECRET
# CLICKUP_API_KEY
# GOOGLE_PRIVATE_KEY
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
