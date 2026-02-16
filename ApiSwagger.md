openapi: 3.0.3
info:
  title: EchoSafe API
  version: 1.0.0
  description: API REST pentru aplicația EchoSafe (auth, users, devices, alerts, analytics, dev).
servers:
  - url: http://localhost:4000
    description: Local API
tags:
  - name: Auth
  - name: Users
  - name: Devices
  - name: Alerts
  - name: Analytics
  - name: Dev
  - name: Health
paths:
  /api/health:
    get:
      tags: [Health]
      summary: Health check
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: ok
                  version:
                    type: string

  /api/auth/register:
    post:
      tags: [Auth]
      summary: Înregistrare cont
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: Creat
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          description: Eroare validare

  /api/auth/login:
    post:
      tags: [Auth]
      summary: Autentificare
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Autentificat
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Credenziale invalide

  /api/auth/forgot-password:
    post:
      tags: [Auth]
      summary: Cere link resetare parolă
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ForgotPasswordRequest'
      responses:
        '200':
          description: Email trimis
        '400':
          description: Eroare

  /api/auth/reset-password:
    post:
      tags: [Auth]
      summary: Setează parolă nouă
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResetPasswordRequest'
      responses:
        '200':
          description: Parolă resetată
        '400':
          description: Token invalid/expirat

  /api/auth/change-password:
    post:
      tags: [Auth]
      summary: Schimbare parolă (autentificat)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ChangePasswordRequest'
      responses:
        '200':
          description: Schimbată
        '400':
          description: Eroare
        '401':
          description: Neautorizat

  /api/users/me:
    get:
      tags: [Users]
      summary: Profil utilizator
      security:
        - bearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          description: Neautorizat
    patch:
      tags: [Users]
      summary: Actualizare profil
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          description: Neautorizat

  /api/users/me/suspend:
    post:
      tags: [Users]
      summary: Suspendă contul curent
      security:
        - bearerAuth: []
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                until:
                  type: string
                  format: date-time
      responses:
        '200':
          description: OK
        '401':
          description: Neautorizat

  /api/users/me:
    delete:
      tags: [Users]
      summary: Șterge contul curent
      security:
        - bearerAuth: []
      responses:
        '204':
          description: Șters
        '401':
          description: Neautorizat

  /api/devices:
    get:
      tags: [Devices]
      summary: Listează dispozitivele
      security:
        - bearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Device'
        '401':
          description: Neautorizat
    post:
      tags: [Devices]
      summary: Creează dispozitiv (onboarding)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDeviceRequest'
      responses:
        '201':
          description: Creat
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Device'
        '400':
          description: Eroare validare
        '401':
          description: Neautorizat

  /api/devices/{id}:
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    get:
      tags: [Devices]
      summary: Detalii dispozitiv
      security:
        - bearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Device'
        '401':
          description: Neautorizat
        '404':
          description: Nu există

  /api/devices/{id}/validate-otp:
    post:
      tags: [Devices]
      summary: Validează OTP pentru onboarding
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ValidateOtpRequest'
      responses:
        '200':
          description: OK
        '400':
          description: OTP invalid
        '401':
          description: Neautorizat

  /api/devices/{id}/location:
    get:
      tags: [Devices]
      summary: Locație curentă
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
        - in: query
          name: maxAge
          required: false
          schema:
            type: integer
            description: Secunde
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Location'
        '401':
          description: Neautorizat
        '404':
          description: Nu există

  /api/devices/{id}/reachability:
    get:
      tags: [Devices]
      summary: Reachability curent
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Reachability'
        '401':
          description: Neautorizat
        '404':
          description: Nu există

  /api/devices/{id}/location-history:
    get:
      tags: [Devices]
      summary: Istoric locație
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
        - in: query
          name: from
          required: false
          schema:
            type: string
            format: date-time
        - in: query
          name: to
          required: false
          schema:
            type: string
            format: date-time
        - in: query
          name: limit
          required: false
          schema:
            type: integer
            minimum: 1
            default: 5000
        - in: query
          name: offset
          required: false
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LocationHistoryResponse'
        '401':
          description: Neautorizat
        '404':
          description: Nu există

  /api/devices/{id}/live-tracking:
    patch:
      tags: [Devices]
      summary: Pornește/Oprește live tracking (auto‑stop în ~10 min)
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LiveTrackingPatch'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LiveTrackingState'
        '401':
          description: Neautorizat
        '404':
          description: Nu există

  /api/alerts:
    get:
      tags: [Alerts]
      summary: Listare alerte (istoric)
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: types
          required: false
          schema:
            type: string
            description: Listă tipuri separate prin virgulă (ex. no-go-enter,deviation)
        - in: query
          name: from
          required: false
          schema:
            type: string
            format: date-time
        - in: query
          name: to
          required: false
          schema:
            type: string
            format: date-time
        - in: query
          name: page
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AlertsResponse'
        '401':
          description: Neautorizat

  /api/analytics/heatmap:
    get:
      tags: [Analytics]
      summary: Heatmap agregată (non‑demo)
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: memberId
          required: true
          schema:
            type: string
        - in: query
          name: from
          required: true
          schema:
            type: string
            format: date-time
        - in: query
          name: to
          required: true
          schema:
            type: string
            format: date-time
        - in: query
          name: grid
          required: false
          schema:
            type: string
            example: 1km
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HeatmapResponse'
        '401':
          description: Neautorizat

  /api/dev/start-vite:
    post:
      tags: [Dev]
      summary: Pornește Vite dev server
      responses:
        '200':
          description: Pornit
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: started
                  url:
                    type: string
                    example: http://localhost:3006

  /api/dev/build-frontend:
    post:
      tags: [Dev]
      summary: Rulează build pentru frontend
      responses:
        '200':
          description: Build OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: built
                  dist:
                    type: string
                    example: d:/SafeKidAPP/frontend/dist

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    AuthResponse:
      type: object
      properties:
        token:
          type: string
    RegisterRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
        msisdn:
          type: string
          description: Număr telefon (opțional)
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
    ForgotPasswordRequest:
      type: object
      required: [email]
      properties:
        email:
          type: string
          format: email
    ResetPasswordRequest:
      type: object
      required: [token, newPassword]
      properties:
        token:
          type: string
        newPassword:
          type: string
    ChangePasswordRequest:
      type: object
      required: [oldPassword, newPassword]
      properties:
        oldPassword:
          type: string
        newPassword:
          type: string

    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        msisdn:
          type: string
        notifications:
          type: object
          additionalProperties: true

    UpdateUserRequest:
      type: object
      properties:
        email:
          type: string
          format: email
        msisdn:
          type: string
        notifications:
          type: object
          additionalProperties: true

    Device:
      type: object
      properties:
        id:
          type: string
        label:
          type: string
        msisdn_target:
          type: string
        live_tracking_mode:
          type: boolean
        live_tracking_until:
          type: string
          format: date-time

    CreateDeviceRequest:
      type: object
      required: [msisdn_target, label]
      properties:
        msisdn_target:
          type: string
        label:
          type: string

    ValidateOtpRequest:
      type: object
      required: [otp]
      properties:
        otp:
          type: string

    Location:
      type: object
      properties:
        lat:
          type: number
          format: double
        lng:
          type: number
          format: double
        accuracy:
          type: number
        ts:
          type: string
          format: date-time

    Reachability:
      type: object
      properties:
        status:
          type: string
          enum: [CONNECTED_DATA, CONNECTED_SMS, UNKNOWN]
        ts:
          type: string
          format: date-time

    LocationPoint:
      type: object
      properties:
        lat:
          type: number
          format: double
        lng:
          type: number
          format: double
        ts:
          type: string
          format: date-time

    Route:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
          enum: [smart, freehand]
        name:
          type: string
        distance_m:
          type: number
        eta_s:
          type: number
        points:
          type: array
          items:
            $ref: '#/components/schemas/LocationPoint'

    LocationHistoryResponse:
      type: object
      properties:
        points:
          type: array
          items:
            $ref: '#/components/schemas/LocationPoint'
        routes:
          type: array
          items:
            $ref: '#/components/schemas/Route'

    LiveTrackingPatch:
      type: object
      required: [enabled]
      properties:
        enabled:
          type: boolean

    LiveTrackingState:
      type: object
      properties:
        live_tracking_mode:
          type: boolean
        live_tracking_until:
          type: string
          format: date-time

    Alert:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
          enum: [no-go-enter, no-go-exit, deviation, inactivity]
        deviceId:
          type: string
        routeId:
          type: string
        minutes:
          type: number
        location:
          $ref: '#/components/schemas/Location'
        ts:
          type: string
          format: date-time

    AlertsResponse:
      type: object
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Alert'
        total:
          type: integer

    HeatmapCell:
      type: object
      properties:
        lat:
          type: number
        lng:
          type: number
        weight:
          type: number

    HeatmapResponse:
      type: object
      properties:
        cells:
          type: array
          items:
            $ref: '#/components/schemas/HeatmapCell'
security:
  - bearerAuth: []
