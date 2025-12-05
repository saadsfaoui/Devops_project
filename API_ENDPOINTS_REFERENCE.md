# API Endpoints Reference

## Complete List of Integrated APIs

### 1. WeatherAPI ☀️
**Service Method**: `getWeather(city: string)`

- **Base URL**: `https://api.weatherapi.com/v1/`
- **Endpoint Used**: `/forecast.json`
- **Query Parameters**: 
  - `key`: API key
  - `q`: City name
  - `days`: 3 (forecast days)
  - `aqi`: no
  - `alerts`: no
- **Response**: Weather, location, and forecast data
- **Example Call**: 
  ```
  https://api.weatherapi.com/v1/forecast.json?key=3e7bdd8a90a446899d5231330251310&q=Paris&days=3&aqi=no&alerts=no
  ```

---

### 2. AQICN (Air Quality Index) 💨
**Service Method**: `getAirQuality(city: string)`

- **Base URL**: `https://api.waqi.info/`
- **Endpoint Used**: `/feed/{city}/`
- **Query Parameters**:
  - `token`: API token
- **Response**: AQI, PM2.5, PM10, NO₂, CO, O₃ data
- **Example Call**:
  ```
  https://api.waqi.info/feed/Paris/?token=3dff5c5879f75f958019ea3a3cf2a95c94834bc2
  ```

---

### 3. Ticketmaster Events 🎫
**Service Method**: `getEvents(city: string)`

- **Base URL**: `https://app.ticketmaster.com/discovery/v2/`
- **Endpoint Used**: `/events.json`
- **Query Parameters**:
  - `apikey`: API key
  - `city`: City name
  - `size`: 10 (number of results)
- **Response**: Event listings with venues, dates, prices
- **Example Call**:
  ```
  https://app.ticketmaster.com/discovery/v2/events.json?apikey=sowd7KcFn1tcUedHYAKIW4N3uxsVc20T&city=Paris&size=10
  ```

---

### 4. Unsplash Images 📷
**Service Method**: `getCityImages(city: string)`

- **Base URL**: `https://api.unsplash.com/`
- **Endpoint Used**: `/search/photos`
- **Query Parameters**:
  - `query`: Search term (city name)
  - `per_page`: 5 (number of results)
  - `client_id`: API key
- **Response**: Array of high-quality images
- **Example Call**:
  ```
  https://api.unsplash.com/search/photos?query=Paris&per_page=5&client_id=xfMSdukfjBqlPcUCBqS7eJSSxnvfSHpnK4TYDvACrbI
  ```

---

### 5. Deezer Music 🎵
**Service Methods**:
- `getMusicByCity(city: string)` - Combined method
- `getCountryFromCity(city: string)` - Get country from city
- `findDeezerCountryPlaylist(country: string)` - Find playlist
- `getPlaylistTracks(playlistId: string, limit: number)` - Get tracks
- `getArtistTopTracks(artistId: string, limit: number)` - Get artist tracks
- `topArtistsFromTracks(tracks: Track[], topN: number)` - Parse artists

#### Deezer Endpoints:
1. **Get Playlists**
   - **URL**: `https://api.deezer.com/search/playlist`
   - **Params**: `q`, `limit`
   - **Example**: 
     ```
     https://api.deezer.com/search/playlist?q=Top%20France&limit=5
     ```

2. **Get Playlist Tracks**
   - **URL**: `https://api.deezer.com/playlist/{id}/tracks`
   - **Params**: `limit`
   - **Example**: 
     ```
     https://api.deezer.com/playlist/123456/tracks?limit=30
     ```

3. **Get Artist Top Tracks**
   - **URL**: `https://api.deezer.com/artist/{id}/top`
   - **Params**: `limit`
   - **Example**: 
     ```
     https://api.deezer.com/artist/789/top?limit=5
     ```

---

### 6. CityBikes 🚲
**Service Method**: `getCityBikes(city: string)`

- **Base URL**: `https://api.citybik.es/v2/`
- **Endpoints Used**:
  1. `/networks` - List all networks
  2. `/networks/{id}` - Get specific network details

- **Response**: Bike-sharing stations with availability
- **Example Calls**:
  ```
  https://api.citybik.es/v2/networks
  https://api.citybik.es/v2/networks/citybike-paris
  ```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
│          (Hover marker / Click on city / Search)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │      API Service           │
        │  (Central Request Handler) │
        └────────────┬───────────────┘
                     │
        ┌────────────┼────────────┬────────────┬────────────┐
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────┐
   │Weather │  │ Air    │  │ Bike   │  │ Events │  │  Music   │
   │ API    │  │Quality │  │Sharing │  │(TM)    │  │ (Deezer) │
   │        │  │(AQICN) │  │(CB.es) │  │        │  │          │
   └────┬───┘  └───┬────┘  └───┬────┘  └───┬────┘  └─────┬────┘
        │          │           │           │             │
        └──────────┼───────────┼───────────┼─────────────┘
                   │
        ┌──────────▼──────────┐
        │   Cache Layer       │
        │  (Avoid Duplicates) │
        └──────────┬──────────┘
                   │
        ┌──────────▼─────────────────┐
        │  Component State Update    │
        │  (Signals / Observables)   │
        └──────────┬─────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Template Rendering │
        │  (Display Data)     │
        └─────────────────────┘
```

---

## Request/Response Examples

### Weather Request/Response
**Request**:
```
GET https://api.weatherapi.com/v1/forecast.json?key=KEY&q=Paris&days=3
```

**Response (Partial)**:
```json
{
  "current": {
    "temp_c": 15,
    "humidity": 70,
    "wind_kph": 12,
    "condition": { "text": "Cloudy", "icon": "..." }
  },
  "location": {
    "name": "Paris",
    "country": "France",
    "localtime": "2024-12-05 14:30"
  },
  "forecast": { "forecastday": [...] }
}
```

### Air Quality Request/Response
**Request**:
```
GET https://api.waqi.info/feed/Paris/?token=TOKEN
```

**Response (Partial)**:
```json
{
  "status": "ok",
  "data": {
    "aqi": 45,
    "dominentpol": "pm25",
    "iaqi": {
      "pm25": { "v": 25 },
      "pm10": { "v": 35 },
      "no2": { "v": 45 }
    }
  }
}
```

### Events Request/Response
**Request**:
```
GET https://app.ticketmaster.com/discovery/v2/events.json?apikey=KEY&city=Paris&size=10
```

**Response (Partial)**:
```json
{
  "_embedded": {
    "events": [
      {
        "name": "Concert Name",
        "dates": { "start": { "localDate": "2024-12-20", "localTime": "20:00" } },
        "priceRanges": [{ "min": 30, "max": 150, "currency": "EUR" }],
        "_embedded": { "venues": [{ "name": "Venue Name" }] }
      }
    ]
  }
}
```

### Bike Sharing Request/Response
**Request**:
```
GET https://api.citybik.es/v2/networks
```

**Response (Partial)**:
```json
{
  "networks": [
    {
      "id": "citybike-paris",
      "name": "Velib",
      "location": { "city": "Paris", "country": "France" }
    }
  ]
}
```

---

## Error Handling by API

### Common Error Scenarios

| API | Error | Solution |
|-----|-------|----------|
| Weather | "Invalid city" | Try with full city name (e.g., "Paris, France") |
| AQICN | "No station" | Not all cities have air quality monitors |
| Ticketmaster | "No events" | City may have no upcoming events |
| CityBikes | "Network not found" | City may not have bike-sharing system |
| Deezer | "No playlist found" | Country may not have popular playlists |
| Unsplash | Rate limited | Wait before making next request |

---

## Rate Limits & Quotas

| API | Limit | Notes |
|-----|-------|-------|
| WeatherAPI | 1M/month | Free tier |
| AQICN | Variable | Token-based |
| Ticketmaster | Standard | Check documentation |
| Unsplash | 50/hour | Per client ID |
| Deezer | Varies | Public API |
| CityBikes | Varies | Public API |

---

## Headers & Authentication

All requests use standard headers:
```
Content-Type: application/json
Accept: application/json
```

Authentication methods:
- **API Keys**: WeatherAPI, Ticketmaster, Unsplash (query parameter)
- **Tokens**: AQICN (query parameter)
- **Public API**: Deezer, CityBikes (no auth required)

---

## CORS Considerations

Some APIs may have CORS restrictions. The service handles this with:
1. Using JSONP where available
2. Implementing a backend proxy (future)
3. Graceful fallback on CORS errors

---

## Testing API Calls

### Using Browser Console
```javascript
// Test WeatherAPI directly
fetch('https://api.weatherapi.com/v1/forecast.json?key=3e7bdd8a90a446899d5231330251310&q=Paris&days=3')
  .then(r => r.json())
  .then(d => console.log(d));
```

### Using ApiService in Angular
```typescript
constructor(private api: ApiService) {}

ngOnInit() {
  this.api.getWeather('Paris').then(data => {
    console.log('Weather:', data);
  });
}
```

---

## Response Timeout

All requests have a **12-second timeout**. If no response within this time:
1. Request is aborted
2. Error is caught and logged
3. Component receives `null` value
4. UI displays fallback message

---

## Caching Strategy

Service maintains three caches:
- `weatherCache`: Weather data by city
- `airQualityCache`: Air quality by city
- `bikeCache`: Bike data by city

**Cache Duration**: Component lifetime (cleared on page reload)

Check cache before API call:
```typescript
if (this.weatherCache.has(city)) {
  return this.weatherCache.get(city);
}
```

---

**API Documentation Last Updated**: December 5, 2025
**Total APIs Integrated**: 6
**Total Endpoints**: 10+
**Status**: Production Ready ✅
