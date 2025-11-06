import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import CertificateModel from '../models/Certificate.js';

const router = express.Router();

// 配置multer用于临时存储上传的Excel文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.resolve(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('只支持 .xlsx 和 .xls 格式的文件'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// 解析Excel文件中的证书数据
function parseExcelFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const certificates = [];

  // 遍历所有工作表
  workbook.SheetNames.forEach(sheetName => {
    console.log(`正在处理工作表: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    
    // 获取工作表的范围
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    
    // 从工作表标题中提取年份（如"2024年10~12月证书"）
    let defaultYear = new Date().getFullYear();
    const titleMatch = sheetName.match(/(\d{4})年/);
    if (titleMatch) {
      defaultYear = parseInt(titleMatch[1]);
    }

    let currentMonth = '';
    
    // 从第3行开始读取（跳过标题行和列名行）
    for (let rowNum = 2; rowNum <= range.e.r; rowNum++) {
      // A列：年月信息（合并单元格）
      const cellA = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: 0 })];
      // B列：序号（不需要）
      // C列：姓名
      const cellC = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: 2 })];
      // D列：编号
      const cellD = worksheet[xlsx.utils.encode_cell({ r: rowNum, c: 3 })];

      // 检查A列是否有月份信息（合并单元格时，只有第一个单元格有值）
      if (cellA && cellA.v) {
        const monthMatch = cellA.v.toString().match(/(\d+)月/);
        if (monthMatch) {
          currentMonth = monthMatch[1].padStart(2, '0');
          console.log(`找到月份: ${currentMonth}`);
        }
      }

      // 读取姓名和编号
      if (cellC && cellC.v && cellD && cellD.v && currentMonth) {
        const name = cellC.v.toString().trim();
        let certificateNo = cellD.v.toString().trim();
        
        // 处理编号格式（统一格式）
        certificateNo = certificateNo.replace(/^No\.?\s*/i, 'No.').replace(/^N\.?\s*/i, 'N.');
        
        const certDate = `${defaultYear}/${currentMonth}`;
        
        if (name && certificateNo) {
          certificates.push({
            certificate_no: certificateNo,
            name: name,
            cert_date: certDate
          });
          console.log(`添加证书: ${name} - ${certificateNo} - ${certDate}`);
        }
      }
    }
  });

  console.log(`共解析到 ${certificates.length} 条证书记录`);
  return certificates;
}

// 初始化数据库表
router.post('/init-table', authMiddleware, async (req, res) => {
  try {
    await CertificateModel.createTable();
    res.json({ success: true, message: '证书表初始化成功' });
  } catch (error) {
    console.error('初始化证书表失败:', error);
    res.status(500).json({ success: false, message: '初始化失败' });
  }
});

// 上传并导入Excel文件
router.post('/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const filePath = req.file.path;

    // 解析Excel文件
    const certificates = parseExcelFile(filePath);

    // 删除临时文件
    fs.unlinkSync(filePath);

    if (certificates.length === 0) {
      return res.status(400).json({ success: false, message: '文件中没有找到有效的证书数据' });
    }

    // 批量插入数据库
    const result = await CertificateModel.batchInsert(certificates);

    res.json({
      success: true,
      message: '导入完成',
      data: {
        total: certificates.length,
        inserted: result.insertedCount,
        skipped: result.skippedCount,
        errors: result.errors
      }
    });
  } catch (error) {
    console.error('导入证书失败:', error);
    // 清理临时文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: '导入失败: ' + error.message });
  }
});

// 获取证书列表（管理后台）
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page, limit, keyword } = req.query;
    const result = await CertificateModel.findAll(page, limit, keyword);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('获取证书列表失败:', error);
    res.status(500).json({ success: false, message: '获取列表失败' });
  }
});

// 获取单个证书详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const certificate = await CertificateModel.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: '证书不存在' });
    }
    res.json({ success: true, data: certificate });
  } catch (error) {
    console.error('获取证书详情失败:', error);
    res.status(500).json({ success: false, message: '获取详情失败' });
  }
});

// 更新证书
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { certificateNo, name, certDate, status } = req.body;
    
    if (!certificateNo || !name || !certDate) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const certificate = await CertificateModel.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: '证书不存在' });
    }

    await CertificateModel.update(req.params.id, { certificateNo, name, certDate, status });
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    console.error('更新证书失败:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: '证书编号已存在' });
    }
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 删除证书
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const certificate = await CertificateModel.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ success: false, message: '证书不存在' });
    }

    await CertificateModel.delete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除证书失败:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// 批量删除证书
router.post('/batch-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的证书' });
    }

    const result = await CertificateModel.batchDelete(ids);
    res.json({ success: true, message: `成功删除 ${result.affectedRows} 条记录` });
  } catch (error) {
    console.error('批量删除证书失败:', error);
    res.status(500).json({ success: false, message: '批量删除失败' });
  }
});

export default router;

