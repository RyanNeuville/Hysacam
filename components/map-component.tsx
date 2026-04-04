'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ExternalLink, MapPin } from 'lucide-react'

// Fix Leaflet default icons or create custom ones
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  })
}

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

// Recentering helper component
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({ reports }: { reports: Report[] }) {
  const router = useRouter()
  // Douala coordinates
  const doualaLat = 4.0511
  const doualaLng = 9.7679

  const statusColor = {
    "En attente": '#EAB308', // yellow-500
    "En cours": '#3B82F6',   // blue-500
    "Résolu": '#10B981',     // green-500
  }

  return (
    <MapContainer
      center={[doualaLat, doualaLng]}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: '600px', width: '100%', borderRadius: '0.75rem', zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {reports.filter(r => r.latitude && r.longitude).map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={L.icon({
             iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-' + 
                      (report.statut === 'Résolu' ? 'green' : report.statut === 'En cours' ? 'blue' : 'orange') + '.png',
             shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
             iconSize: [25, 41],
             iconAnchor: [12, 41],
             popupAnchor: [1, -34],
             shadowSize: [41, 41]
          })}
        >
          <Popup className="custom-popup">
            <div className="p-1 space-y-3 min-w-[200px]">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                   {report.typeInsalubrite}
                 </span>
                 <h3 className="font-bold text-sm text-foreground">
                   {(report.title || "Signalement sans titre").toUpperCase()}
                 </h3>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {report.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor[report.statut] }}></div>
                  <span className="text-[10px] font-bold uppercase" style={{ color: statusColor[report.statut] }}>
                    {report.statut}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2 text-[10px] font-bold gap-1 text-primary hover:bg-primary/5"
                  onClick={() => router.push(`/dashboard/reports/${report.id}`)}
                >
                  VOIR DÉTAILS
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
