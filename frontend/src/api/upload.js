import request from './request';

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('upfile', file);
  const res = await request.post('/api/ueditor/controller?action=uploadimage', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  if (res.state !== 'SUCCESS' || !res.url) {
    throw new Error(res.message || '上传失败');
  }
  return res.url;
}


