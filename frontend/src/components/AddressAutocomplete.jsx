import { useEffect, useState } from 'react'
import styles from './AddressAutocomplete.module.css'

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Adresă',
  minChars = 3,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const q = (value || '').trim()
    if (q.length < minChars) {
      setItems([])
      setError('')
      return
    }
    const handle = setTimeout(async () => {
      setError('')
      const enc = encodeURIComponent(q)
      let suggestions = []
      try {
        const url1 = `https://photon.komoot.io/api/?q=${enc}&lang=ro&limit=5`
        const res1 = await fetch(url1)
        if (!res1.ok) throw new Error('photon')
        const data1 = await res1.json()
        suggestions = ((data1 && data1.features) || [])
          .map((f) => {
            const p = f.properties || {}
            const parts = []
            if (p.name) parts.push(p.name)
            if (p.street) parts.push(p.street)
            if (p.housenumber) parts.push(p.housenumber)
            if (p.city || p.town || p.village) parts.push(p.city || p.town || p.village)
            if (p.state || p.county) parts.push(p.state || p.county)
            if (p.country) parts.push(p.country)
            return {
              label: parts.filter(Boolean).join(', '),
              lat: Array.isArray(f.geometry?.coordinates) ? Number(f.geometry.coordinates[1]) : undefined,
              lng: Array.isArray(f.geometry?.coordinates) ? Number(f.geometry.coordinates[0]) : undefined,
              country: p.country || '',
              countrycode: (p.countrycode || '').toUpperCase(),
            }
          })
          .filter((x) => x.label && (x.countrycode === 'RO' || (x.country || '').toLowerCase().includes('romania') || (x.country || '').toLowerCase().includes('românia')))
      } catch {}
      if (!suggestions || suggestions.length === 0) {
        try {
          const url2 = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=ro&accept-language=ro&q=${enc}`
          const res2 = await fetch(url2)
          if (!res2.ok) throw new Error('nominatim')
          const data2 = await res2.json()
          suggestions = (data2 || []).map((x) => ({
            label: x.display_name,
            lat: Number(x.lat),
            lng: Number(x.lon),
          }))
        } catch {
          setItems([])
          setError('Serviciul de sugestii adrese este indisponibil. Încearcă din nou.')
          return
        }
      }
      setItems(suggestions)
      setError('')
    }, 300)
    return () => clearTimeout(handle)
  }, [value, open, minChars])

  return (
    <div
      className={styles.wrap}
      onFocus={() => setOpen(true)}
      onBlur={() => setTimeout(() => setOpen(false), 150)}
    >
      <input
        type="text"
        placeholder={placeholder}
        className={className || styles.input}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
      />
      {open && (value || '').trim().length >= minChars && items.length > 0 && (
        <div className={styles.box}>
          {items.map((s, i) => (
            <div
              key={`s-${i}`}
              className={styles.item}
              onMouseDown={() => {
                onChange(s.label)
                onSelect && onSelect(s)
                setItems([s])
                setOpen(false)
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
