import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ApplicationInitStatus } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { firstValueFrom } from 'rxjs';

// ─── Config loader ──────────────────────────────────────────────────────────

let API_BASE_URL = 'http://localhost:5000'; // fallback dev

function loadConfig(http: HttpClient) {
  return () =>
    firstValueFrom(
      http.get<{ randoApiUrl?: string }>('/config.json').pipe()
    ).then((cfg) => {
      if (cfg?.randoApiUrl) API_BASE_URL = cfg.randoApiUrl;
      // Expose globally so services can read it without importing this module
      (window as any).__API_BASE_URL__ = API_BASE_URL;
    }).catch(() => {
      // Fallback: use current hostname
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      API_BASE_URL = `http://${host}:5000`;
      (window as any).__API_BASE_URL__ = API_BASE_URL;
    });
}

export function getApiBaseUrl(): string {
  return (window as any).__API_BASE_URL__ ?? API_BASE_URL;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      deps: [HttpClient],
      multi: true,
    },
  ],
};