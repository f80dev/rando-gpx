import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'create',
    pathMatch: 'full',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./components/stepper/stepper.component').then(
        (m) => m.StepperComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'step/1',
        pathMatch: 'full',
      },
      {
        path: 'step/1',
        loadComponent: () =>
          import('./components/step-preferences/step-preferences.component').then(
            (m) => m.StepPreferencesComponent
          ),
      },
      {
        path: 'step/2',
        loadComponent: () =>
          import('./components/step-generation/step-generation.component').then(
            (m) => m.StepGenerationComponent
          ),
      },
      {
        path: 'step/3',
        loadComponent: () =>
          import('./components/step-review/step-review.component').then(
            (m) => m.StepReviewComponent
          ),
      },
      {
        path: 'step/4',
        loadComponent: () =>
          import('./components/step-details/step-details.component').then(
            (m) => m.StepDetailsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'create',
  },
];
