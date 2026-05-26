import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Stage, POI } from '../../models/itinerary.model';

export interface StageEditData {
  stage: Stage;
}

export interface StageEditResult {
  name: string;
  maxDistance: number;
  selectedPoiIds: string[];
  action: 'save' | 'merge_next' | 'split' | 'cancel';
}

@Component({
  selector: 'app-stage-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Modifier l'étape</h2>

    <mat-dialog-content>
      <!-- Nom -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nom de l'étape</mat-label>
        <input matInput [(ngModel)]="name" />
      </mat-form-field>

      <!-- Distance max -->
      <div class="form-section">
        <label>
          Distance max acceptable : {{ maxDistance }} km
        </label>
        <mat-slider min="10" max="200" step="5" class="full-width">
          <input matSliderThumb [(ngModel)]="maxDistance" />
        </mat-slider>
      </div>

      <!-- POIs -->
      @if (data.stage.pois.length > 0) {
        <div class="form-section">
          <label class="section-label">Points d'intérêt</label>
          <div class="poi-list">
            @for (poi of data.stage.pois; track poi.name) {
              <div class="poi-item">
                <mat-checkbox [(ngModel)]="selectedPois[poi.name]">
                  <mat-icon class="poi-type-icon">{{ poiTypeIcon(poi.type) }}</mat-icon>
                  {{ poi.name }}
                </mat-checkbox>
              </div>
            }
          </div>
        </div>
      }

      <!-- Actions avancées -->
      <div class="advanced-actions">
        <button mat-stroked-button color="warn" (click)="onMergeNext()">
          <mat-icon>call_merge</mat-icon> Fusionner avec l'étape suivante
        </button>
        <button mat-stroked-button (click)="onSplit()">
          <mat-icon>call_split</mat-icon> Scinder cette étape
        </button>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()">
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './stage-edit.dialog.scss',
})
export class StageEditDialogComponent {
  data = inject<StageEditData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<StageEditDialogComponent>);

  name = this.data.stage.name;
  maxDistance = this.data.stage.distance;

  selectedPois: Record<string, boolean> = {};
  constructor() {
    // Pré-cocher tous les POIs par défaut
    this.data.stage.pois.forEach((p) => (this.selectedPois[p.name] = true));
  }

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

  onSave(): void {
    const selectedPoiNames = Object.entries(this.selectedPois)
      .filter(([, v]) => v)
      .map(([k]) => k);
    this.dialogRef.close({
      name: this.name,
      maxDistance: this.maxDistance,
      selectedPoiIds: selectedPoiNames,
      action: 'save',
    } as StageEditResult);
  }

  onCancel(): void {
    this.dialogRef.close({ name: '', maxDistance: 0, selectedPoiIds: [], action: 'cancel' });
  }

  onMergeNext(): void {
    this.dialogRef.close({ name: '', maxDistance: 0, selectedPoiIds: [], action: 'merge_next' });
  }

  onSplit(): void {
    this.dialogRef.close({ name: '', maxDistance: 0, selectedPoiIds: [], action: 'split' });
  }
}
