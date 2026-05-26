import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ItineraryService } from '../../services/itinerary.service';
import { HermesAgentService } from '../../services/hermes-agent.service';
import { GpxMapComponent } from '../gpx-map/gpx-map.component';

type GenerationStatus =
  | 'idle'
  | 'parsing'
  | 'generating'
  | 'success'
  | 'error';

@Component({
  selector: 'app-step-generation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    GpxMapComponent,
  ],
  templateUrl: './step-generation.component.html',
  styleUrl: './step-generation.component.scss',
})
export class StepGenerationComponent implements OnInit, OnDestroy {
  readonly itineraryService = inject(ItineraryService);
  private hermesAgent = inject(HermesAgentService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  status = signal<GenerationStatus>('idle');
  errorMessage = signal<string | null>(null);
  progressSteps = signal<string[]>([]);
  visibleProgressSteps = signal<number>(0);

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private subscription: Subscription | null = null;

  readonly generationScript = [
    'Analyse de la trace GPX…',
    'Calcul des distances et dénivelés…',
    'Découpage en étapes…',
    'Identification des points d\'intérêt…',
    'Optimisation des parcours…',
    'Génération des suggestions…',
  ];

  ngOnInit(): void {
    const gpxData = this.itineraryService.gpxData();
    if (!gpxData) {
      this.snackBar.open('Aucune trace GPX chargée', 'Retour', {
        duration: 4000,
      });
      this.router.navigate(['/create/step/1']);
      return;
    }
    this.startGeneration();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  private startGeneration(): void {
    this.status.set('parsing');
    this.progressSteps.set([]);
    this.visibleProgressSteps.set(0);
    this.errorMessage.set(null);

    // Animer les étapes du script
    this.progressInterval = setInterval(() => {
      if (this.visibleProgressSteps() < this.generationScript.length) {
        this.progressSteps.update((steps) => [
          ...steps,
          this.generationScript[this.visibleProgressSteps()],
        ]);
        this.visibleProgressSteps.update((n) => n + 1);
      }
    }, 600);

    const prefs = this.itineraryService.preferences();
    const gpxData = this.itineraryService.gpxData()!;

    this.subscription = this.hermesAgent
      .generateItinerary(gpxData, prefs)
      .subscribe({
        next: (stages) => {
          if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
          }
          this.status.set('success');
          this.itineraryService.setStages(stages);
          this.itineraryService.saveToLocalStorage();

          setTimeout(() => {
            this.snackBar.open('Programme prêt !', 'Voir les étapes', {
              duration: 4000,
            });
            this.router.navigate(['/create/step/3']);
          }, 1500);
        },
        error: (err) => {
          if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
          }
          this.status.set('error');
          this.errorMessage.set(
            err.message ?? 'Une erreur est survenue lors de la génération'
          );
        },
      });
  }

  retry(): void {
    this.startGeneration();
  }

  goBack(): void {
    this.router.navigate(['/create/step/1']);
  }
}