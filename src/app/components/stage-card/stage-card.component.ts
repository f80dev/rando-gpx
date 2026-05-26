import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Stage, POI } from '../../models/itinerary.model';

@Component({
  selector: 'app-stage-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './stage-card.component.html',
  styleUrl: './stage-card.component.scss',
})
export class StageCardComponent {
  stage = input.required<Stage>();
  index = input<number>(0);

  editStage = output<Stage>();
  toggleDisabled = output<string>();
  viewOnMap = output<Stage>();

  isExpanded = signal(false);

  durationFormatted = computed(() => {
    const mins = this.stage().duration;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
  });

  poiTypeIcon(type: POI['type']): string {
    const icons: Record<POI['type'], string> = {
      monument: 'account_balance',
      viewpoint: 'landscape',
      nature: 'park',
      village: 'location_city',
      other: 'place',
    };
    return icons[type] ?? 'place';
  }

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }
}