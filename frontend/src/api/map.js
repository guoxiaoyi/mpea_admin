import request from './request';

export function fetchMapContinents(params) {
  return request.get('/api/map/continents', { params });
}

export function fetchMapContinentSimple() {
  return request.get('/api/map/continents/simple');
}

export function getMapContinent(id) {
  return request.get(`/api/map/continents/${id}`);
}

export function createMapContinent(data) {
  return request.post('/api/map/continents', data);
}

export function updateMapContinent(id, data) {
  return request.put(`/api/map/continents/${id}`, data);
}

export function deleteMapContinent(id) {
  return request.delete(`/api/map/continents/${id}`);
}

export function fetchMapMarkers(params) {
  return request.get('/api/map/markers', { params });
}

export function getMapMarker(id) {
  return request.get(`/api/map/markers/${id}`);
}

export function createMapMarker(data) {
  return request.post('/api/map/markers', data);
}

export function updateMapMarker(id, data) {
  return request.put(`/api/map/markers/${id}`, data);
}

export function deleteMapMarker(id) {
  return request.delete(`/api/map/markers/${id}`);
}

export function fetchLocationContinents() {
  return request.get('/api/map/catalog/continents');
}

export function fetchLocationCountries(continentCode) {
  return request.get('/api/map/catalog/countries', {
    params: { continentCode }
  });
}

export function fetchLocationCities(countryCode) {
  return request.get('/api/map/catalog/cities', {
    params: { countryCode }
  });
}

export function fetchLocationCityInfo(countryCode, city) {
  return request.get('/api/map/catalog/city-info', {
    params: { countryCode, city }
  });
}

export function createMapMarkersBulk(markers) {
  return request.post('/api/map/markers/bulk', { markers });
}


