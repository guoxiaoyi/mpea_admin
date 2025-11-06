<template>
  <div class="certificate-search">
    <div class="container">
      <div class="search-card">
        <h1 class="title">证书查询</h1>
        <p class="subtitle">请输入您的证书编号进行查询</p>

        <div class="search-box">
          <input
            v-model="certificateNo"
            @keyup.enter="handleSearch"
            type="text"
            placeholder="请输入证书编号，例如：No.02202091"
            class="search-input"
          />
          <button @click="handleSearch" class="search-btn" :disabled="searching">
            {{ searching ? '查询中...' : '查询' }}
          </button>
        </div>

        <!-- 查询结果 -->
        <div v-if="searched" class="result-section">
          <div v-if="certificate" class="result-card success">
            <div class="result-icon">✓</div>
            <h2 class="result-title">查询成功</h2>
            <div class="result-info">
              <div class="info-item">
                <span class="info-label">证书编号：</span>
                <span class="info-value">{{ certificate.certificateNo }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">姓名：</span>
                <span class="info-value">{{ certificate.name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">颁发时间：</span>
                <span class="info-value">{{ certificate.certDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">查询时间：</span>
                <span class="info-value">{{ formatDate(certificate.createdAt) }}</span>
              </div>
            </div>
            <div class="result-footer">
              <p class="verify-text">此证书信息已通过官方验证</p>
            </div>
          </div>

          <div v-else class="result-card error">
            <div class="result-icon">✗</div>
            <h2 class="result-title">未查询到证书</h2>
            <p class="result-message">
              您输入的证书编号 <strong>{{ searchedNo }}</strong> 未在系统中找到。<br />
              请检查编号是否正确，或联系管理员咨询。
            </p>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="tips-section">
          <h3 class="tips-title">查询说明：</h3>
          <ul class="tips-list">
            <li>请输入完整的证书编号（包括"No."或"N."前缀）</li>
            <li>证书编号格式示例：No.02202091 或 N.02202091</li>
            <li>查询时不区分大小写</li>
            <li>如有疑问，请联系相关管理部门</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { searchCertificate } from '@/api/certificate';

const certificateNo = ref('');
const searching = ref(false);
const searched = ref(false);
const searchedNo = ref('');
const certificate = ref(null);

const handleSearch = async () => {
  const no = certificateNo.value.trim();
  
  if (!no) {
    alert('请输入证书编号');
    return;
  }

  try {
    searching.value = true;
    searched.value = false;
    searchedNo.value = no;

    const res = await searchCertificate(no);
    
    searched.value = true;
    
    if (res.success) {
      certificate.value = res.data;
    } else {
      certificate.value = null;
    }
  } catch (error) {
    console.error('查询失败:', error);
    alert('查询失败，请稍后重试');
    searched.value = false;
  } finally {
    searching.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};
</script>

<style scoped>
.certificate-search {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.search-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.subtitle {
  text-align: center;
  font-size: 16px;
  color: #606266;
  margin: 0 0 30px 0;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.search-input {
  flex: 1;
  padding: 14px 20px;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn {
  padding: 14px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-section {
  margin-top: 30px;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card {
  padding: 30px;
  border-radius: 12px;
  text-align: center;
}

.result-card.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
}

.result-card.error {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border: 2px solid #f44336;
}

.result-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  border-radius: 50%;
}

.result-card.success .result-icon {
  background: #4caf50;
  color: white;
}

.result-card.error .result-icon {
  background: #f44336;
  color: white;
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.result-card.success .result-title {
  color: #2e7d32;
}

.result-card.error .result-title {
  color: #c62828;
}

.result-info {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
}

.info-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 120px;
}

.info-value {
  color: #2c3e50;
  font-weight: 500;
}

.result-footer {
  margin-top: 20px;
}

.verify-text {
  color: #2e7d32;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.result-message {
  color: #c62828;
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
}

.result-message strong {
  color: #d32f2f;
  font-weight: 700;
}

.tips-section {
  margin-top: 40px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.tips-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
}

.tips-list li {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .search-card {
    padding: 20px;
  }

  .title {
    font-size: 24px;
  }

  .search-box {
    flex-direction: column;
  }

  .search-btn {
    width: 100%;
  }

  .info-item {
    flex-direction: column;
    gap: 5px;
  }

  .info-label {
    min-width: auto;
  }
}
</style>

