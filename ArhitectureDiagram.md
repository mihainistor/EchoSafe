# Diagrama Arhitectură — EchoSafe (PlantUML)

```plantuml
@startuml
title EchoSafe – Arhitectură logică (Frontend + Backend + Integrare)
skinparam componentStyle rectangle
skinparam wrapWidth 220
skinparam maxMessageSize 120
left to right direction

actor Admin as User

rectangle "Browser" as Browser {
  component "Frontend\n(React 18 + Vite)" as FE {
    package "Routing & Layout" {
      [Layout]\n[Header]\n[ProtectedRoute]
    }
    package "Pages" {
      [Dashboard]\n[MemberList]\n[MemberDetail]\n[TimeMachine]\n[Alerts]\n[Profile]
    }
    package "State Management" {
      [AppContext]\n- linkedMembers\n- routes (smart/free‑hand)\n- alertTypes\n- inactivityAlert\n- notifications
    }
    package "Components" {
      [RouteBuilder]\n[LiveMap]\n[AddressAutocomplete]
    }
    package "API Clients" {
      [auth.js]\n[client.js]
    }
  }
}

folder "Dev Server / Static" as Serve {
  component "Vite Dev Server\n(port 3006, strictPort)" as VITE
}

component "Backend\n(Express 4, Node.js)" as BE {
  package "/api/auth" as Auth {
    [POST /register]\n[POST /login]
  }
  package "/api/users" as Users {
    [GET /me]\n[PATCH /me]
  }
  package "/api/devices" as Devices {
    [GET /] listDevices\n[GET /:id]\n[GET /:id/location]\n[GET /:id/reachability]\n[GET /:id/location-history]\n[PATCH /:id/live-tracking]
  }
  package "/api/dev" as DevOps {
    [/start-vite]\n[/build-frontend]
  }
}

cloud "Orange CAMARA APIs (plan)" as ORANGE {
  [Device Location Retrieval v0.3]\n[Device Reachability Status v0.6]
}

database "PostgreSQL + PostGIS\n(roadmap)" as DB

rectangle "E2E Tests" as TESTS {
  component "Playwright\n(chromium headless)" as PW
}

note top of FE
 Demo ON:
  - auth/client returnează date sintetice
  - TimeMachine redă rute demo
  - Heatmap: rază fixă 40m, binning local
 Non‑demo (plan):
  - consumă API backend + Orange
end note

FE -down-> VITE : Dev build & HMR\nhttp://localhost:3006
FE -down-> BE : REST /api (proxy Vite)
BE -right-> ORANGE : Integrare reală (viitor)\nlocație/reachability
BE -down-> DB : Persistență (viitor)\nrute, geofences, istoric
PW ..> FE : Navigare UI\nVerificări e2e

note on link FE-BE
 Vite proxy: /api → http://localhost:4000
 JWT la rutele protejate
end note

note right of Devices
 Endpoint-uri cheie consumate de FE:
  - GET /api/devices/:id/location
  - GET /api/devices/:id/reachability
  - GET /api/devices/:id/location-history
  - PATCH /api/devices/:id/live-tracking
end note

User --> Browser : Interacțiune UI

@enduml
```
