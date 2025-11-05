import request from './request';

export function fetchCases(params) {
  return request.get('/api/cases', { params });
}

export function fetchCaseDetail(id) {
  return request.get(`/api/cases/${id}`);
}

export function createCase(data) {
  return request.post('/api/cases', data);
}

export function updateCase(id, data) {
  return request.put(`/api/cases/${id}`, data);
}

export function deleteCase(id) {
  return request.delete(`/api/cases/${id}`);
}


