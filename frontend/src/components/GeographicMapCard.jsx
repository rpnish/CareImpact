import React, { useEffect, useRef, useMemo } from 'react';
import { MapPin, Users, AlertCircle, AlertOctagon, CheckCircle2, Building, Layers } from 'lucide-react';
import L from 'leaflet';
import { buildGeoPoints } from '../utils/geoUtils';

export default function GeographicMapCard({ members = [], scopeTitle = 'Active Cohort' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Compute geo points for the active member set
  const geoPoints = useMemo(() => {
    return buildGeoPoints(members);
  }, [members]);

  const totalCities = geoPoints.length;
  const totalGapsInGeo = geoPoints.reduce((acc, p) => acc + p.pendingMembers, 0);

  // Top 5 hotspot cities with most pending care gaps
  const topHotspots = useMemo(() => {
    return [...geoPoints]
      .filter((p) => p.pendingMembers > 0)
      .sort((a, b) => b.pendingMembers - a.pendingMembers)
      .slice(0, 5);
  }, [geoPoints]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance once
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [42.30, -71.50], // Center on Massachusetts
        zoom: 8,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Dark Matter clean tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    if (geoPoints.length === 0) return;

    const bounds = [];

    // Add circle markers for each city cluster
    geoPoints.forEach((point) => {
      if (!point.lat || !point.lng) return;

      bounds.push([point.lat, point.lng]);

      const hasGaps = point.pendingMembers > 0;
      const fillColor = hasGaps ? '#F43F5E' : '#10B981';
      const strokeColor = hasGaps ? '#BE123C' : '#047857';
      const radius = Math.max(8, Math.min(22, 6 + point.totalMembers * 1.8));

      const marker = L.circleMarker([point.lat, point.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.65,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; color: #F1F5F9; min-width: 170px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; color: #FFFFFF; border-bottom: 1px solid #334155; padding-bottom: 4px;">
            ${point.city}, ${point.state}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #94A3B8;">
            <span>Total Patients:</span>
            <strong style="color: #FFFFFF; font-family: monospace;">${point.totalMembers}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #10B981;">
            <span>Gap-Free:</span>
            <strong style="font-family: monospace;">${point.completedMembers}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #F43F5E;">
            <span>With Care Gaps:</span>
            <strong style="font-family: monospace;">${point.pendingMembers}</strong>
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 4px; border-top: 1px dashed #334155; padding-top: 4px;">
            <span style="color: #94A3B8; font-weight: 600;">Top Open Gaps:</span>
            <div>${point.topGapsString}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
    }
  }, [geoPoints]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>Geographic Distribution & Care Gap Clustering</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Member density and pending gap locations for{' '}
            <span className="text-slate-200 font-semibold">{scopeTitle}</span> across {totalCities} Massachusetts regional clusters.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-medium">Gap-Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300 font-medium">Pending Gaps</span>
          </div>
        </div>
      </div>

      {/* Map Container & Hotspots Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Leaflet Map (Span 3) */}
        <div className="lg:col-span-3 h-[380px] rounded-xl overflow-hidden border border-slate-800 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Hotspot City Callouts (Span 1) */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Top Gap Hotspot Cities
            </span>

            <div className="space-y-2">
              {topHotspots.map((pt) => (
                <div
                  key={pt.zip}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white leading-tight">{pt.city}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ZIP {pt.zip}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-rose-400 font-black text-xs">{pt.pendingMembers} Gaps</div>
                    <div className="text-slate-500 text-[10px]">{pt.totalMembers} total</div>
                  </div>
                </div>
              ))}

              {topHotspots.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  All regional clusters are 100% compliant!
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Click on any circle marker on the map to inspect city details and specific measure gaps.
          </div>
        </div>
      </div>
    </div>
  );
}
