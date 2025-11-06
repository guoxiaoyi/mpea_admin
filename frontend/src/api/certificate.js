import request from './request';

// 初始化证书表
export const initCertificateTable = () => {
  return request({
    url: '/api/certificates/init-table',
    method: 'post'
  });
};

// 导入Excel文件
export const importCertificates = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request({
    url: '/api/certificates/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 获取证书列表
export const getCertificateList = (params) => {
  return request({
    url: '/api/certificates',
    method: 'get',
    params
  });
};

// 获取证书详情
export const getCertificateDetail = (id) => {
  return request({
    url: `/api/certificates/${id}`,
    method: 'get'
  });
};

// 更新证书
export const updateCertificate = (id, data) => {
  return request({
    url: `/api/certificates/${id}`,
    method: 'put',
    data
  });
};

// 删除证书
export const deleteCertificate = (id) => {
  return request({
    url: `/api/certificates/${id}`,
    method: 'delete'
  });
};

// 批量删除证书
export const batchDeleteCertificates = (ids) => {
  return request({
    url: '/api/certificates/batch-delete',
    method: 'post',
    data: { ids }
  });
};

// 公共查询：根据证书编号查询
export const searchCertificate = (certificateNo) => {
  return request({
    url: '/api/public/certificates/search',
    method: 'get',
    params: { certificateNo }
  });
};

