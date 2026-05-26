import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

declare const google: any;

export interface CalendarEventInput {
  summary: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm (for single-day events with time)
  endTime?: string;   // HH:mm
}

export interface CalendarExportResult {
  status: 'success' | 'error';
  eventId?: string;
  htmlLink?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  private _isAuthenticated = signal(false);
  private _accessToken = signal<string | null>(null);
  private _userEmail = signal<string | null>(null);

  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly userEmail = computed(() => this._userEmail());

  private clientId = '';
  private calendarApiKey = '';

  constructor(private http: HttpClient) {
    this.loadState();
  }

  /**
   * Initialize Google Identity Services.
   * Call this once in app.config or the component that triggers auth.
   */
  async init(clientId: string, apiKey: string): Promise<void> {
    this.clientId = clientId;
    this.calendarApiKey = apiKey;

    // Load GIS script if not present
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      await new Promise<void>((resolve) => {
        script.onload = () => resolve();
        script.onerror = () => resolve();
      });
    }
  }

  /**
   * Start the OAuth flow — opens Google consent popup.
   * Requires init() to have been called first.
   */
  async signIn(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!document.getElementById('google-signin-client')) {
        console.error('GoogleCalendarService: call init() first');
        resolve(false);
        return;
      }

      const callback = (response: any) => {
        if (response.access_token) {
          this._accessToken.set(response.access_token);
          this._isAuthenticated.set(true);
          this.persistState();
          this.fetchUserEmail(response.access_token).then((email) => {
            this._userEmail.set(email);
          });
          resolve(true);
        } else {
          resolve(false);
        }
      };

      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: callback,
        auto_select: false,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use the one-tap or button flow
          const container = document.createElement('div');
          container.id = 'g_id_signin';
          document.body.appendChild(container);
          google.accounts.id.renderButton(container, {
            theme: 'filled_green',
            text: 'signin_with',
            shape: 'rectangular',
          });
        }
      });
    });
  }

  /**
   * Sign out and clear stored state.
   */
  signOut(): void {
    this._accessToken.set(null);
    this._isAuthenticated.set(false);
    this._userEmail.set(null);
    this.clearState();
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
  }

  /**
   * Create a calendar event for the entire itinerary.
   */
  async createItineraryEvent(itinerary: {
    name: string;
    startDate: string;
    endDate: string;
    stages: Array<{
      name: string;
      date: string;
      distance: number;
      elevation: number;
      accommodation?: { name: string; address: string };
    }>;
  }): Promise<CalendarExportResult> {
    const token = this._accessToken();
    if (!token) {
      return { status: 'error', message: 'Non authentifié' };
    }

    const startDate = itinerary.startDate;
    const endDate = itinerary.endDate;

    // Build description with all stages
    const stageDescriptions = itinerary.stages
      .map(
        (s, i) =>
          `Jour ${i + 1} — ${s.name} (${s.date})\n` +
          `  Distance: ${s.distance} km | Dénivelé: ${s.elevation} m\n` +
          (s.accommodation ? `  Hébergement: ${s.accommodation.name}\n` : '')
      )
      .join('\n');

    const event = {
      summary: `🚴 ${itinerary.name}`,
      description: `${itinerary.name}\n\nProgramme:\n${stageDescriptions}\n\nGénéré par RandoGPX`,
      location: itinerary.stages[0]?.accommodation?.address ?? '',
      start: {
        date: startDate,
      },
      end: {
        date: endDate,
      },
      colorId: '4', // Green
     reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 * 24 },
          { method: 'email', minutes: 60 * 24 * 7 },
        ],
      },
    };

    try {
      const resp: any = await firstValueFrom(
        this.http.post<any>(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${this.calendarApiKey}`,
          event,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
      return {
        status: 'success',
        eventId: resp['id'],
        htmlLink: resp['htmlLink'],
        message: 'Événement créé avec succès !',
      };
    } catch (err: any) {
      const msg = err?.error?.error?.message ?? err?.message ?? 'Erreur inconnue';
      return { status: 'error', message: msg };
    }
  }

  /**
   * Create individual day events for each stage.
   */
  async createStageEvents(
    stages: Array<{
      id: string;
      name: string;
      date: string;
      distance: number;
      elevation: number;
      lunch?: { name: string; address?: string };
      dinner?: { name: string; address?: string };
      accommodation?: { name: string; address: string };
    }>
  ): Promise<{ success: number; failed: number; events: CalendarExportResult[] }> {
    const results: CalendarExportResult[] = [];
    let success = 0;
    let failed = 0;

    for (const stage of stages) {
      // Morning: departure
      const departureEvent = await this.createStageEvent(
        `🚴 ${stage.name} — Départ`,
        `Étapes du jour: ${stage.distance} km, D+ ${stage.elevation} m`,
        stage.date,
        stage.accommodation?.address
      );
      results.push(departureEvent);
      if (departureEvent.status === 'success') success++;
      else failed++;

      // Lunch
      if (stage.lunch) {
        const lunchEvent = await this.createStageEvent(
          `🍽️ Déjeuner — ${stage.lunch.name}`,
          stage.lunch.address ?? '',
          stage.date
        );
        results.push(lunchEvent);
        if (lunchEvent.status === 'success') success++;
        else failed++;
      }

      // Dinner
      if (stage.dinner) {
        const dinnerEvent = await this.createStageEvent(
          `🍽️ Dîner — ${stage.dinner.name}`,
          stage.dinner.address ?? '',
          stage.date
        );
        results.push(dinnerEvent);
        if (dinnerEvent.status === 'success') success++;
        else failed++;
      }

      // Arrival / accommodation
      if (stage.accommodation) {
        const arrivalEvent = await this.createStageEvent(
          `🏨 Arrivée — ${stage.accommodation.name}`,
          `Hébergement: ${stage.accommodation.name}\n${stage.accommodation.address}`,
          stage.date
        );
        results.push(arrivalEvent);
        if (arrivalEvent.status === 'success') success++;
        else failed++;
      }
    }

    return { success, failed, events: results };
  }

  private async createStageEvent(
    summary: string,
    description: string,
    date: string,
    location?: string
  ): Promise<CalendarExportResult> {
    const token = this._accessToken();
    if (!token) return { status: 'error', message: 'Non authentifié' };

    const event = {
      summary,
      description,
      location: location ?? '',
      start: { date },
      end: { date },
      colorId: '4',
    };

    try {
      const resp: any = await firstValueFrom(
        this.http.post<any>(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${this.calendarApiKey}`,
          event,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );
      return { status: 'success', eventId: resp['id'], htmlLink: resp['htmlLink'] };
    } catch (err: any) {
      const msg = err?.error?.error?.message ?? err?.message ?? 'Erreur';
      return { status: 'error', message: msg };
    }
  }

  private async fetchUserEmail(token: string): Promise<string> {
    try {
      const resp: any = await firstValueFrom(
        this.http.get<any>('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return resp['email'] ?? '';
    } catch {
      return '';
    }
  }

  private persistState(): void {
    try {
      sessionStorage.setItem(
        'gcal_auth',
        JSON.stringify({
          token: this._accessToken(),
          email: this._userEmail(),
        })
      );
    } catch {}
  }

  private loadState(): void {
    try {
      const stored = sessionStorage.getItem('gcal_auth');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.token) {
          this._accessToken.set(data.token);
          this._isAuthenticated.set(true);
          this._userEmail.set(data.email ?? null);
        }
      }
    } catch {}
  }

  private clearState(): void {
    try {
      sessionStorage.removeItem('gcal_auth');
    } catch {}
  }
}
