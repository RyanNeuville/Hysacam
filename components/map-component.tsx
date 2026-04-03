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
  title: string | null
  description: string
  typeInsalubrite: string
  latitude: number
  longitude: number
  statut: "En attente" | "En cours" | "Résolu"
}

export default function MapComponent({ reports }: { reports: Report[] }) {
  // Douala coordinates
  const doualaLat = 4.0511
  const doualaLng = 9.7679

  const statusColor = {
    "En attente": '#FFA500',
    "En cours": '#3B82F6',
    "Résolu": '#10B981',
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
      {reports.filter(r => r.latitude && r.longitude).map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="space-y-2 text-sm">
              <h3 className="font-semibold px-1">{(report.title || report.typeInsalubrite).toUpperCase()}</h3>
              <p className="text-gray-600 px-1 line-clamp-1">{report.description}</p>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <span className="text-[10px] font-medium text-gray-400">STATUS:</span>
                <span
                  className="px-2 py-1 rounded text-white text-[10px] font-bold"
                  style={{ backgroundColor: statusColor[report.statut] || '#6B7280' }}
                >
                  {report.statut.toUpperCase()}
                </span>
                <a href={`/dashboard/reports/${report.id}`} className="ml-auto text-[10px] text-blue-600 font-bold hover:underline">
                  DÉTAILS
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
