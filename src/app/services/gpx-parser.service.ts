import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { GpxData, TrackPoint, LatLngBounds } from '../models/itinerary.model';

@Injectable({ providedIn: 'root' })
export class GpxParserService {
  /**
   * Parse un fichier GPX et retourne un Observable<GpxData>.
   */
  parseGpx(file: File): Observable<GpxData> {
    return from(file.text()).pipe(
      map((xmlString) => this.parseXml(xmlString))
    );
  }

  /**
   * Parse une string XML GPX.
   */
  parseXml(xmlString: string): GpxData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('GPX invalide : parsing XML échoué');
    }

    const trk = doc.querySelector('trk');
    if (!trk) {
      throw new Error('GPX sans élément <trk>');
    }

    const name = trk.querySelector('name')?.textContent?.trim() ?? 'Sans nom';

    const trkpts = Array.from(trk.querySelectorAll('trkpt'));

    const trackpoints: TrackPoint[] = trkpts.map((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') ?? '0');
      const lon = parseFloat(pt.getAttribute('lon') ?? '0');
      const eleEl = pt.querySelector('ele');
      const timeEl = pt.querySelector('time');

      return {
        lat,
        lon,
        ele: eleEl ? parseFloat(eleEl.textContent ?? '') : undefined,
        time: timeEl ? new Date(timeEl.textContent ?? '') : undefined,
      };
    });

    const bounds = this.computeBounds(trackpoints);
    const totalDistance = this.computeTotalDistance(trackpoints);
    const { totalElevationGain, totalElevationLoss } = this.computeElevation(trackpoints);

    return {
      name,
      trackpoints,
      totalDistance,
      totalElevationGain,
      totalElevationLoss,
      bounds,
    };
  }

  private computeBounds(trackpoints: TrackPoint[]): LatLngBounds {
    if (trackpoints.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }
    const lats = trackpoints.map((p) => p.lat);
    const lons = trackpoints.map((p) => p.lon);
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lons),
      west: Math.min(...lons),
    };
  }

  private computeTotalDistance(trackpoints: TrackPoint[]): number {
    let total = 0;
    for (let i = 1; i < trackpoints.length; i++) {
      total += this.haversineDistance(trackpoints[i - 1], trackpoints[i]);
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * Distance Haversine entre deux points en km.
   */
  private haversineDistance(a: TrackPoint, b: TrackPoint): number {
    const R = 6371; // rayon Terre en km
    const dLat = this.toRad(b.lat - a.lat);
    const dLon = this.toRad(b.lon - a.lon);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);

    const a2 =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private computeElevation(trackpoints: TrackPoint[]): {
    totalElevationGain: number;
    totalElevationLoss: number;
  } {
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < trackpoints.length; i++) {
      const prev = trackpoints[i - 1];
      const curr = trackpoints[i];
      if (prev.ele !== undefined && curr.ele !== undefined) {
        const diff = curr.ele - prev.ele;
        if (diff > 0) gain += diff;
        else loss += Math.abs(diff);
      }
    }
    return {
      totalElevationGain: Math.round(gain),
      totalElevationLoss: Math.round(loss),
    };
  }
}