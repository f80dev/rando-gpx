import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItineraryService } from '../../services/itinerary.service';
import { ExportService } from '../../services/export.service';

export type ExportFormat = 'gpx' | 'text' | 'share';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Exporter le programme</h2>

    <mat-dialog-content>
      <div class="export-options">
        <button mat-stroked-button class="export-option" (click)="exportGpx()">
          <mat-icon>map</mat-icon>
          <div class="option-text">
            <strong>Fichier GPX</strong>
            <span>Trace GPS complète</span>
          </div>
        </button>

        <button mat-stroked-button class="export-option" (click)="exportText()">
          <mat-icon>description</mat-icon>
          <div class="option-text">
            <strong>Résumé texte</strong>
            <span>Programme détaillé</span>
          </div>
        </button>

        <button mat-stroked-button class="export-option" (click)="generateShareLink()">
          <mat-icon>share</mat-icon>
          <div class="option-text">
            <strong>Lien de partage</strong>
            <span>Copier le lien</span>
          </div>
        </button>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onClose()">Fermer</button>
    </mat-dialog-actions>
  `,
  styleUrl: './export.dialog.scss',
})
export class ExportDialogComponent {
  private dialogRef = inject(MatDialogRef<ExportDialogComponent>);
  private itineraryService = inject(ItineraryService);
  private exportService = inject(ExportService);
  private snackBar = inject(MatSnackBar);

  exportGpx(): void {
    const stages = this.itineraryService.stages();
    const name = `rando-${Date.now()}`;
    const gpxContent = this.exportService.generateGpx(stages, name);
    this.exportService.downloadGpx(gpxContent, name);
    this.snackBar.open('Fichier GPX téléchargé !', 'Fermer', { duration: 3000 });
    this.onClose();
  }

  exportText(): void {
    const stages = this.itineraryService.stages();
    const accommodations = this.itineraryService.accommodations();
    const meals = this.itineraryService.meals();
    const preferences = this.itineraryService.preferences();
    const summary = this.exportService.generateTextSummary(
      stages,
      accommodations,
      meals,
      preferences
    );
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rando-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.snackBar.open('Résumé téléchargé !', 'Fermer', { duration: 3000 });
    this.onClose();
  }

  generateShareLink(): void {
    const stages = this.itineraryService.stages();
    const accommodations = this.itineraryService.accommodations();
    const meals = this.itineraryService.meals();
    const preferences = this.itineraryService.preferences();
    const url = this.exportService.generateShareUrl(stages, accommodations, meals, preferences);
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Lien copié dans le presse-papiers !', 'Fermer', {
        duration: 3000,
      });
    });
    this.onClose();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}