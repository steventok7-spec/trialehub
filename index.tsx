
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './src/app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { httpErrorInterceptor } from './src/core/http-error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(
      withFetch(),
      withInterceptors([httpErrorInterceptor])
    )
  ]
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.