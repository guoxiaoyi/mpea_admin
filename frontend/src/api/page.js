import request from './request';

export function fetchPages(params) {
  return request.get('/api/pages', { params });
}

export function fetchPageDetail(id) {
  return request.get(`/api/pages/${id}`);
}

export function createPage(data) {
  return request.post('/api/pages', data);
}

export function updatePage(id, data) {
  return request.put(`/api/pages/${id}`, data);
}

export function deletePage(id) {
  return request.delete(`/api/pages/${id}`);
}
