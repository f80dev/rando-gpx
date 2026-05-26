import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ItineraryService } from '../../services/itinerary.service';
import { HermesAgentService } from '../../services/hermes-agent.service';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import { environment } from '../../../environments/environment';
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
    MatProgressSpinnerModule,
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
  readonly calendarService = inject(GoogleCalendarService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly stages = this.itineraryService.stages;
  readonly accommodations = this.itineraryService.accommodations;
  readonly meals = this.itineraryService.meals;
  readonly preferences = this.itineraryService.preferences;

  isLoading = signal(false);
  isCalendarExporting = signal(false);
  private subscription: Subscription | null = null;

  ngOnInit(): void {
    this.calendarService.init(environment.googleClientId, environment.googleCalendarApiKey);
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
    const stage = this.stages().find((s) => s.id === stageId);
    const stageCoords = stage?.endPoint;
    const acc = this.getAccommodationForStage(stageId);
    // Use accommodation coords if available, else stage coords, else default
    const center = acc?.coordinates
      ? { lat: acc.coordinates[1], lng: acc.coordinates[0] }
      : stageCoords
        ? { lat: stageCoords[1], lng: stageCoords[0] }
        : { lat: 46.6, lng: 2.5 }; // fallback France center

    const dialogRef = this.dialog.open(MealSearchDialogComponent, {
      width: '480px',
      data: { stageId, slot, center },
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

  async onGoogleAuth(): Promise<void> {
    if (this.calendarService.isAuthenticated()) {
      this.calendarService.signOut();
      this.snackBar.open('Déconnecté de Google Calendar', 'Fermer', { duration: 3000 });
    } else {
      const success = await this.calendarService.signIn();
      if (success) {
        this.snackBar.open('Connecté à Google Calendar !', 'Fermer', { duration: 3000 });
      } else {
        this.snackBar.open('Échec de la connexion Google', 'Fermer', { duration: 5000 });
      }
    }
  }

  async onExportToCalendar(): Promise<void> {
    if (!this.calendarService.isAuthenticated()) {
      const success = await this.calendarService.signIn();
      if (!success) return;
    }

    this.isCalendarExporting.set(true);
    const stages = this.stages();
    const prefs = this.preferences();
    const startDate = prefs.startDate ?? new Date().toISOString().split('T')[0];
    const numDays = prefs.numberOfDays ?? stages.length;
    const endDate = new Date(
      new Date(startDate).getTime() + (numDays - 1) * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .split('T')[0];

    // Enrich stages with date and accommodation info
    const enrichedStages = stages.map((s, i) => {
      const stageDate = new Date(
        new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0];
      const acc = this.getAccommodationForStage(s.id);
      const meals = this.getMealsForStage(s.id);
      return {
        id: s.id,
        name: s.name,
        date: stageDate,
        distance: s.distance,
        elevation: s.elevationGain,
        accommodation: acc
          ? { name: acc.name, address: acc.address ?? '' }
          : undefined,
        lunch: meals.lunch
          ? { name: meals.lunch.name, address: meals.lunch.description ?? '' }
          : undefined,
        dinner: meals.dinner
          ? { name: meals.dinner.name, address: meals.dinner.description ?? '' }
          : undefined,
      };
    });

    const result = await this.calendarService.createItineraryEvent({
      name: `Rando ${prefs.activityType ?? 'vélo'} — ${stages.length} jours`,
      startDate,
      endDate,
      stages: enrichedStages,
    });

    this.isCalendarExporting.set(false);

    if (result.status === 'success') {
      this.snackBar.open(
        `✓ Calendrier exporté ! ${result.htmlLink ? 'Ouvrir ?' : ''}`,
        result.htmlLink ? 'Ouvrir' : 'Fermer',
        { duration: 6000 }
      ).onAction().subscribe(() => {
        if (result.htmlLink) window.open(result.htmlLink, '_blank');
      });
    } else {
      this.snackBar.open(`Erreur: ${result.message}`, 'Fermer', { duration: 5000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/create/step/3']);
  }
}