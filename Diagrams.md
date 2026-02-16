# Diagrame

Acest document conține diagramele de stare și diagramele de secvență pentru principalele fluxuri.

## Diagrama de Stare — Membru (Localizare)

```mermaid
stateDiagram-v2
    [*] --> Stationary
    Stationary --> OnRoute: pornește deplasarea
    OnRoute --> OffRoute: abate de la traseu
    OffRoute --> OnRoute: reintră pe traseu
    OnRoute --> Stationary: se oprește
    OffRoute --> Stationary: se oprește
```

## Diagrama de Stare — Live Tracking

```mermaid
stateDiagram-v2
    [*] --> LiveOff
    LiveOff --> LiveOn: activează Live (10 min)
    LiveOn --> LiveOff: expiră 10 min / dezactivare manuală
```

## Diagrama de Stare — Alerte

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> CheckIn: intră în destinație
    Idle --> Deviation: depășește coridorul traseului
    Idle --> NoGo: intră în zonă No-Go
    Idle --> Inactivity: depășește pragul staționare
    CheckIn --> Idle
    Deviation --> Idle
    NoGo --> Idle
    Inactivity --> Idle
```

## Diagrama de Secvență — Onboarding Membru (OTP)

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend
    participant SMS as Orange SMS

    Admin->>FE: Introduce msisdn + label
    FE->>BE: POST /api/devices { msisdn_target, label }
    BE->>SMS: Trimite OTP
    BE-->>FE: 201 { device_id, status }
    Admin->>FE: Introduce OTP
    FE->>BE: POST /api/devices/:id/validate-otp { otp }
    BE-->>FE: { device_id, status }
    FE->>BE: GET /api/devices (refresh)
    BE-->>FE: Lista dispozitive (membri)
```

## Diagrama de Secvență — Live Tracking

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend

    Admin->>FE: Apasă „Live”
    FE->>BE: PATCH /api/devices/:id/live-tracking { enabled: true }
    BE-->>FE: { live_tracking_mode: true, live_tracking_until }
    Note over FE: UI afișează countdown până la expirare
```

## Diagrama de Secvență — Istoric Locație (Time Machine)

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant BE as Backend

    Admin->>FE: Selectează membru și interval
    FE->>BE: GET /api/devices/:id/location-history?from=&to=
    BE-->>FE: { points[], routes? (demo) }
    FE->>FE: Redare pe hartă / heatmap
```
