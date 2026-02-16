import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'

function FitOnChange({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16, { animate: true })
    }
  }, [lat, lng, map])
  return null
}

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function LiveMap({ lat, lng, accuracy = 0, height = 240, centerLat, centerLng, poiLat, poiLng, poiRadius = 0 }) {
  const markerPosition = lat && lng ? [lat, lng] : null
  const center = (centerLat != null && centerLng != null)
    ? [centerLat, centerLng]
    : markerPosition || [44.4268, 26.1025]
  return (
    <div style={{ height }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markerPosition && (
          <>
            <Marker position={markerPosition} icon={icon} />
            {accuracy > 0 && <Circle center={markerPosition} radius={accuracy} pathOptions={{ color: '#2b6cb0', fillOpacity: 0.1 }} />}
          </>
        )}
        {poiLat != null && poiLng != null && (
          <>
            <Marker position={[poiLat, poiLng]} icon={icon} />
            {poiRadius > 0 && <Circle center={[poiLat, poiLng]} radius={poiRadius} pathOptions={{ color: '#059669', fillOpacity: 0.08 }} />}
          </>
        )}
        <FitOnChange lat={center[0]} lng={center[1]} />
      </MapContainer>
    </div>
  )
}
