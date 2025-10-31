import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service'; // ✅ bon import

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({}); // configuration de base
    service = TestBed.inject(AuthService); // ✅ bon nom ici aussi
  });

  it('should be created', () => {
    expect(service).toBeTruthy(); // ✅ test basique : le service existe
  });
});
