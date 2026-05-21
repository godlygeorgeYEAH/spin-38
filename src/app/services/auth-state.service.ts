import { Injectable } from '@angular/core';
import { QueryParams } from '../interfaces/query-params.interface';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  token: string = '';
  queryParams: QueryParams | null = null;
}
