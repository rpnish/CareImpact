import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, AlertCircle, ArrowRight } from 'lucide-react';
import L from 'leaflet';

export default function GeoMapView({ geoPoints = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map if not already initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [42.28, -71.65], // Center on Massachusetts
        zoom: 8,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark theme tile layer (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add circle markers for each city
    geoPoints.forEach((point) => {
      if (!point.lat || !point.lng) return;

      const hasGaps = point.pending_members > 0;
      const fillColor = hasGaps ? '#F43F5E' : '#10B981';
      const strokeColor = hasGaps ? '#E11D48' : '#059669';
      const radius = Math.max(7, Math.min(22, 6 + point.total_members * 2.5));

      const marker = L.circleMarker([point.lat, point.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.6,
      }).addTo(map);

      // Popup Content
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 170px;">
          <h4 style="margin: 0 0 6px 0; font-weight: 700; font-size: 13px; color: #FFFFFF;">${point.city}, MA</h4>
          <div style="font-size: 11px; margin-bottom: 3px; color: #94A3B8;">Total Members: <strong style="color: #F1F5F9;">${point.total_members}</strong></div>
          <div style="font-size: 11px; margin-bottom: 3px; color: #10B981;">Completed: <strong>${point.completed_members}</strong></div>
          <div style="font-size: 11px; margin-bottom: 8px; color: #F43F5E;">Pending Gaps: <strong>${point.pending_members}</strong></div>
          <a href="/members?search=${encodeURIComponent(point.city)}" style="display: inline-block; padding: 4px 10px; background: #8B5CF6; color: #060814; font-size: 10px; font-weight: 700; border-radius: 6px; text-decoration: none;">Filter City Members &rarr;</a>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });
  }, [geoPoints]);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800/80 flex flex-col justify-between h-full min-h-[340px] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/15 text-ai-cyan border border-cyan-500/30">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">Geographic Care Distribution</h3>
          </div>
          <p className="text-xs text-slate-400">Massachusetts regional gap density and hotspot cities</p>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Gap-Free
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Open Gaps
          </span>
        </div>
      </div>

      <div className="h-56 w-full rounded-2xl overflow-hidden border border-slate-800/80 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
