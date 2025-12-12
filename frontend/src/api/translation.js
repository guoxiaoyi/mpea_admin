import request from './request';

export function fetchTranslations(params) {
  return request.get('/api/translations', { params });
}

export function fetchTranslationMeta() {
  return request.get('/api/translations/meta');
}

export function createTranslation(data) {
  return request.post('/api/translations', data);
}

export function updateTranslation(id, data) {
  return request.put(`/api/translations/${id}`, data);
}

export function deleteTranslation(id) {
  return request.delete(`/api/translations/${id}`);
}

export function importTranslations(data) {
  return request.post('/api/translations/import', data);
}


