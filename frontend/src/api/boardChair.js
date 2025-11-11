import request from './request';

export function fetchBoardChairs() {
  return request.get('/api/board-chair');
}

export function fetchBoardChairDetail(id) {
  return request.get(`/api/board-chair/${id}`);
}

export function createBoardChair(data) {
  return request.post('/api/board-chair', data);
}

export function updateBoardChair(id, data) {
  return request.put(`/api/board-chair/${id}`, data);
}

export function deleteBoardChair(id) {
  return request.delete(`/api/board-chair/${id}`);
}

