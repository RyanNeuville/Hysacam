'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icons
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Report {
  id: string
  title: string
  location: string
  latitude?: number
  longitude?: number
  status: string
}

export default function MapComponent({ reports }: { reports: Report[] }) {
  // Douala coordinates
  const doualaLat = 4.0511
  const doualaLng = 9.7679

  // Mock coordinates for reports (in production, these would come from the database)
  const reportsWithCoords = reports.map((report) => ({
    ...report,
    latitude: report.latitude || doualaLat + (Math.random() - 0.5) * 0.1,
    longitude: report.longitude || doualaLng + (Math.random() - 0.5) * 0.1,
  }))

  const statusColor = {
    pending: '#FFA500',
    in_progress: '#3B82F6',
    resolved: '#10B981',
  }

  return (
    <MapContainer
      center={[doualaLat, doualaLng]}
      zoom={12}
      style={{ height: '500px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {reportsWithCoords.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude || doualaLat, report.longitude || doualaLng]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-gray-600">{report.location}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Status:</span>
                <span
                  className="px-2 py-1 rounded text-white text-xs font-semibold"
                  style={{ backgroundColor: statusColor[report.status as keyof typeof statusColor] || '#6B7280' }}
                >
                  {report.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
