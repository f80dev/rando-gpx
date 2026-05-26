import { Injectable } from '@angular/core';
import { Stage, Accommodation, Meal, ItineraryPreferences } from '../models/itinerary.model';

@Injectable({ providedIn: 'root' })
export class ExportService {
  /**
   * Génère un fichier GPX avec les étapes actives.
   */
  generateGpx(
    stages: Stage[],
    itineraryName: string
  ): string {
    const tracks = stages
      .filter((s) => !s.disabled && s.gpxCoordinates.length > 0)
      .map(
        (stage) => `
    <trk>
      <name>${this.escapeXml(stage.name)}</name>
      <trkseg>
        ${stage.gpxCoordinates
          .map(
            ([lon, lat]) =>
              `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`
          )
          .join('\n')}
      </trkseg>
    </trk>`
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RandoGPX"
  xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${this.escapeXml(itineraryName)}</name>
  </metadata>${tracks}
</gpx>`;
  }

  /**
   * Télécharge un fichier GPX.
   */
  downloadGpx(gpxContent: string, filename: string): void {
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.gpx') ? filename : `${filename}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Génère un résumé textuel de l'itinéraire.
   */
  generateTextSummary(
    stages: Stage[],
    accommodations: Accommodation[],
    meals: Meal[],
    preferences: Partial<ItineraryPreferences>
  ): string {
    const lines: string[] = [
      `# ${preferences.activityType === 'bike' ? 'Rando VTT' : 'Randonnée'} — Programme`,
      '',
      `Distance totale : ${stages.reduce((s, st) => s + st.distance, 0).toFixed(1)} km`,
      `Dénivelé positif : ${stages.reduce((s, st) => s + st.elevationGain, 0)} m`,
      `Nombre de jours : ${preferences.numberOfDays}`,
      '',
    ];

    stages.forEach((stage, i) => {
      lines.push(`## Étape ${i + 1} : ${stage.name}`);
      lines.push(`- Distance : ${stage.distance} km`);
      lines.push(`- Durée : ~${Math.round(stage.duration / 60)}h${stage.duration % 60 > 0 ? `${stage.duration % 60}min` : ''}`);
      lines.push(`- Dénivelé : +${stage.elevationGain}m / -${stage.elevationLoss}m`);

      if (stage.pois.length > 0) {
        lines.push(`- Points d'intérêt : ${stage.pois.map((p) => p.name).join(', ')}`);
      }

      const acc = accommodations.find((a) => a.stageId === stage.id);
      if (acc) {
        lines.push(`- Hébergement : ${acc.name} (${acc.pricePerNight}€)`);
      }

      const lunch = meals.find((m) => m.stageId === stage.id && m.slot === 'lunch');
      const dinner = meals.find((m) => m.stageId === stage.id && m.slot === 'dinner');
      if (lunch) lines.push(`- Déjeuner : ${lunch.name} (${lunch.price}€)`);
      if (dinner) lines.push(`- Dîner : ${dinner.name} (${dinner.price}€)`);

      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Génère un lien de partage encodé dans l'URL (base64 JSON).
   */
  generateShareUrl(
    stages: Stage[],
    accommodations: Accommodation[],
    meals: Meal[],
    preferences: Partial<ItineraryPreferences>
  ): string {
    const payload = {
      stages: stages.filter((s) => !s.disabled),
      accommodations,
      meals,
      preferences,
    };
    const json = JSON.stringify(payload);
    const compressed = btoa(encodeURIComponent(json));
    return `${window.location.origin}/share/${compressed}`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
