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

      // CartoDB Voyager clean light tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
        fillOpacity: 0.7,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: 'Inter', system-ui, sans-serif; font-size: 12px; color: #0F172A; min-width: 170px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
            ${point.city}, ${point.state}
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #64748B;">
            <span>Total Patients:</span>
            <strong style="color: #0F172A; font-family: monospace;">${point.totalMembers}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px; color: #059669;">
            <span>Gap-Free:</span>
            <strong style="font-family: monospace;">${point.completedMembers}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #E11D48;">
            <span>With Care Gaps:</span>
            <strong style="font-family: monospace;">${point.pendingMembers}</strong>
          </div>
          <div style="font-size: 10px; color: #64748B; margin-top: 4px; border-top: 1px dashed #E2E8F0; padding-top: 4px;">
            <span style="color: #475569; font-weight: 600;">Top Open Gaps:</span>
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
      {/* Map Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Geographic Distribution & Care Gap Clustering</span>
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Member density and pending gap locations for{' '}
            <span className="text-slate-900 font-semibold">{scopeTitle}</span> across {totalCities} Massachusetts regional clusters.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">Gap-Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-700 font-medium">Pending Gaps</span>
          </div>
        </div>
      </div>

      {/* Map Container & Hotspots Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Leaflet Map (Span 3) */}
        <div className="lg:col-span-3 h-[380px] rounded-xl overflow-hidden border border-slate-200 relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Hotspot City Callouts (Span 1) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider block mb-2">
              Top Gap Hotspot Cities
            </span>

            <div className="space-y-2">
              {topHotspots.map((pt) => (
                <div
                  key={pt.zip}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 leading-tight">{pt.city}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ZIP {pt.zip}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-rose-600 font-black text-xs">{pt.pendingMembers} Gaps</div>
                    <div className="text-slate-500 text-[10px]">{pt.totalMembers} total</div>
                  </div>
                </div>
              ))}

              {topHotspots.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  All regional clusters are 100% compliant!
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
            Click on any circle marker on the map to inspect city details and specific measure gaps.
          </div>
        </div>
      </div>
    </div>
  );
}
