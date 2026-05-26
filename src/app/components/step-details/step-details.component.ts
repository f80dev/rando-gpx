import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { ItineraryService } from '../../services/itinerary.service';
import { HermesAgentService } from '../../services/hermes-agent.service';
import { GpxMapComponent } from '../gpx-map/gpx-map.component';
import { AccommodationCardComponent } from '../accommodation-card/accommodation-card.component';
import { MealSlotComponent } from '../meal-slot/meal-slot.component';
import { ItinerarySummaryComponent } from '../itinerary-summary/itinerary-summary.component';
import { ExportDialogComponent } from '../dialogs/export.dialog';
import { MealSearchDialogComponent } from '../dialogs/meal-search.dialog';
import { Accommodation, Meal } from '../../models/itinerary.model';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTabsModule,
    GpxMapComponent,
    AccommodationCardComponent,
    MealSlotComponent,
    ItinerarySummaryComponent,
  ],
  templateUrl: './step-details.component.html',
  styleUrl: './step-details.component.scss',
})
export class StepDetailsComponent implements OnInit, OnDestroy {
  private _itineraryService = inject(ItineraryService);
  protected readonly itineraryService = this._itineraryService;
  private hermesAgent = inject(HermesAgentService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly stages = this.itineraryService.stages;
  readonly accommodations = this.itineraryService.accommodations;
  readonly meals = this.itineraryService.meals;
  readonly preferences = this.itineraryService.preferences;

  isLoading = signal(false);
  private subscription: Subscription | null = null;

  ngOnInit(): void {
    if (this.stages().length === 0) {
      this.router.navigate(['/create/step/3']);
      return;
    }
    this.loadAccommodationsAndMeals();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadAccommodationsAndMeals(): void {
    this.isLoading.set(true);
    const stages = this.stages();
    const prefs = this.preferences();

    this.subscription = this.hermesAgent
      .fillAccommodationsAndMeals(stages, prefs)
      .subscribe({
        next: ({ accommodations, meals }) => {
          this.itineraryService.setAccommodations(accommodations);
          this.itineraryService.setMeals(meals);
          this.isLoading.set(false);
          this.snackBar.open('Hébergements et repas générés !', 'Fermer', {
            duration: 3000,
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(
            `Erreur : ${err.message ?? 'Impossible de générer les suggestions'}`,
            'Fermer',
            { duration: 5000 }
          );
        },
      });
  }

  getAccommodationForStage(stageId: string): Accommodation | undefined {
    return this.accommodations().find((a) => a.stageId === stageId);
  }

  getMealsForStage(stageId: string): { lunch: Meal | null; dinner: Meal | null } {
    const stageMeals = this.meals().filter((m) => m.stageId === stageId);
    return {
      lunch: stageMeals.find((m) => m.slot === 'lunch') ?? null,
      dinner: stageMeals.find((m) => m.slot === 'dinner') ?? null,
    };
  }

  onChangeAccommodation(accommodation: Accommodation): void {
    this.snackBar.open(
      `Changer l'hébergement pour "${accommodation.name}" — à implémenter`,
      'Fermer',
      { duration: 3000 }
    );
  }

  onChangeMeal(meal: Meal | null, stageId: string, slot: 'lunch' | 'dinner'): void {
    const dialogRef = this.dialog.open(MealSearchDialogComponent, {
      width: '480px',
      data: { stageId, slot },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.itineraryService.updateMeal(result.id, result);
      }
    });
  }

  openExportDialog(): void {
    this.dialog.open(ExportDialogComponent, {
      width: '400px',
      data: {},
    });
  }

  goBack(): void {
    this.router.navigate(['/create/step/3']);
  }
}