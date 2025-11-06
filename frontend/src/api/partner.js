import request from './request';

// 获取合作伙伴列表
export const getPartners = (params) => {
  return request({
    url: '/api/partners',
    method: 'get',
    params
  });
};

// 获取单个合作伙伴
export const getPartner = (id) => {
  return request({
    url: `/api/partners/${id}`,
    method: 'get'
  });
};

// 创建合作伙伴
export const createPartner = (data) => {
  return request({
    url: '/api/partners',
    method: 'post',
    data
  });
};

// 更新合作伙伴
export const updatePartner = (id, data) => {
  return request({
    url: `/api/partners/${id}`,
    method: 'put',
    data
  });
};

// 删除合作伙伴
export const deletePartner = (id) => {
  return request({
    url: `/api/partners/${id}`,
    method: 'delete'
  });
};

// 批量删除合作伙伴
export const batchDeletePartners = (ids) => {
  return request({
    url: '/api/partners/batch-delete',
    method: 'post',
    data: { ids }
  });
};

// 更新排序
export const updatePartnerSort = (id, sortOrder) => {
  return request({
    url: `/api/partners/${id}/sort`,
    method: 'patch',
    data: { sortOrder }
  });
};

// 获取公开的合作伙伴列表
export const getPublicPartners = (params) => {
  return request({
    url: '/api/public/partners',
    method: 'get',
    params
  });
};

