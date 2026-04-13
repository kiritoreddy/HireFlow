import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { USERS_ENDPOINTS } from '../config/api.config';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loadUsers maps backend users and updates signal', async () => {
    const promise = firstValueFrom(service.loadUsers());
    const req = httpMock.expectOne(USERS_ENDPOINTS.list);
    req.flush([
      {
        id: 1,
        name: 'Alice Bee',
        email: 'a@b.com',
        role: 'admin',
        is_active: true,
        created_at: 'c',
      },
    ]);
    const list = await promise;
    expect(list.length).toBe(1);
    expect(list[0].email).toBe('a@b.com');
    expect(service.usersList().length).toBe(1);
  });

  it('loadUsers returns empty array on HTTP error', async () => {
    const promise = firstValueFrom(service.loadUsers());
    const req = httpMock.expectOne(USERS_ENDPOINTS.list);
    req.flush('err', { status: 500, statusText: 'Server' });
    const list = await promise;
    expect(list).toEqual([]);
  });
});
