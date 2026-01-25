import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { httpErrorInterceptor } from './http-error.interceptor';
import { ToastService } from '../services/toast.service';
import { Observable, throwError } from 'rxjs';

describe('httpErrorInterceptor', () => {
  let toastService: ToastService;
  let mockHandler: HttpHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });

    toastService = TestBed.inject(ToastService);
    jest.spyOn(toastService, 'error');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createRequest = (url: string = 'https://api.test.com/endpoint') => {
    return new HttpRequest('GET', url);
  };

  it('should pass through successful requests', (done) => {
    const request = createRequest();
    const mockResponse = { status: 200, body: { data: 'test' } };

    mockHandler = {
      handle: jest.fn().mockReturnValue(new Observable(subscriber => {
        subscriber.next(mockResponse as any);
        subscriber.complete();
      })),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(toastService.error).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('should handle client-side errors', (done) => {
    const request = createRequest();
    const clientError = new ErrorEvent('Network error', {
      message: 'Connection failed',
    });

    const errorResponse = new HttpErrorResponse({
      error: clientError,
      status: 0,
      statusText: 'Unknown Error',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(toastService.error).toHaveBeenCalledWith('API Error: Please try again later.');
          expect(console.error).toHaveBeenCalledWith('Error: Connection failed');
          done();
        },
      });
    });
  });

  it('should handle server-side errors (404)', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Not found' },
      status: 404,
      statusText: 'Not Found',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(toastService.error).toHaveBeenCalledWith('API Error: Please try again later.');
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error Code: 404')
          );
          done();
        },
      });
    });
  });

  it('should handle server-side errors (500)', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Internal server error' },
      status: 500,
      statusText: 'Internal Server Error',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(toastService.error).toHaveBeenCalledWith('API Error: Please try again later.');
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error Code: 500')
          );
          done();
        },
      });
    });
  });

  it('should handle unauthorized errors (401)', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Unauthorized' },
      status: 401,
      statusText: 'Unauthorized',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(toastService.error).toHaveBeenCalledWith('API Error: Please try again later.');
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error Code: 401')
          );
          done();
        },
      });
    });
  });

  it('should handle network timeout errors', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: new ProgressEvent('timeout'),
      status: 0,
      statusText: 'Unknown Error',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          expect(toastService.error).toHaveBeenCalledWith('API Error: Please try again later.');
          expect(console.error).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('should propagate the error after handling', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Test error' },
      status: 400,
      statusText: 'Bad Request',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: (error) => {
          expect(error).toBe(errorResponse);
          done();
        },
      });
    });
  });

  it('should handle multiple consecutive errors', (done) => {
    const request1 = createRequest('/api/endpoint1');
    const request2 = createRequest('/api/endpoint2');

    const error1 = new HttpErrorResponse({
      error: { message: 'Error 1' },
      status: 500,
      statusText: 'Internal Server Error',
      url: request1.url,
    });

    const error2 = new HttpErrorResponse({
      error: { message: 'Error 2' },
      status: 404,
      statusText: 'Not Found',
      url: request2.url,
    });

    mockHandler = {
      handle: jest.fn()
        .mockReturnValueOnce(throwError(() => error1))
        .mockReturnValueOnce(throwError(() => error2)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor1$ = httpErrorInterceptor(request1, mockHandler.handle.bind(mockHandler));
      const interceptor2$ = httpErrorInterceptor(request2, mockHandler.handle.bind(mockHandler));

      let errorCount = 0;

      interceptor1$.subscribe({
        error: () => {
          errorCount++;
          expect(toastService.error).toHaveBeenCalledTimes(errorCount);

          interceptor2$.subscribe({
            error: () => {
              errorCount++;
              expect(toastService.error).toHaveBeenCalledTimes(errorCount);
              done();
            },
          });
        },
      });
    });
  });

  it('should log error message to console', (done) => {
    const request = createRequest();
    const errorResponse = new HttpErrorResponse({
      error: { message: 'Test error' },
      status: 503,
      statusText: 'Service Unavailable',
      url: request.url,
    });

    mockHandler = {
      handle: jest.fn().mockReturnValue(throwError(() => errorResponse)),
    } as any;

    TestBed.runInInjectionContext(() => {
      const interceptor$ = httpErrorInterceptor(request, mockHandler.handle.bind(mockHandler));

      interceptor$.subscribe({
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error Code: 503')
          );
          done();
        },
      });
    });
  });
});
