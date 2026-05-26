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

export interface PlaceSearchData {
  stageId: string;
  center: { lat: number; lng: number };
  stageName: string;
  slot: 'lunch' | 'dinner' | 'accommodation' | 'search';
}

export interface PlaceSearchResult {
  place: PlaceResult;
  action: 'select' | 'cancel';
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
    // Auto-search restaurants à proximité de laville
    this.doSearch();
  }

  doSearch(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.results = [];
    this.selectedPlace.set(null);

    const type = this.selectedType === 'all' ? undefined : this.selectedType;
    const radiusM = this.radiusKm * 1000;

    this.placesService.textSearch(
      `${this.searchQuery || 'restaurant吃什么'} near ${this.data.center.lat},${this.data.center.lng}`,
      this.data.center
    ).subscribe({
      next: (places) => {
        this.results = places.filter((p) => p.rating > 0 || p.priceLevel >= 0);
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

  onSelect(place: PlaceResult): void {
    this.selectedPlace.set(place);
  }

  onConfirm(): void {
    const place = this.selectedPlace();
    if (place) {
      this.dialogRef.close({ place, action: 'select' });
    }
  }

  onCancel(): void {
    this.dialogRef.close({ place: this.data as any, action: 'cancel' });
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
}
