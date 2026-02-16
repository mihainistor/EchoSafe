# Device Reachability Status — Rezumat OpenAPI (v0.6)

Spec: fișierul OpenAPI pentru Device Reachability Status (Orange / CAMARA).

## Request

**POST** `{apiRoot}/device-reachability-status/v0.6/retrieve`

- **apiRoot:** `https://api.orange.com/camara/playground/api`

**Body (JSON):**

```json
{
  "device": {
    "phoneNumber": "+40722123456"
  }
}
```

- `device.phoneNumber` — obligatoriu (2-legged), E.164 cu `+`

**Headers:** Application Key, Authorization Basic, opțional `x-correlator`

## Response 200 — ReachabilityStatusResponse

```json
{
  "lastStatusTime": "2024-02-20T10:41:38.657Z",
  "reachabilityStatus": "CONNECTED_DATA"
}
```

**reachabilityStatus** (enum):

| Valoare           | Semnificație |
|-------------------|---------------|
| `CONNECTED_DATA`  | Dispozitivul este conectat la rețea prin date (indiferent de SMS) |
| `CONNECTED_SMS`   | Dispozitivul este conectat doar prin SMS |
| `NOT_CONNECTED`   | Dispozitivul nu este conectat |

- `lastStatusTime` — opțional, momentul ultimei actualizări a statusului (RFC 3339).

## Erori (ErrorInfo: status, code, message)

| HTTP | code | Semnificație |
|------|------|--------------|
| 401 | UNAUTHENTICATED | Credențiale invalide/lipsă |
| 403 | INVALID_TOKEN_CONTEXT | Device nu corespunde token-ului |
| 404 | DEVICE_NOT_FOUND | Identificatorul nu corespunde niciunui dispozitiv |
| 422 | UNIDENTIFIABLE_DEVICE | Lipsă device (obligatoriu la 2-legged) |
| 422 | UNABLE_TO_PROVIDE_REACHABILITY_STATUS | Problemă rețea – nu se poate furniza statusul |
| 429 | QUOTA_EXCEEDED / TOO_MANY_REQUESTS | Limită depășită |
