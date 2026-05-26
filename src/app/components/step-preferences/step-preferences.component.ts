import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItineraryService } from '../../services/itinerary.service';
import { GpxParserService } from '../../services/gpx-parser.service';
import { CommunesService, TraceCommune } from '../../services/communes.service';
import { GpxMapComponent } from '../gpx-map/gpx-map.component';
import { FileDropZoneComponent } from '../file-drop-zone/file-drop-zone.component';
import { GpxData, ActivityType } from '../../models/itinerary.model';

@Component({
  selector: 'app-step-preferences',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    GpxMapComponent,
    FileDropZoneComponent,
  ],
  templateUrl: './step-preferences.component.html',
  styleUrl: './step-preferences.component.scss',
})
export class StepPreferencesComponent implements OnInit {
  private itineraryService = inject(ItineraryService);
  private gpxParser = inject(GpxParserService);
  private communesService = inject(CommunesService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  gpxData = signal<GpxData | null>(null);
  isLoadingGpx = signal(false);
  communes = signal<TraceCommune[]>([]);
  isLoadingCommunes = signal(false);
  apiConnected = signal<boolean | null>(null); // null = pas encore testé

  readonly minDate = new Date();

  constructor() {
    const prefs = this.itineraryService.preferences();
    this.form = this.fb.group({
      activityType: [prefs.activityType ?? 'bike'],
      maxDistancePerDay: [prefs.maxDistancePerDay ?? 80],
      maxElevationPerDay: [prefs.maxElevationPerDay ?? 800],
      departureTime: [prefs.departureTime ?? '08:00'],
      maxAccommodationPrice: [prefs.maxAccommodationPrice ?? 90],
      maxMealPrice: [prefs.maxMealPrice ?? 25],
      needTrainOnStartEnd: [prefs.needTrainOnStartEnd ?? false],
      homeCity: [prefs.homeCity ?? ''],
      startDate: [prefs.startDate ? new Date(prefs.startDate) : null],
      numberOfDays: [prefs.numberOfDays ?? 7],
    });
  }

  ngOnInit(): void {
    // Test de connexion API au chargement de la page
    this.communesService.ping().subscribe({
      next: () => this.apiConnected.set(true),
      error: () => this.apiConnected.set(false),
    });
  }

  onGpxFileSelected(file: File): void {
    this.isLoadingGpx.set(true);
    this.communes.set([]);
    this.gpxParser.parseGpx(file).subscribe({
      next: (data) => {
        this.gpxData.set(data);
        this.isLoadingGpx.set(false);
        this.itineraryService.setGpxData(data);

        // Appeler l'API communes en parallèle
        this.isLoadingCommunes.set(true);
        console.log('[DEBUG] Envoi GPX à:', this.communesService.getApiUrl() + '/api/trace/communes');
        this.communesService.getCommunes(file).subscribe({
          next: (resp) => {
            this.communes.set(resp.communes);
            this.isLoadingCommunes.set(false);
          },
          error: (err) => {
            this.isLoadingCommunes.set(false);
            const msg = err.error?.error ?? err.message ?? 'Erreur inconnue';
            console.warn('Communes API error:', err.status, msg);
          },
        });
      },
      error: (err) => {
        this.isLoadingGpx.set(false);
        this.snackBar.open(
          `Erreur GPX : ${err.message ?? 'Fichier invalide'}`,
          'Fermer',
          { duration: 5000 }
        );
      },
    });
  }

  onGpxError(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }

  clearGpx(): void {
    this.gpxData.set(null);
    this.communes.set([]);
    this.itineraryService.setGpxData(null);
  }

  onSubmit(): void {
    const formValue = this.form.value;
    this.itineraryService.setPreferences({
      activityType: formValue.activityType as ActivityType,
      maxDistancePerDay: Number(formValue.maxDistancePerDay),
      maxElevationPerDay: Number(formValue.maxElevationPerDay),
      departureTime: formValue.departureTime,
      maxAccommodationPrice: Number(formValue.maxAccommodationPrice),
      maxMealPrice: Number(formValue.maxMealPrice),
      needTrainOnStartEnd: formValue.needTrainOnStartEnd,
      homeCity: formValue.homeCity || undefined,
      startDate: formValue.startDate
        ? new Date(formValue.startDate).toISOString().split('T')[0]
        : undefined,
      numberOfDays: Number(formValue.numberOfDays),
    });
    this.itineraryService.saveToLocalStorage();

    if (!this.gpxData()) {
      this.snackBar.open('Veuillez importer un fichier GPX', 'Fermer', {
        duration: 3000,
      });
      return;
    }

    this.itineraryService.setCurrentStep(2);
    this.router.navigate(['/create/step/2']);
  }
}
