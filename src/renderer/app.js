// GreatFormat 渲染层逻辑 (仗助与疯狂钻石交互核心)
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const taskList = document.getElementById('taskList');
  const queueHeader = document.getElementById('queueHeader');
  const actionFooter = document.getElementById('actionFooter');
  const taskCountEl = document.getElementById('taskCount');
  const batchTargetSelect = document.getElementById('batchTargetSelect');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const startConvertBtn = document.getElementById('startConvertBtn');
  const footerStatusText = document.getElementById('footerStatusText');
  const mascotAvatar = document.getElementById('mascotAvatar');
  const mascotEmoji = document.getElementById('mascotEmoji');
  const mascotSpeech = document.getElementById('mascotSpeech');
  const savePathDisplay = document.getElementById('savePathDisplay');
  const changeSaveDirBtn = document.getElementById('changeSaveDirBtn');
  const previewDrawer = document.getElementById('previewDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerBody = document.getElementById('drawerBody');

  // 任务队列数据
  let tasks = [];
  let customSaveDir = null;

  // 格式对应关系
  const FORMAT_OPTIONS = {
    png: ['jpg', 'webp', 'avif', 'ico', 'pdf'],
    jpg: ['png', 'webp', 'avif', 'ico', 'pdf'],
    jpeg: ['png', 'webp', 'avif', 'ico', 'pdf'],
    webp: ['png', 'jpg', 'avif', 'ico', 'pdf'],
    avif: ['png', 'jpg', 'webp', 'pdf'],
    bmp: ['png', 'jpg', 'webp', 'pdf'],
    tiff: ['png', 'jpg', 'webp', 'pdf'],
    ico: ['png', 'jpg', 'webp'],
    svg: ['png', 'jpg', 'webp', 'pdf'],
    docx: ['pdf', 'markdown', 'html', 'txt'],
    doc: ['pdf', 'docx'],
    pdf: ['png', 'jpg', 'docx'],
    md: ['docx', 'pdf', 'html'],
    txt: ['docx', 'pdf']
  };

  // 仗助情绪状态机
  function setMascotState(state, customText = '') {
    mascotAvatar.classList.remove('converting');
    switch (state) {
      case 'idle':
        mascotEmoji.textContent = '💎';
        mascotSpeech.textContent = customText || '「把需要重组的文件拖进来吧！这可真是太 Great 了！」';
        break;
      case 'dragover':
        mascotEmoji.textContent = '👊';
        mascotSpeech.textContent = '「替身出击！准备进行原子级拆解与重构！」';
        break;
      case 'converting':
        mascotAvatar.classList.add('converting');
        mascotEmoji.textContent = '⚡';
        mascotSpeech.textContent = customText || '「DORARARARA! 疯狂钻石正在极速原子重组中！」';
        break;
      case 'success':
        mascotEmoji.textContent = '✨';
        mascotSpeech.textContent = customText || '「这可真是太 Great 了！所有文件已完美重构完毕！」';
        break;
      case 'error':
        mascotEmoji.textContent = '💥';
        mascotSpeech.textContent = customText || '「可恶！竟然遇到了阻碍，请检查文件格式！」';
        break;
    }
  }

  // 辅助函数：格式化大小
  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  // 辅助函数：获取扩展名
  function getExt(filePath) {
    return (filePath.split('.').pop() || '').toLowerCase();
  }

  // 添加文件到队列
  function addFiles(files) {
    for (const file of files) {
      const filePath = file.path || file.name;
      const ext = getExt(filePath);
      const availableTargets = FORMAT_OPTIONS[ext] || ['pdf'];
      
      // 检查是否已在队列
      if (tasks.some(t => t.path === filePath)) continue;

      tasks.push({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        file,
        name: file.name,
        path: filePath,
        size: file.size || 0,
        ext,
        availableTargets,
        target: availableTargets[0] || 'pdf',
        status: 'ready', // ready, converting, success, error
        outputPath: null,
        errorMsg: null
      });
    }

    renderTasks();
    setMascotState('idle', `「已装载 ${tasks.length} 个待重构文件！选择目标格式后点击转换即可！」`);
  }

  // 渲染任务列表
  function renderTasks() {
    taskList.innerHTML = '';
    taskCountEl.textContent = tasks.length;

    if (tasks.length === 0) {
      queueHeader.style.display = 'none';
      actionFooter.style.display = 'none';
      setMascotState('idle');
      return;
    }

    queueHeader.style.display = 'flex';
    actionFooter.style.display = 'flex';

    tasks.forEach((task, index) => {
      const item = document.createElement('div');
      item.className = 'task-item';

      const selectOptions = task.availableTargets
        .map(t => `<option value="${t}" ${t === task.target ? 'selected' : ''}>.${t.toUpperCase()}</option>`)
        .join('');

      let statusBadge = `<span class="task-status status-ready">待就绪</span>`;
      if (task.status === 'converting') {
        statusBadge = `<span class="task-status status-converting">⚡ 重构中...</span>`;
      } else if (task.status === 'success') {
        statusBadge = `<span class="task-status status-success">✓ 成功</span>`;
      } else if (task.status === 'error') {
        statusBadge = `<span class="task-status status-error" title="${task.errorMsg}">✗ 失败</span>`;
      }

      item.innerHTML = `
        <div class="task-info">
          <div class="file-badge">${task.ext}</div>
          <div class="file-detail">
            <div class="file-name" title="${task.path}">${task.name}</div>
            <div class="file-size">${formatSize(task.size)}</div>
          </div>
        </div>
        <div class="task-actions">
          <select class="select-box target-select" data-id="${task.id}" ${task.status === 'converting' ? 'disabled' : ''}>
            ${selectOptions}
          </select>
          ${statusBadge}
          ${task.status === 'success' ? `<button class="btn btn-outline btn-sm preview-btn" data-id="${task.id}">查看</button>` : ''}
          <button class="btn btn-ghost btn-sm remove-btn" data-id="${task.id}" ${task.status === 'converting' ? 'disabled' : ''}>&times;</button>
        </div>
      `;

      taskList.appendChild(item);
    });

    // 绑定删除与选择事件
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
      });
    });

    document.querySelectorAll('.target-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task) task.target = e.target.value;
      });
    });

    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task && task.outputPath) {
          openPreview(task);
        }
      });
    });
  }

  // 预览结果
  function openPreview(task) {
    drawerBody.innerHTML = `
      <div style="padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 12px;">
        <p style="font-size: 0.85rem; color: #a78bfa; margin-bottom: 4px;"><strong>原文件:</strong> ${task.name}</p>
        <p style="font-size: 0.85rem; color: #ec4899; word-break: break-all;"><strong>输出路径:</strong> ${task.outputPath}</p>
      </div>
      <button class="btn btn-primary btn-sm" id="openFileBtn" style="width: 100%; margin-bottom: 8px;">打开转换后文件</button>
      <button class="btn btn-outline btn-sm" id="openFolderBtn" style="width: 100%;">打开所在文件夹</button>
    `;

    document.getElementById('openFileBtn')?.addEventListener('click', () => {
      if (window.electronAPI?.openPath) window.electronAPI.openPath(task.outputPath);
    });
    document.getElementById('openFolderBtn')?.addEventListener('click', () => {
      if (window.electronAPI?.showItemInFolder) window.electronAPI.showItemInFolder(task.outputPath);
    });

    previewDrawer.classList.add('open');
  }

  closeDrawerBtn.addEventListener('click', () => {
    previewDrawer.classList.remove('open');
  });

  // 拖拽事件
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      fileInput.value = '';
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
    setMascotState('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
    setMascotState('idle');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  });

  // 批量修改目标
  batchTargetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    tasks.forEach(t => {
      if (t.availableTargets.includes(val)) {
        t.target = val;
      }
    });
    renderTasks();
  });

  // 清空全部
  clearAllBtn.addEventListener('click', () => {
    tasks = [];
    renderTasks();
  });

  // 更改输出目录
  changeSaveDirBtn.addEventListener('click', async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        customSaveDir = selected;
        savePathDisplay.textContent = selected;
      }
    }
  });

  // 开始转换
  startConvertBtn.addEventListener('click', async () => {
    if (tasks.length === 0) return;

    setMascotState('converting');
    startConvertBtn.disabled = true;
    footerStatusText.textContent = 'DORARARA! 疯狂钻石正在高速原子重组中...';

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'converting';
      renderTasks();

      try {
        if (window.electronAPI?.convertFile) {
          const res = await window.electronAPI.convertFile({
            inputPath: task.path,
            targetFormat: task.target,
            outputDir: customSaveDir
          });
          task.status = 'success';
          task.outputPath = res.outputPath;
          successCount++;
        } else {
          // 模拟延迟
          await new Promise(r => setTimeout(r, 800));
          task.status = 'success';
          task.outputPath = task.path.replace(/\.[^/.]+$/, `.${task.target}`);
          successCount++;
        }
      } catch (err) {
        task.status = 'error';
        task.errorMsg = err.message || '转换异常';
        failCount++;
      }

      renderTasks();
    }

    startConvertBtn.disabled = false;
    if (failCount === 0) {
      setMascotState('success', `「太棒了！共 ${successCount} 个文件全部完成原子重构！这可真是太 Great 了！」`);
      footerStatusText.textContent = `全部完成 (${successCount}/${tasks.length})`;
    } else {
      setMascotState('error', `「完成 ${successCount} 个，有 ${failCount} 个重组失败，请查看详情！」`);
      footerStatusText.textContent = `处理完毕 (成功: ${successCount}, 失败: ${failCount})`;
    }
  });
});
