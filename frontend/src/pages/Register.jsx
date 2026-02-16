import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import styles from './Auth.module.css'

export function Register() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [msisdn, setMsisdn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [peek1, setPeek1] = useState(false)
  const [peek2, setPeek2] = useState(false)
  const pwdRef = useRef(null)
  const pwd2Ref = useRef(null)

  const hasDigit = /[0-9]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  const noTrimNeeded = password === password.trim()

  const validatePasswords = () => {
    const p1 = password
    const p2 = password2
    let msg = ''
    const problems = []
    if (!hasDigit) problems.push('cel puțin o cifră')
    if (!hasUpper) problems.push('cel puțin o literă mare')
    if (!hasSpecial) problems.push('cel puțin un caracter special')
    if (!noTrimNeeded) problems.push('fără spații la început/sfârșit')
    if (problems.length) {
      msg = `Parola trebuie să conțină: ${problems.join(', ')}.`
    }
    if (pwdRef.current) pwdRef.current.setCustomValidity(msg)
    if (pwd2Ref.current) {
      const mismatch = p2 && p1 !== p2 ? 'Parolele nu coincid' : ''
      pwd2Ref.current.setCustomValidity(mismatch)
    }
    return !(msg || (p2 && p1 !== p2))
  }

  useEffect(() => {
    validatePasswords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password, password2])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const ok = validatePasswords()
    if (!ok) {
      if (pwdRef.current && !pwdRef.current.checkValidity()) pwdRef.current.reportValidity()
      else if (pwd2Ref.current && !pwd2Ref.current.checkValidity()) pwd2Ref.current.reportValidity()
      return
    }
    setLoading(true)
    try {
      const p1 = password.trim()
      const p2 = password2.trim()
      if (p1 !== p2) {
        if (pwd2Ref.current) {
          pwd2Ref.current.setCustomValidity('Parolele nu coincid')
          pwd2Ref.current.reportValidity()
        }
        setLoading(false)
        return
      }
      await register({ email, password: p1, msisdn_admin: msisdn, first_name: firstName, last_name: lastName })
      navigate(`/register/success?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err.message || 'Eroare înregistrare')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Înregistrare</h1>
        <p className={styles.subtitle}>
          Creează un cont EchoSafe pentru a începe să protejezi activitatea online a familiei tale.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Nume
            <input
              type="text"
              className={styles.input}
              placeholder="Nume"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </label>
          <label className={styles.label}>
            Prenume
            <input
              type="text"
              className={styles.input}
              placeholder="Prenume"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              className={styles.input}
              placeholder="exemplu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className={styles.label}>
            Numar de telefon
            <input
              type="tel"
              className={styles.input}
              placeholder="07XXXXXXXX"
              value={msisdn}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoComplete="tel"
              required
            />
          </label>
          <label className={styles.label}>
            Parolă
            <div className={styles.inputRow}>
              <input
                ref={pwdRef}
                type={peek1 ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className={styles.peekBtn}
                onMouseDown={() => setPeek1(true)}
                onMouseUp={() => setPeek1(false)}
                onMouseLeave={() => setPeek1(false)}
                onTouchStart={() => setPeek1(true)}
                onTouchEnd={() => setPeek1(false)}
                aria-label="Ține apăsat pentru a vedea parola"
              >
                👁
              </button>
            </div>
            <ul className={styles.rules}>
              <li className={hasDigit ? styles.ruleOk : styles.ruleBad}>{hasDigit ? '✓' : '•'} Cel puțin o cifră (0-9)</li>
              <li className={hasUpper ? styles.ruleOk : styles.ruleBad}>{hasUpper ? '✓' : '•'} Cel puțin o literă mare (A-Z)</li>
              <li className={hasSpecial ? styles.ruleOk : styles.ruleBad}>{hasSpecial ? '✓' : '•'} Cel puțin un caracter special (!, @, #, $, ...)</li>
              <li className={noTrimNeeded ? styles.ruleOk : styles.ruleBad}>{noTrimNeeded ? '✓' : '•'} Fără spații la început sau la sfârșit</li>
            </ul>
          </label>
          <label className={styles.label}>
            Repeta parola
            <div className={styles.inputRow}>
              <input
                ref={pwd2Ref}
                type={peek2 ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
                disabled={!password}
                required
              />
              <button
                type="button"
                className={styles.peekBtn}
                onMouseDown={() => setPeek2(true)}
                onMouseUp={() => setPeek2(false)}
                onMouseLeave={() => setPeek2(false)}
                onTouchStart={() => setPeek2(true)}
                onTouchEnd={() => setPeek2(false)}
                aria-label="Ține apăsat pentru a vedea parola"
              >
                👁
              </button>
            </div>
          </label>
          <button type="submit" className={`${styles.submit} btn btn--primary btn--lg`} disabled={loading}>
            {loading ? 'Se încarcă…' : 'Creează cont'}
          </button>
        </form>
        <p className={styles.footer}>
          Ai deja cont? <Link to="/login" className={styles.link}>Autentifică-te</Link>
        </p>
      </div>
    </div>
  )
}
