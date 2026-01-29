

import { Injectable, signal } from '@angular/core';
import { ToastService } from './toast.service';
import { GEOFENCE_RADIUS_METERS, GEOFENCE_LAT, GEOFENCE_LNG } from '../core/constants';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  currentLocation = signal<LocationCoordinates | null>(null);
  isWithinGeofence = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private watchId: number | null = null;

  constructor(private toastService: ToastService) {}

  // Request current location (one-time)
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    this.isLoading.set(true);
    this.error.set(null);

    if (!navigator.geolocation) {
      const message = 'Geolocation is not supported by your browser';
      this.error.set(message);
      this.toastService.error(message);
      this.isLoading.set(false);
      return null;
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          this.currentLocation.set(coords);
          this.checkGeofence(coords);
          this.isLoading.set(false);
          resolve(coords);
        },
        err => {
          const message = this.getGeolocationErrorMessage(err.code);
          this.error.set(message);
          this.toastService.error(message);
          this.isLoading.set(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // Watch location continuously
  watchLocation(callback?: (coords: LocationCoordinates) => void): boolean {
    if (!navigator.geolocation) {
      this.error.set('Geolocation not supported');
      return false;
    }

    if (this.watchId !== null) {
      return true; // Already watching
    }

    this.watchId = navigator.geolocation.watchPosition(
      position => {
        const coords: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        this.currentLocation.set(coords);
        this.checkGeofence(coords);

        if (callback) {
          callback(coords);
        }
      },
      err => {
        console.error('Watch position error:', err);
        this.error.set(this.getGeolocationErrorMessage(err.code));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return true;
  }

  // Stop watching location
  stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Check if location is within geofence
  private checkGeofence(coords: LocationCoordinates): void {
    const distance = this.calculateDistance(
      coords.latitude,
      coords.longitude,
      GEOFENCE_LAT,
      GEOFENCE_LNG
    );

    this.isWithinGeofence.set(distance <= GEOFENCE_RADIUS_METERS);
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Format location for display
  formatLocation(coords: LocationCoordinates): string {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }

  private getGeolocationErrorMessage(code: number): string {
    const messages: Record<number, string> = {
      1: 'Permission denied - please enable location access',
      2: 'Position unavailable - check your connection',
      3: 'Request timeout - please try again'
    };

    return messages[code] || 'Unable to get location';
  }
}
