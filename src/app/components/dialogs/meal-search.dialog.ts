import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Meal, MealSlot } from '../../models/itinerary.model';
import { PlacesService, TextSearchResult } from '../../services/places.service';
import { environment } from '../../../environments/environment';

export interface MealSearchData {
  stageId: string;
  slot: MealSlot;
  center: { lat: number; lng: number };
  currentMeal?: Meal | null;
}

// Mock data — fallback quand pas de clé API
const MOCK_MEALS: Meal[] = [
  { id: 'm1', stageId: '', slot: 'lunch', name: 'Le Petit Bistro', price: 18, coordinates: [0, 0], type: 'bistro', description: 'Cuisine traditionnelle française' },
  { id: 'm2', stageId: '', slot: 'lunch', name: 'Sandwicherie du Marché', price: 12, coordinates: [0, 0], type: 'picnic', description: 'Sandwichs maison' },
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
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  templateUrl: './meal-search.dialog.html',
  styleUrl: './meal-search.dialog.scss',
})
export class MealSearchDialogComponent {
  data = inject<MealSearchData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<MealSearchDialogComponent>);
  private placesService = inject(PlacesService);

  readonly hasApiKey = environment.googlePlacesApiKey !== 'YOUR_GOOGLE_PLACES_API_KEY';

  searchQuery = '';
  filteredMeals: Meal[] = [...MOCK_MEALS];
  selectedMeal: Meal | null = null;
  selectedId = '';

  googleResults: TextSearchResult[] = [];
  isGoogleLoading = signal(false);
  googleError = signal<string | null>(null);

  filterMeals(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredMeals = MOCK_MEALS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }

  onLocalSelect(meal: Meal): void {
    this.selectedMeal = { ...meal, stageId: this.data.stageId, slot: this.data.slot };
    this.selectedId = meal.id;
  }

  doGoogleSearch(query: string = this.searchQuery): void {
    this.isGoogleLoading.set(true);
    this.googleError.set(null);
    this.googleResults = [];

    const slotLabel = this.data.slot === 'lunch' ? 'restaurant' : 'restaurant dîner';
    const searchQueryStr = query
      ? `${query} ${slotLabel} near ${this.data.center.lat},${this.data.center.lng}`
      : `${slotLabel} near ${this.data.center.lat},${this.data.center.lng}`;

    this.placesService.textSearch(searchQueryStr, this.data.center).subscribe({
      next: (places) => {
        this.googleResults = places.filter((p) => p.rating > 0);
        this.isGoogleLoading.set(false);
      },
      error: (err) => {
        this.isGoogleLoading.set(false);
        const msg = err?.error?.error?.message ?? err?.message ?? 'Erreur';
        if (msg.includes('invalid') || msg.includes('INVALID_ARGUMENT')) {
          this.googleError.set('API Google Places non configurée ou inactive.');
        } else {
          this.googleError.set(msg);
        }
      },
    });
  }

  selectGoogleResult(place: TextSearchResult): void {
    const meal: Meal = {
      id: `gp-${place.placeId}`,
      stageId: this.data.stageId,
      slot: this.data.slot,
      name: place.name,
      price: place.priceLevel >= 0 ? (place.priceLevel + 1) * 10 : 0,
      coordinates: [place.location.lng, place.location.lat],
      type: 'restaurant',
      description: place.address,
    };
    this.selectedMeal = meal;
    this.selectedId = meal.id;
  }

  onConfirm(): void {
    if (this.selectedMeal) {
      this.dialogRef.close(this.selectedMeal);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  formatPrice(level: number): string {
    if (level < 0) return '—';
    return '€'.repeat(level + 1);
  }
}
