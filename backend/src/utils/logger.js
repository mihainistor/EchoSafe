export function logInfo(obj) {
  try {
    const out = { level: 'info', time: new Date().toISOString(), ...obj }
    console.log(JSON.stringify(out))
  } catch {
    console.log('[info]', obj && obj.msg ? obj.msg : '')
  }
}
export function logError(obj) {
  try {
    const out = { level: 'error', time: new Date().toISOString(), ...obj }
    console.error(JSON.stringify(out))
  } catch {
    console.error('[error]', obj && obj.msg ? obj.msg : '')
  }
}
