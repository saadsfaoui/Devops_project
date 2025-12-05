import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchSubject = new Subject<string>();
  public search$ = this.searchSubject.asObservable();

  private citiesSubject = new Subject<Array<{name: string; country: string}>>();
  public cities$ = this.citiesSubject.asObservable();

  performSearch(query: string) {
    this.searchSubject.next(query);
  }

  setCities(cities: Array<{name: string; country: string}>) {
    this.citiesSubject.next(cities);
  }
}
