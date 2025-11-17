import request from './request';

export function fetchContactMessages(params) {
  return request.get('/api/contact-messages', { params });
}

export function fetchContactMessageDetail(id) {
  return request.get(`/api/contact-messages/${id}`);
}

export function updateContactMessageStatus(id, status) {
  return request.patch(`/api/contact-messages/${id}/status`, { status });
}

export function deleteContactMessage(id) {
  return request.delete(`/api/contact-messages/${id}`);
}



