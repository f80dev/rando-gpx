import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { PlacesService, PlaceResult, PlaceType } from '../../services/places.service';
import { Meal, Accommodation, MealSlot } from '../../models/itinerary.model';

export interface PlaceSearchData {
  stageId: string;
  center: { lat: number; lng: number };
  stageName: string;
  slot: MealSlot | 'accommodation';
}

export interface PlaceSearchResult {
  action: 'select' | 'cancel';
  place: PlaceResult | null;
  meal?: Meal;
  accommodation?: Accommodation;
}

@Component({
  selector: 'app-places-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSliderModule,
  ],
  templateUrl: './places-search.dialog.html',
  styleUrl: './places-search.dialog.scss',
})
export class PlacesSearchDialogComponent implements OnInit {
  data = inject<PlaceSearchData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PlacesSearchDialogComponent, PlaceSearchResult>);
  private placesService = inject(PlacesService);

  readonly placeTypes: { value: PlaceType | 'all'; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'restaurant', label: 'Restaurants' },
    { value: 'cafe', label: 'Cafés' },
    { value: 'bakery', label: 'Boulangeries' },
    { value: 'bar', label: 'Bars' },
    { value: 'hotel', label: 'Hôtels' },
    { value: 'lodging', label: 'Hébergements' },
  ];

  searchQuery = '';
  selectedType: PlaceType | 'all' = 'all';
  radiusKm = 5;
  results: any[] = [];
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedPlace = signal<PlaceResult | null>(null);

  ngOnInit(): void {
    this.doSearch();
  }

  doSearch(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.results = [];
    this.selectedPlace.set(null);

    const slotQueryPrefix = this.getSlotQueryPrefix();
    const query = `${slotQueryPrefix}${this.searchQuery ? ' ' + this.searchQuery : ''} near ${this.data.center.lat},${this.data.center.lng}`;

    this.placesService.textSearch(query, this.data.center).subscribe({
      next: (places) => {
        const filtered = this.selectedType === 'all'
          ? places
          : places.filter((p) => {
              const types: string[] = (p as any)['types'] ?? [];
              return types.includes(this.selectedType);
            });
        this.results = [...filtered]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, 20);
        this.isLoading.set(false);
        if (this.results.length === 0) {
          this.error.set('Aucun résultat. Essayez un rayon plus large ou un autre type.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.error?.message ?? err?.message ?? 'Erreur Unknown';
        if (msg.includes('INVALID_ARGUMENT') || msg.includes('invalid')) {
          this.error.set('API Google Places non configurée. Ajoutez une clé valide dans environment.ts');
        } else {
          this.error.set(`Erreur: ${msg}`);
        }
      },
    });
  }

  private getSlotQueryPrefix(): string {
    switch (this.data.slot) {
      case 'lunch': return 'restaurant déjeuner';
      case 'dinner': return 'restaurant dîner';
      case 'accommodation': return 'hôtel gîte chambre';
      default: return '';
    }
  }

  onSelect(place: PlaceResult): void {
    this.selectedPlace.set(place);
  }

  onConfirm(): void {
    const place = this.selectedPlace();
    if (!place) {
      this.dialogRef.close({ action: 'cancel', place: null });
      return;
    }

    if (this.data.slot === 'accommodation') {
      const accommodation: Accommodation = {
        id: `gp-acc-${place.placeId}`,
        stageId: this.data.stageId,
        name: place.name,
        pricePerNight: place.priceLevel >= 0 ? (place.priceLevel + 1) * 25 : 0,
        coordinates: [place.location.lng, place.location.lat],
        address: place.address,
        rating: place.rating,
        type: this.inferAccommodationType(place.types),
        trainStationNearby: false,
        description: `${place.rating > 0 ? '★ ' + place.rating : ''} ${place.address ?? ''}`.trim(),
      };
      this.dialogRef.close({ action: 'select', place, accommodation });
    } else {
      const meal: Meal = {
        id: `gp-meal-${place.placeId}`,
        stageId: this.data.stageId,
        slot: this.data.slot as MealSlot,
        name: place.name,
        price: place.priceLevel >= 0 ? (place.priceLevel + 1) * 12 : 0,
        coordinates: [place.location.lng, place.location.lat],
        type: this.inferMealType(place.types),
        description: `${place.rating > 0 ? '★ ' + place.rating + ' · ' : ''}${place.address ?? ''}`.trim(),
      };
      this.dialogRef.close({ action: 'select', place, meal });
    }
  }

  private inferAccommodationType(types: string[]): Accommodation['type'] {
    if (types.includes('hotel')) return 'hotel';
    if (types.includes('lodging')) return 'gite';
    if (types.includes('campground')) return 'camping';
    return 'hotel';
  }

  private inferMealType(types: string[]): Meal['type'] {
    if (types.includes('bakery')) return 'picnic';
    if (types.includes('cafe') || types.includes('bar')) return 'bistro';
    return 'restaurant';
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancel', place: null });
  }

  formatPriceLevel(level: number): string {
    if (level < 0) return '—';
    return '€'.repeat(level + 1);
  }

  getTypeIcon(types: string[]): string {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('cafe')) return 'local_cafe';
    if (types.includes('bakery')) return 'bakery_dining';
    if (types.includes('bar')) return 'local_bar';
    if (types.includes('hotel') || types.includes('lodging')) return 'hotel';
    return 'place';
  }

  getSlotLabel(): string {
    switch (this.data.slot) {
      case 'lunch': return 'Déjeuner';
      case 'dinner': return 'Dîner';
      case 'accommodation': return 'Hébergement';
      default: return 'Lieu';
    }
  }
}