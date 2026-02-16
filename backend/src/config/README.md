# Configurare Orange API

EchoSafe folosește următoarele credențiale Orange pentru apelarea API-urilor (ex: Device Location Retrieval).

**Documentație oficială Device Location Retrieval (Playground 0.3):**  
[https://docs.developer.orange.com/network-apis/api-catalog/device-location-retrieval/playground/0.3/api-reference#tag/location-retrieval/POST/retrieve](https://docs.developer.orange.com/network-apis/api-catalog/device-location-retrieval/playground/0.3/api-reference#tag/location-retrieval/POST/retrieve)

- **Endpoint:** `POST {baseUrl}/retrieve`, body: `{ "device": { "phoneNumber": "+40..." }, "maxAge"?: number }`
- **Răspuns:** `{ lastLocationTime, area: { areaType: "CIRCLE"|"POLYGON", center?, radius?, boundary? } }`
- **Autentificare:** Application Key (header) + Authorization Basic (2-Legged OAuth)
- **Playground:** date simulate; pentru teste pot fi folosite numere cu prefix +990 (conform doc Orange)

---

## Variabile de mediu

Copiați `.env.example` în `.env` și completați cu valorile din Orange Developer:

| Variabilă | Descriere |
|-----------|-----------|
| `ORANGE_APPLICATION_KEY` | Application key-ul aplicației |
| `ORANGE_CLIENT_ID` | Client ID |
| `ORANGE_CLIENT_SECRET` | Client secret |
| `ORANGE_AUTHORIZATION_HEADER` | (Opțional) Header complet `Basic <base64>`. Dacă este setat, are prioritate față de CLIENT_ID + CLIENT_SECRET |
| `ORANGE_APPLICATION_KEY_HEADER_NAME` | (Opțional) Numele header-ului pentru application key; implicit: `apiKeyHeader` |

La fiecare request către Orange se trimit:

- `Authorization: Basic <base64(client_id:client_secret)>`
- `apiKeyHeader: <ORANGE_APPLICATION_KEY>` (sau numele configurat)

## Base URL-uri Orange (Playground)

- **Device Location Retrieval (v0.3):** `https://api.orange.com/camara/playground/api/location-retrieval/v0.3`
- **Device Reachability Status (v0.6):** `https://api.orange.com/camara/playground/api/device-reachability-status/v0.6`

Ambele folosesc aceleași credențiale (Application Key + Authorization Basic).
