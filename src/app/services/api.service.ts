import { Injectable } from '@angular/core';

// API Keys
const KEYS = {
  TICKETMASTER: "sowd7KcFn1tcUedHYAKIW4N3uxsVc20T",
  LASTFM: "f822273e813d340a5b1b83bea5566193",
  WEATHER: "3e7bdd8a90a446899d5231330251310",
  AQICN: "3dff5c5879f75f958019ea3a3cf2a95c94834bc2",
  UNSPLASH_KEY: "xfMSdukfjBqlPcUCBqS7eJSSxnvfSHpnK4TYDvACrbI"
};

// Interfaces
export interface WeatherData {
  current: {
    temp_c: number;
    feelslike_c: number;
    humidity: number;
    wind_kph: number;
    wind_dir: string;
    vis_km: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
    tz_id: string;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        daily_chance_of_rain: number;
        maxwind_kph: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }>;
  };
}

export interface AirQualityData {
  aqi: number | string;
  dominentpol: string;
  city: string;
  pm25: number | string;
  pm10: number | string;
  no2: number | string;
  co: number | string;
  o3: number | string;
  time: string;
}

export interface Event {
  name: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  country: string;
  price: string;
  currency: string;
  status: string;
  image: string;
  url: string;
}

export interface Track {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string;
    picture_medium: string;
  };
  album: {
    cover_medium: string;
  };
  duration: number;
  link: string;
}

export interface Artist {
  id: string;
  name: string;
  picture: string;
  count: number;
  top5: Track[];
}

export interface BikeStation {
  name: string;
  free_bikes: number;
  empty_slots: number;
  latitude: number;
  longitude: number;
}

export interface CityImage {
  urls: {
    regular: string;
  };
  user: {
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly TIMEOUT = 12000;

  constructor() { }

  // ======================== WEATHER ========================
  async getWeather(city: string): Promise<WeatherData> {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${KEYS.WEATHER}&q=${encodeURIComponent(city)}&days=3&aqi=no&alerts=no`;
    const res = await this.fetchWithTimeout(url);
    const data = await res.json();
    
    if (data.error) {
      throw new Error(`Weather API error: ${data.error.message}`);
    }
    
    return data;
  }

  // ======================== AIR QUALITY ========================
  async getAirQuality(city: string): Promise<AirQualityData> {
    const url = `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${KEYS.AQICN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "ok" || !data.data) {
      throw new Error(`Air quality data not found for ${city}`);
    }

    const iaqi = data.data.iaqi || {};
    return {
      aqi: data.data.aqi ?? "n/a",
      dominentpol: data.data.dominentpol ?? "N/A",
      city: data.data.city?.name ?? city,
      pm25: iaqi.pm25?.v ?? "n/a",
      pm10: iaqi.pm10?.v ?? "n/a",
      no2: iaqi.no2?.v ?? "n/a",
      co: iaqi.co?.v ?? "n/a",
      o3: iaqi.o3?.v ?? "n/a",
      time: data.data.time?.s ?? "N/A"
    };
  }

  // ======================== TICKETMASTER EVENTS ========================
  async getEvents(city: string): Promise<Event[]> {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${KEYS.TICKETMASTER}&city=${encodeURIComponent(city)}&size=10`;
    const res = await this.fetchWithTimeout(url);
    const data = await res.json();

    if (!data._embedded?.events) {
      return [];
    }

    return data._embedded.events.map((ev: any) => {
      const venue = ev._embedded?.venues?.[0] || {};
      const priceRange = ev.priceRanges?.[0];
      
      return {
        name: ev.name,
        date: ev.dates?.start?.localDate || "Unknown",
        time: ev.dates?.start?.localTime || "",
        venue: venue.name || "Unknown",
        city: venue.city?.name || "",
        country: venue.country?.name || "",
        price: priceRange ? `${priceRange.min} - ${priceRange.max}` : "N/A",
        currency: priceRange?.currency || "",
        status: ev.dates?.status?.code || "N/A",
        image: ev.images?.[0]?.url || "",
        url: ev.url
      };
    });
  }

  // ======================== UNSPLASH IMAGES ========================
  async getCityImages(city: string): Promise<CityImage[]> {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&per_page=5&client_id=${KEYS.UNSPLASH_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error("Unsplash API error");
    }

    const data = await res.json();
    return data.results || [];
  }

  // ======================== COUNTRY FROM CITY ========================
  async getCountryFromCity(city: string): Promise<string> {
    const url = `https://api.weatherapi.com/v1/current.json?key=${KEYS.WEATHER}&q=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      throw new Error("City not found");
    }

    return data.location.country;
  }

  // ======================== DEEZER MUSIC ========================
  async findDeezerCountryPlaylist(country: string) {
    const queries = [
      `Top ${country}`,
      `Top 50 ${country}`,
      `${country} Top`,
      `${country} Top 50`,
      `Top Hits ${country}`
    ];

    for (const q of queries) {
      try {
        const url = `https://api.deezer.com/search/playlist?q=${encodeURIComponent(q)}&limit=5`;
        const res = await fetch(url);
        
        if (!res.ok) continue;
        
        const data = await res.json();
        if (data?.data?.length > 0) {
          return data.data[0];
        }
      } catch (err) {
        console.warn("Deezer playlist search error for", q, err);
      }
    }
    return null;
  }

  async getPlaylistTracks(playlistId: string, limit = 30): Promise<Track[]> {
    const url = `https://api.deezer.com/playlist/${encodeURIComponent(playlistId)}/tracks?limit=${limit}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error("Deezer playlist error");
    }

    const data = await res.json();
    return data.data || [];
  }

  async getArtistTopTracks(artistId: string, limit = 5): Promise<Track[]> {
    const url = `https://api.deezer.com/artist/${encodeURIComponent(artistId)}/top?limit=${limit}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.warn("Failed to get artist top tracks for", artistId);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  }

  topArtistsFromTracks(tracks: Track[], topN = 5): Artist[] {
    const counts: { [key: string]: Artist } = {};
    
    for (const t of tracks) {
      const artist = t.artist;
      if (!artist?.id) continue;
      
      const id = artist.id;
      if (!counts[id]) {
        counts[id] = {
          id,
          name: artist.name,
          picture: artist.picture_medium,
          count: 0,
          top5: []
        };
      }
      counts[id].count += 1;
    }

    const arr = Object.values(counts).sort((a, b) => b.count - a.count);
    return arr.slice(0, topN);
  }

  async getMusicByCity(city: string) {
    try {
      const country = await this.getCountryFromCity(city);
      const playlist = await this.findDeezerCountryPlaylist(country);
      
      if (!playlist) {
        throw new Error("No playlist found for country");
      }

      const playlistTracks = await this.getPlaylistTracks(playlist.id, 50);
      const topArtists = this.topArtistsFromTracks(playlistTracks, 10);

      // Get top 5 tracks for each artist
      const artistPromises = topArtists.map(async (a) => {
        const top5 = await this.getArtistTopTracks(a.id, 5);
        return { ...a, top5 };
      });

      const artistsWithTop = await Promise.all(artistPromises);

      return {
        country,
        playlist,
        tracks: playlistTracks.slice(0, 10),
        artists: artistsWithTop
      };
    } catch (err) {
      console.error("Music fetch error:", err);
      throw err;
    }
  }

  // ======================== CITY BIKES ========================
  async getCityBikes(city: string): Promise<{ name: string; stations: BikeStation[] }> {
    const url = `https://api.citybik.es/v2/networks`;
    const res = await this.fetchWithTimeout(url);
    const data = await res.json();

    const networks = (data.networks || []).filter((n: any) => {
      const c = (n.location?.city || "").toLowerCase();
      const name = (n.name || "").toLowerCase();
      return c.includes(city.toLowerCase()) || name.includes(city.toLowerCase());
    });

    if (networks.length === 0) {
      throw new Error(`No bike network found for ${city}`);
    }

    const network = networks[0];
    const netRes = await this.fetchWithTimeout(`https://api.citybik.es/v2/networks/${encodeURIComponent(network.id)}`);
    const netData = await netRes.json();

    const stations = (netData.network?.stations || []).slice(0, 30);

    return {
      name: netData.network?.name || network.id,
      stations
    };
  }

  // ======================== UTILITY ========================
  private async fetchWithTimeout(url: string, opts = {}, ms = this.TIMEOUT): Promise<Response> {
    const ac = new AbortController();
    const id = setTimeout(() => ac.abort(), ms);
    
    try {
      const res = await fetch(url, { ...opts, signal: ac.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  safeText(s: any): string {
    return String(s ?? "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
