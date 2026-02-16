# Device Location Retrieval — Rezumat OpenAPI (CAMARA 0.3)

Spec complet: fișierul OpenAPI (ex: `api-1.json`) de la Orange Developer.

## Request

**POST** `{apiRoot}{basePath}/retrieve`

- **apiRoot:** `https://api.orange.com/camara/playground/api`
- **basePath:** `/location-retrieval/v0.3`

**Body (JSON):**

```json
{
  "device": {
    "phoneNumber": "+40722123456"
  },
  "maxAge": 120
}
```

- `device.phoneNumber` — obligatoriu (2-legged token), E.164 cu `+`
- `maxAge` — opțional (secunde). Lipsă = orice vârstă; `0` = locație proaspătă

**Headers:** Application Key, Authorization Basic, opțional `x-correlator`

## Response 200 — Location

```json
{
  "lastLocationTime": "2023-10-17T13:18:23.682Z",
  "area": {
    "areaType": "CIRCLE",
    "center": { "latitude": 45.754114, "longitude": 4.860374 },
    "radius": 800
  }
}
```

sau POLYGON:

```json
{
  "lastLocationTime": "2023-10-17T13:18:23.682Z",
  "area": {
    "areaType": "POLYGON",
    "boundary": [
      { "latitude": 45.754114, "longitude": 4.860374 },
      ...
    ]
  }
}
```

- `area.radius` — în metri (doar pentru CIRCLE)

## Erori (ErrorInfo: status, code, message)

| HTTP | code | Semnificație |
|------|------|--------------|
| 400 | LOCATION_RETRIEVAL.MAXAGE_INVALID_ARGUMENT | maxAge neacceptat |
| 401 | UNAUTHENTICATED | Credențiale invalide/lipsă |
| 403 | INVALID_TOKEN_CONTEXT | Device din request nu corespunde token-ului |
| 404 | LOCATION_RETRIEVAL.DEVICE_NOT_FOUND | Dispozitivul nu a putut fi localizat |
| 422 | LOCATION_RETRIEVAL.UNABLE_TO_FULFILL_MAX_AGE | Locație proaspătă (maxAge=0) indisponibilă |
| 422 | UNIDENTIFIABLE_DEVICE | Lipsă device (obligatoriu la 2-legged) |
