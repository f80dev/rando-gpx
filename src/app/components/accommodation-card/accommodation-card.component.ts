import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Accommodation } from '../../models/itinerary.model';

@Component({
  selector: 'app-accommodation-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="acc-card">
      <mat-card-header>
        <mat-icon mat-card-avatar class="type-icon">{{ typeIcon() }}</mat-icon>
        <mat-card-title>{{ accommodation().name }}</mat-card-title>
        <mat-card-subtitle>
          <span class="price">{{ accommodation().pricePerNight }}€/nuit</span>
          <span class="rating">★{{ accommodation().rating }}/5</span>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="badges">
          <mat-chip-set>
            <mat-chip>{{ accommodation().type }}</mat-chip>
            @if (accommodation().trainStationNearby) {
              <mat-chip class="train-chip">
                <mat-icon>train</mat-icon> Gare
              </mat-chip>
            }
          </mat-chip-set>
        </div>
        @if (accommodation().description) {
          <p class="description">{{ accommodation().description }}</p>
        }
      </mat-card-content>

      <mat-card-actions>
        <button mat-button color="primary" (click)="change.emit(accommodation())">
          <mat-icon>edit</mat-icon> Changer
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrl: './accommodation-card.component.scss',
})
export class AccommodationCardComponent {
  accommodation = input.required<Accommodation>();
  change = output<Accommodation>();

  typeIcon = computed(() => {
    const icons: Record<Accommodation['type'], string> = {
      hotel: 'hotel',
      gite: 'home',
      camping: 'camping',
      airbnb: 'apartment',
    };
    return icons[this.accommodation().type] ?? 'hotel';
  });
}