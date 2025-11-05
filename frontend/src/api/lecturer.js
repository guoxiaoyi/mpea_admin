import request from './request';

export function fetchLecturers(params) {
  return request.get('/api/lecturers', { params });
}

export function fetchLecturerDetail(id) {
  return request.get(`/api/lecturers/${id}`);
}

export function createLecturer(data) {
  return request.post('/api/lecturers', data);
}

export function updateLecturer(id, data) {
  return request.put(`/api/lecturers/${id}`, data);
}

export function deleteLecturer(id) {
  return request.delete(`/api/lecturers/${id}`);
}


