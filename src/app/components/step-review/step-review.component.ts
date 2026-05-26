import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItineraryService } from '../../services/itinerary.service';
import { GpxMapComponent } from '../gpx-map/gpx-map.component';
import { StageCardComponent } from '../stage-card/stage-card.component';
import { ItinerarySummaryComponent } from '../itinerary-summary/itinerary-summary.component';
import { Stage } from '../../models/itinerary.model';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    GpxMapComponent,
    StageCardComponent,
    ItinerarySummaryComponent,
  ],
  templateUrl: './step-review.component.html',
  styleUrl: './step-review.component.scss',
})
export class StepReviewComponent {
  private _itineraryService = inject(ItineraryService);
  protected readonly itineraryService = this._itineraryService;
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly stages = this.itineraryService.stages;
  readonly preferences = this.itineraryService.preferences;
  readonly allPois = computed(() =>
    this.stages().flatMap((s) => s.pois)
  );

  selectedStageForMap = signal<Stage | null>(null);

  onEditStage(stage: Stage): void {
    this.snackBar.open(`Édition de "${stage.name}" — à implémenter avec StageEditDialog`, 'Fermer', {
      duration: 3000,
    });
  }

  onToggleDisabled(stageId: string): void {
    this.itineraryService.toggleStageDisabled(stageId);
    this.itineraryService.saveToLocalStorage();
  }

  onViewOnMap(stage: Stage): void {
    this.selectedStageForMap.set(stage);
  }

  goToDetails(): void {
    this.itineraryService.setCurrentStep(4);
    this.router.navigate(['/create/step/4']);
  }

  goBack(): void {
    this.router.navigate(['/create/step/2']);
  }
}