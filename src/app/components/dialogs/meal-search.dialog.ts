import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Meal, MealSlot } from '../../models/itinerary.model';

export interface MealSearchData {
  stageId: string;
  slot: MealSlot;
  currentMeal?: Meal | null;
}

// Mock data pour le MVP
const MOCK_MEALS: Meal[] = [
  { id: 'm1', stageId: '', slot: 'lunch', name: 'Le Petit Bistro', price: 18, coordinates: [0, 0], type: 'bistro', description: 'Cuisine traditionnelle française' },
  { id: 'm2', stageId: '', slot: 'lunch', name: 'Sandwicherie du Marché', price: 12, coordinates: [0, 0], type: 'picnic', description: 'Sandwichs faits maison' },
  { id: 'm3', stageId: '', slot: 'lunch', name: 'La Pergola', price: 22, coordinates: [0, 0], type: 'restaurant', description: 'Plats généreux' },
  { id: 'm4', stageId: '', slot: 'dinner', name: 'Le Gourmet', price: 28, coordinates: [0, 0], type: 'restaurant', description: 'Restaurant gastronomique' },
  { id: 'm5', stageId: '', slot: 'dinner', name: 'Auberge du Cheval Blanc', price: 20, coordinates: [0, 0], type: 'restaurant', description: 'Cuisine du terroir' },
  { id: 'm6', stageId: '', slot: 'dinner', name: 'Pique-nique en route', price: 8, coordinates: [0, 0], type: 'picnic', description: 'Panier repas' },
];

@Component({
  selector: 'app-meal-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.slot === 'lunch' ? 'Déjeuner' : 'Dîner' }} — Rechercher
    </h2>

    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Rechercher un repas</mat-label>
        <input matInput [(ngModel)]="searchQuery" (ngModelChange)="filterMeals()" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-selection-list (selectionChange)="onSelect($event)">
        @for (meal of filteredMeals; track meal.id) {
          <mat-list-option [selected]="selectedId === meal.id" [value]="meal">
            <div class="meal-option">
              <div class="meal-info">
                <strong>{{ meal.name }}</strong>
                <span class="meal-type">{{ meal.type }}</span>
              </div>
              <div class="meal-meta">
                <span class="meal-price">{{ meal.price }}€</span>
              </div>
            </div>
          </mat-list-option>
        }
      </mat-selection-list>

      @if (filteredMeals.length === 0) {
        <p class="no-results">Aucun repas trouvé</p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" [disabled]="!selectedMeal" (click)="onConfirm()">
        Valider
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './meal-search.dialog.scss',
})
export class MealSearchDialogComponent {
  data = inject<MealSearchData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<MealSearchDialogComponent>);

  searchQuery = '';
  filteredMeals: Meal[] = [...MOCK_MEALS];
  selectedMeal: Meal | null = null;
  selectedId = '';

  filterMeals(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredMeals = MOCK_MEALS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }

  onSelect(event: any): void {
    const selected = event.options?.[0]?.value as Meal;
    if (selected) {
      this.selectedMeal = { ...selected, stageId: this.data.stageId, slot: this.data.slot };
      this.selectedId = selected.id;
    }
  }

  onConfirm(): void {
    if (this.selectedMeal) {
      this.dialogRef.close(this.selectedMeal);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}