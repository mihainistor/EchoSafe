/**
 * Matrice alerte EchoSafe — Eveniment, Condiție, Canal, Conținut
 * Folosit pentru afișare în UI și pentru generarea mesajelor (backend).
 */
export const ALERT_MATRIX = [
  {
    event: 'Părăsire Traseu',
    eventKey: 'deviation',
    condition: 'Distanță > X metri de axul traseului',
    channel: 'Push + SMS',
    content: '[Nume] s-a abătut de la traseu la ora [HH:mm]. Locație: [Link Hartă]',
  },
  {
    event: 'Staționare',
    eventKey: 'inactivity',
    condition: 'Timp staționare > Limita setată',
    channel: 'Push',
    content: '[Nume] staționează de [Y] minute în zona [Adresă/Coordonate].',
  },
  {
    event: 'No-Go Entry',
    eventKey: 'no_go',
    condition: 'Coordonate în interiorul zonei interzise',
    channel: 'SMS (Prioritar)',
    content: 'CRITICAL: [Nume] a intrat în zona interzisă [Nume Zonă]!',
  },
  {
    event: 'Check-in',
    eventKey: 'check_in',
    condition: 'Coordonate în interiorul Destinației',
    channel: 'Push',
    content: '[Nume] a ajuns la [Destinație] la ora [HH:mm].',
  },
]

export const ALERT_TYPE_LABELS = Object.fromEntries(
  ALERT_MATRIX.map((row) => [row.eventKey, row.event])
)
