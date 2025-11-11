import request from './request';

export function fetchEvents(params) {
  return request.get('/api/events', { params });
}

export function fetchEventDetail(id) {
  return request.get(`/api/events/${id}`);
}

export function createEvent(data) {
  return request.post('/api/events', data);
}

export function updateEvent(id, data) {
  return request.put(`/api/events/${id}`, data);
}

export function deleteEvent(id) {
  return request.delete(`/api/events/${id}`);
}

export function fetchPublicEvents(params) {
  return request.get('/api/public/events', { params });
}

export function fetchPublicEventDetail(id) {
  return request.get(`/api/public/events/${id}`);
}


