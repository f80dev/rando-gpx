import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Stage, ItineraryPreferences } from '../../models/itinerary.model';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-itinerary-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="summary-card">
      <mat-card-content>
        <div class="stats">
          <div class="stat">
            <mat-icon>route</mat-icon>
            <div class="stat-value">{{ totalDistance() | number:'1.1-1' }} km</div>
            <div class="stat-label">Distance totale</div>
          </div>
          <div class="stat">
            <mat-icon>terrain</mat-icon>
            <div class="stat-value">{{ totalElevation() | number:'1.0-0' }} m</div>
            <div class="stat-label">Dénivelé positif</div>
          </div>
          <div class="stat">
            <mat-icon>schedule</mat-icon>
            <div class="stat-value">{{ stageCount() }}</div>
            <div class="stat-label">Étapes</div>
          </div>
          <div class="stat">
            <mat-icon>calendar_today</mat-icon>
            <div class="stat-value">{{ dateRange() }}</div>
            <div class="stat-label">Dates</div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './itinerary-summary.component.scss',
})
export class ItinerarySummaryComponent {
  stages = input<Stage[]>([]);
  preferences = input<Partial<ItineraryPreferences>>({});

  totalDistance = computed(() =>
    this.stages().reduce((sum, s) => sum + s.distance, 0)
  );

  totalElevation = computed(() =>
    this.stages().reduce((sum, s) => sum + s.elevationGain, 0)
  );

  stageCount = computed(() =>
    this.stages().filter((s) => !s.disabled).length
  );

  dateRange = computed(() => {
    const prefs = this.preferences();
    if (!prefs.startDate || !prefs.numberOfDays) return '—';
    const start = new Date(prefs.startDate);
    const end = addDays(start, prefs.numberOfDays - 1);
    return `${format(start, 'd MMM', { locale: fr })} → ${format(end, 'd MMM yyyy', { locale: fr })}`;
  });
}