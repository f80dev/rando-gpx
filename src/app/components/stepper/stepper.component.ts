import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ItineraryService } from '../../services/itinerary.service';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule,
  ],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent implements OnInit {
  private itineraryService = inject(ItineraryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.itineraryService.loadFromLocalStorage();
  }

  readonly steps = [
    { label: 'Préférences', icon: 'settings' },
    { label: 'Génération', icon: 'auto_awesome' },
    { label: 'Revue', icon: 'edit_note' },
    { label: 'Détails', icon: 'hotel' },
  ];

  currentStepIndex = computed(() => {
    const url = this.router.url;
    const match = url.match(/\/step\/(\d)/);
    return match ? parseInt(match[1], 10) - 1 : 0;
  });

  isStepAccessible(index: number): boolean {
    const current = this.currentStepIndex();
    // Step 1 toujours accessible
    if (index === 0) return true;
    // Les autres accessibles seulement après completion de la précédente
    // Pour l'instant, accès libre (la génération checkera les données)
    return true;
  }

  goToStep(index: number): void {
    if (this.isStepAccessible(index)) {
      this.router.navigate(['/create/step', index + 1]);
    }
  }

  nextStep(): void {
    const next = this.currentStepIndex() + 1;
    if (next < this.steps.length) {
      this.router.navigate(['/create/step', next + 1]);
    }
  }

  prevStep(): void {
    const prev = this.currentStepIndex() - 1;
    if (prev >= 0) {
      this.router.navigate(['/create/step', prev + 1]);
    }
  }

  resetItinerary(): void {
    this.itineraryService.reset();
    this.router.navigate(['/create/step/1']);
  }
}
