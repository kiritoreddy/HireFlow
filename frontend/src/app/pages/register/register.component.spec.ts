import { TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let authSpy: { register: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authSpy = { register: vi.fn().mockReturnValue(of({ success: true })) };
    routerSpy = { navigate: vi.fn() };

    TestBed.overrideComponent(RegisterComponent, { set: { template: '' } });

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    component = TestBed.createComponent(RegisterComponent).componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when fields are empty', () => {
    component.name = '';
    component.email = '';
    component.password = '';
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'Password1!';
    component.confirmPassword = 'different';
    component.onSubmit();
    expect(component.error).toBe('Passwords do not match.');
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'abc';
    component.confirmPassword = 'abc';
    component.onSubmit();
    expect(component.error).toBe('Password must be at least 8 characters.');
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should call auth.register with correct data on valid submit', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'Password1!';
    component.confirmPassword = 'Password1!';
    component.onSubmit();
    expect(authSpy.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'Password1!');
  });

  it('should show success message on successful registration', () => {
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.password = 'Password1!';
    component.confirmPassword = 'Password1!';
    component.onSubmit();
    expect(component.success).toContain('Account created');
  });

  it('should show error message on failed registration', () => {
    authSpy.register.mockReturnValue(of({ success: false, error: 'Email already in use' }));
    component.name = 'Test User';
    component.email = 'taken@example.com';
    component.password = 'Password1!';
    component.confirmPassword = 'Password1!';
    component.onSubmit();
    expect(component.error).toBe('Email already in use');
  });
});
