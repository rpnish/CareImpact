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
      const fillColor = hasGaps ? '#F43F5E' : '#14B8A6';
      const strokeColor = hasGaps ? '#E11D48' : '#0D9488';
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
        <div style="font-family: inherit; font-size: 12px; color: #F1F5F9; min-width: 150px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #FFFFFF;">
            ${point.city}, ${point.state}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #94A3B8;">
            <span>Total Members:</span>
            <strong style="color: #FFFFFF;">${point.total_members}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #14B8A6;">
            <span>Completed:</span>
            <strong>${point.completed_members}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #F43F5E;">
            <span>Pending Gaps:</span>
            <strong>${point.pending_members}</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });
  }, [geoPoints]);

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-light" />
            Geographic Gap Distribution (Massachusetts Cohort)
          </h3>
          <p className="text-xs text-slate-400">Members plotted by city with pending gap clustering</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-light"></span>
            <span className="text-slate-300">All Gaps Closed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-light"></span>
            <span className="text-slate-300">Has Pending Gaps</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-800 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 mt-3 border-t border-slate-800">
        <span>Click any marker to inspect city counts</span>
        <button
          onClick={() => navigate('/members')}
          className="flex items-center gap-1 text-teal-light hover:underline"
        >
          <span>View all members in table</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
