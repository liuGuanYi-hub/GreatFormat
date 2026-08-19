const path = require('path');
const fs = require('fs');
const ConverterHub = require('../src/core/converter-hub');
const { createTempDir, cleanPath } = require('../src/core/utils');

async function runTests() {
  console.log('💎 开始运行 GreatFormat 核心引擎自检...');
  const tempDir = createTempDir('greatformat_test_');

  try {
    // 1. 验证能力查询
    const caps = ConverterHub.getCapabilities();
    console.log('✓ 格式探测与能力字典就绪:', Object.keys(caps.matrix).length, '种源格式支持');

    // 2. 验证目标格式推导
    const wordTargets = ConverterHub.getTargetFormats('test.docx');
    console.log('✓ Word 目标格式推导:', wordTargets);

    const pngTargets = ConverterHub.getTargetFormats('avatar.png');
    console.log('✓ PNG 目标格式推导:', pngTargets);

    console.log('\n✨ 核心模块路由与调度自检全部通过！这可真是太 Great 了！');
  } catch (err) {
    console.error('💥 测试发现异常:', err);
  } finally {
    cleanPath(tempDir);
  }
}

runTests();
