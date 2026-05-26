import {
  Component,
  input,
  output,
  signal,
  ElementRef,
  inject,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { GpxData, Stage, POI } from '../../models/itinerary.model';

@Component({
  selector: 'app-gpx-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gpx-map.component.html',
  styleUrl: './gpx-map.component.scss',
})
export class GpxMapComponent implements AfterViewInit, OnDestroy {
  gpxData = input<GpxData | null>(null);
  stages = input<Stage[]>([]);
  pois = input<POI[]>([]);
  interactive = input<boolean>(true);
  showStageMarkers = input<boolean>(true);

  poiClicked = output<POI>();

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private polylines: L.Polyline[] = [];
  private initialized = false;

  selectedPoi = signal<POI | null>(null);

  private el = inject(ElementRef);

  constructor() {
    // Leaflet SSR guard - map init happens in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    this.initMap(this.el);
  }

  initMap(el: ElementRef<HTMLDivElement>): void {
    if (this.initialized) return;

    this.map = L.map(el.nativeElement, {
      center: [46.6034, 2.5], // France centré
      zoom: 6,
      scrollWheelZoom: this.interactive(),
      doubleClickZoom: this.interactive(),
      dragging: this.interactive(),
      zoomControl: this.interactive(),
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(this.map);

    this.initialized = true;
    this.updateMap();
  }

  private updateMap(): void {
    if (!this.map) return;

    // Nettoyer
    this.markers.forEach((m) => m.remove());
    this.polylines.forEach((p) => p.remove());
    this.markers = [];
    this.polylines = [];

    const gpx = this.gpxData();
    if (gpx && gpx.trackpoints.length > 0) {
      const coords = gpx.trackpoints.map((pt) => [pt.lat, pt.lon] as [number, number]);
      this.addPolyline(coords, { color: '#2E7D32', weight: 4 });

      // Start/end markers
      const start = coords[0];
      const end = coords[coords.length - 1];

      L.marker(start, {
        icon: L.divIcon({
          html: '<div style="background:#2E7D32;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>',
          className: '',
          iconSize: [12, 12],
        }),
      })
        .addTo(this.map)
        .bindPopup('Point de départ');

      L.marker(end, {
        icon: L.divIcon({
          html: '<div style="background:#B71C1C;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>',
          className: '',
          iconSize: [12, 12],
        }),
      })
        .addTo(this.map)
        .bindPopup("Point d'arrivée");

      this.map.fitBounds(coords, { padding: [40, 40] });
    }

    const stages = this.stages();
    if (this.showStageMarkers() && stages.length > 0) {
      stages.forEach((stage, i) => {
        if (stage.disabled) return;

        L.marker([stage.endPoint[1], stage.endPoint[0]], {
          icon: L.divIcon({
            html: `<div style="background:#1565C0;color:white;width:20px;height:20px;border-radius:50%;text-align:center;font-size:11px;font-weight:700;line-height:20px">${i + 1}</div>`,
            className: '',
            iconSize: [20, 20],
          }),
        })
          .addTo(this.map!)
          .bindPopup(`Étape ${i + 1}: ${stage.name}`);
      });
    }
  }

  private addPolyline(
    coords: [number, number][],
    options?: L.PolylineOptions
  ): void {
    if (!this.map) return;
    const polyline = L.polyline(coords, {
      color: options?.color ?? '#2E7D32',
      weight: options?.weight ?? 3,
      opacity: options?.opacity ?? 0.8,
    }).addTo(this.map);
    this.polylines.push(polyline);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  /** Called by parent to init after view is ready */
  setupMap(el: ElementRef<HTMLDivElement>): void {
    this.initMap(el);
  }
}
