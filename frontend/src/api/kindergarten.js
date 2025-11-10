import request from './request';

export function fetchKindergartens(params) {
  return request.get('/api/kindergartens', { params });
}

export function fetchKindergartenDetail(id) {
  return request.get(`/api/kindergartens/${id}`);
}

export function createKindergarten(data) {
  return request.post('/api/kindergartens', data);
}

export function updateKindergarten(id, data) {
  return request.put(`/api/kindergartens/${id}`, data);
}

export function deleteKindergarten(id) {
  return request.delete(`/api/kindergartens/${id}`);
}


