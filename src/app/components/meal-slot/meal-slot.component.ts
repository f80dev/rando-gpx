import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Meal, MealSlot } from '../../models/itinerary.model';

@Component({
  selector: 'app-meal-slot',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  template: `
    <mat-card class="meal-card">
      <div class="slot-header">
        <mat-icon class="slot-icon">{{ slotIcon() }}</mat-icon>
        <span class="slot-label">{{ slotLabel() }}</span>
      </div>

      @if (meal()) {
        <div class="meal-info">
          <mat-chip-set>
            <mat-chip>{{ meal()!.type }}</mat-chip>
          </mat-chip-set>
          <p class="meal-name">{{ meal()!.name }}</p>
          <p class="meal-price">{{ meal()!.price }}€</p>
          @if (meal()!.description) {
            <p class="meal-desc">{{ meal()!.description }}</p>
          }
        </div>
      } @else {
        <div class="empty-state">
          <p>Aucun repas suggéré</p>
        </div>
      }

      <button mat-stroked-button (click)="change.emit(meal() ?? null)">
        <mat-icon>edit</mat-icon>
        {{ meal() ? 'Changer' : 'Ajouter' }}
      </button>
    </mat-card>
  `,
  styleUrl: './meal-slot.component.scss',
})
export class MealSlotComponent {
  meal = input<Meal | null>(null);
  slot = input<MealSlot>('lunch');
  change = output<Meal | null>();

  slotLabel = computed(() => this.slot() === 'lunch' ? 'Déjeuner' : 'Dîner');

  slotIcon = computed(() =>
    this.slot() === 'lunch' ? 'restaurant' : 'set_meal'
  );
}