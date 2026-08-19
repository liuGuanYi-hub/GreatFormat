// GreatFormat 渲染层逻辑 (东方仗助与疯狂钻石互动核心)
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
  const mascotImg = document.getElementById('mascotImg');
  const mascotSpeech = document.getElementById('mascotSpeech');
  const standStatusBadge = document.getElementById('standStatusBadge');
  const savePathDisplay = document.getElementById('savePathDisplay');
  const changeSaveDirBtn = document.getElementById('changeSaveDirBtn');
  const previewDrawer = document.getElementById('previewDrawer');
  const drawerTitle = document.getElementById('drawerTitle');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const drawerBody = document.getElementById('drawerBody');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIcon = document.getElementById('audioIcon');
  const audioText = document.getElementById('audioText');
  const mangaSfxContainer = document.getElementById('mangaSfxContainer');

  // 任务队列数据
  let tasks = [];
  let customSaveDir = null;
  let audioEnabled = true;

  // Web Audio 上下文 (用于合成动作音效)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  // 格式对应关系
  const FORMAT_OPTIONS = {
    png: ['pdf', 'jpg', 'webp', 'avif', 'ico'],
    jpg: ['pdf', 'png', 'webp', 'avif', 'ico'],
    jpeg: ['pdf', 'png', 'webp', 'avif', 'ico'],
    webp: ['pdf', 'png', 'jpg', 'avif', 'ico'],
    avif: ['pdf', 'png', 'jpg', 'webp'],
    bmp: ['pdf', 'png', 'jpg', 'webp'],
    tiff: ['pdf', 'png', 'jpg', 'webp'],
    ico: ['png', 'jpg', 'webp'],
    svg: ['png', 'jpg', 'webp', 'pdf'],
    docx: ['pdf', 'markdown', 'html', 'txt'],
    doc: ['pdf', 'docx'],
    pdf: ['png', 'jpg', 'docx'],
    md: ['docx', 'pdf', 'html'],
    txt: ['docx', 'pdf']
  };

  // JOJO 音效与语音合成系统
  function playJojoSound(type) {
    if (!audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      if (type === 'punch') {
        // 替身连打打击音效
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'victory') {
        // Great! 黄金精神闪耀和弦
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.6);
        });
      } else if (type === 'error') {
        // 失败音效
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('[Audio] SFX error:', e);
    }
  }

  // 语音合成朗读台词
  function speakLine(text) {
    if (!audioEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.1;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('[Speech] Synthesis error:', e);
    }
  }

  // 漫画拟声词特效生成
  function spawnMangaSfx(text) {
    const sfx = document.createElement('div');
    sfx.className = 'manga-sfx';
    sfx.textContent = text;
    sfx.style.left = Math.random() * 60 + 20 + '%';
    sfx.style.top = Math.random() * 50 + 25 + '%';
    sfx.style.fontSize = Math.random() * 16 + 28 + 'px';
    mangaSfxContainer.appendChild(sfx);
    setTimeout(() => sfx.remove(), 1400);
  }

  // 东方仗助情绪与立绘状态机
  function setMascotState(state, customText = '') {
    mascotAvatar.classList.remove('converting');
    switch (state) {
      case 'idle':
        mascotImg.src = '../assets/josuke_idle.png';
        standStatusBadge.textContent = '待命中';
        standStatusBadge.style.background = 'rgba(139, 92, 246, 0.3)';
        mascotSpeech.textContent = customText || '「把需要重组的文件拖进来吧！这可真是太 Great 了！」';
        break;
      case 'dragover':
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = '替身出击';
        standStatusBadge.style.background = 'rgba(236, 72, 153, 0.5)';
        mascotSpeech.textContent = '「替身出击！准备进行原子级拆解与重构！」';
        spawnMangaSfx('ゴゴゴゴ');
        break;
      case 'converting':
        mascotAvatar.classList.add('converting');
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = 'DORARARA!';
        standStatusBadge.style.background = 'rgba(251, 191, 36, 0.6)';
        mascotSpeech.textContent = customText || '「DORARARARA! 疯狂钻石正在极速原子重组中！」';
        speakLine('DORARARARA! 疯狂钻石，开始原子重组！');
        break;
      case 'success':
        mascotImg.src = '../assets/josuke_success.png';
        standStatusBadge.textContent = 'Great!';
        standStatusBadge.style.background = 'rgba(16, 185, 129, 0.5)';
        mascotSpeech.textContent = customText || '「这可真是太 Great 了！所有文件已完美重构完毕！」';
        playJojoSound('victory');
        speakLine('这可真是太 Great 了！');
        spawnMangaSfx('GREAT!');
        break;
      case 'error':
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = '重组受阻';
        standStatusBadge.style.background = 'rgba(239, 68, 68, 0.6)';
        mascotSpeech.textContent = customText || '「可恶！竟然遇到了阻碍，点击失败红色标签查看原因！」';
        playJojoSound('error');
        speakLine('可恶！重组遇到了阻碍！');
        spawnMangaSfx('ドドドド');
        break;
    }
  }

  // 语音开关
  audioToggleBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      audioIcon.textContent = '🔊';
      audioText.textContent = 'JOJO 语音: 开启';
      audioToggleBtn.classList.remove('muted');
      speakLine('语音已开启！');
    } else {
      audioIcon.textContent = '🔇';
      audioText.textContent = 'JOJO 语音: 关闭';
      audioToggleBtn.classList.add('muted');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  });

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

  // 获取文件真实路径
  function resolveFilePath(file) {
    if (window.electronAPI?.getPathForFile) {
      const p = window.electronAPI.getPathForFile(file);
      if (p) return p;
    }
    return file.path || file.name;
  }

  // 添加文件到队列
  function addFiles(files) {
    let addedCount = 0;
    for (const file of files) {
      const realPath = resolveFilePath(file);
      const ext = getExt(realPath || file.name);
      const availableTargets = FORMAT_OPTIONS[ext] || ['pdf'];
      
      // 检查是否已在队列
      if (tasks.some(t => t.path === realPath)) continue;

      tasks.push({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        file,
        name: file.name,
        path: realPath,
        size: file.size || 0,
        ext,
        availableTargets,
        target: availableTargets[0] || 'pdf',
        status: 'ready',
        outputPath: null,
        errorMsg: null,
        errorStack: null
      });
      addedCount++;
    }

    if (addedCount > 0) {
      renderTasks();
      setMascotState('idle', `「已装载 ${tasks.length} 个待重构文件！选择目标格式后点击转换即可！」`);
    }
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

    tasks.forEach((task) => {
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
        statusBadge = `<span class="task-status status-error error-badge-btn" data-id="${task.id}" title="点击查看详细失败原因">✗ 失败 (点击排查)</span>`;
      }

      item.innerHTML = `
        <div class="task-info">
          <div class="file-badge">${task.ext}</div>
          <div class="file-detail">
            <div class="file-name" title="${task.path}">${task.name}</div>
            <div class="file-size">${formatSize(task.size)} · <span style="font-family: monospace; opacity: 0.8;">${task.path}</span></div>
          </div>
        </div>
        <div class="task-actions">
          <select class="select-box target-select" data-id="${task.id}" ${task.status === 'converting' ? 'disabled' : ''}>
            ${selectOptions}
          </select>
          ${statusBadge}
          ${task.status === 'success' ? `<button class="btn btn-outline btn-sm preview-btn" data-id="${task.id}">查看结果</button>` : ''}
          <button class="btn btn-ghost btn-sm remove-btn" data-id="${task.id}" ${task.status === 'converting' ? 'disabled' : ''}>&times;</button>
        </div>
      `;

      taskList.appendChild(item);
    });

    // 绑定事件
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
        if (task && task.outputPath) openPreview(task);
      });
    });

    document.querySelectorAll('.error-badge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task) openErrorDrawer(task);
      });
    });
  }

  // 打开成功预览
  function openPreview(task) {
    drawerTitle.textContent = '重组结果预览';
    drawerBody.innerHTML = `
      <div style="padding: 14px; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 14px; border: 1px solid rgba(139,92,246,0.3);">
        <p style="font-size: 0.85rem; color: #a78bfa; margin-bottom: 6px;"><strong>原文件:</strong> ${task.name}</p>
        <p style="font-size: 0.85rem; color: #ec4899; word-break: break-all; margin-bottom: 6px;"><strong>输出路径:</strong> ${task.outputPath}</p>
        <p style="font-size: 0.78rem; color: #10b981;">✓ 状态: 原子重构成功 (100% 保真还原)</p>
      </div>
      <button class="btn btn-primary btn-sm" id="openFileBtn" style="width: 100%; margin-bottom: 10px;">打开转换后文件</button>
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

  // 打开错误详情排查
  function openErrorDrawer(task) {
    drawerTitle.textContent = '💥 错误排查详情';
    drawerBody.innerHTML = `
      <div style="padding: 14px; background: rgba(239,68,68,0.15); border-radius: 8px; margin-bottom: 14px; border: 1px solid rgba(239,68,68,0.4);">
        <p style="font-size: 0.85rem; color: #fca5a5; margin-bottom: 6px;"><strong>目标文件:</strong> ${task.name}</p>
        <p style="font-size: 0.85rem; color: #f87171; word-break: break-all; margin-bottom: 6px;"><strong>源路径:</strong> ${task.path}</p>
        <p style="font-size: 0.88rem; color: #ef4444; font-weight: bold; margin-top: 8px;"><strong>错误原因:</strong></p>
        <pre style="margin-top: 6px; padding: 10px; background: #0c0a17; border-radius: 6px; color: #fca5a5; font-size: 0.78rem; overflow-x: auto; white-space: pre-wrap;">${task.errorMsg || '未捕获到具体异常'}</pre>
        ${task.errorStack ? `<pre style="margin-top: 6px; padding: 10px; background: #0c0a17; border-radius: 6px; color: #94a3b8; font-size: 0.72rem; overflow-x: auto; max-height: 150px;">${task.errorStack}</pre>` : ''}
      </div>
      <div style="font-size: 0.8rem; color: #cbd5e1; line-height: 1.5; padding: 0 4px;">
        <strong>常见排查建议：</strong><br>
        1. 确保源文件没有被其他程序独占占用。<br>
        2. 如果是 Word 转换，请确保电脑已安装 Microsoft Word / WPS 或 LibreOffice。<br>
        3. 如需指定保存位置，可在顶部点击【更改】选择保存目录。
      </div>
    `;

    previewDrawer.classList.add('open');
  }

  closeDrawerBtn.addEventListener('click', () => {
    previewDrawer.classList.remove('open');
  });

  // 拖拽与文件选取
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

  // 开始转换 (DORARARA!)
  startConvertBtn.addEventListener('click', async () => {
    if (tasks.length === 0) return;

    setMascotState('converting');
    startConvertBtn.disabled = true;
    footerStatusText.textContent = 'DORARARA! 疯狂钻石正在高速原子重组中...';

    // 周期性产生打击音效与拟声词
    const sfxInterval = setInterval(() => {
      playJojoSound('punch');
      spawnMangaSfx(Math.random() > 0.5 ? 'DORA!' : 'DORARARA!');
    }, 280);

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

          if (res.success) {
            task.status = 'success';
            task.outputPath = res.outputPath;
            successCount++;
          } else {
            task.status = 'error';
            task.errorMsg = res.error || '转换异常';
            task.errorStack = res.stack;
            failCount++;
          }
        } else {
          // 浏览器调试模式模拟
          await new Promise(r => setTimeout(r, 600));
          task.status = 'success';
          task.outputPath = task.path.replace(/\.[^/.]+$/, `.${task.target}`);
          successCount++;
        }
      } catch (err) {
        task.status = 'error';
        task.errorMsg = err.message || '转换异常';
        task.errorStack = err.stack;
        failCount++;
      }

      renderTasks();
    }

    clearInterval(sfxInterval);
    startConvertBtn.disabled = false;

    if (failCount === 0) {
      setMascotState('success', `「太棒了！共 ${successCount} 个文件全部完成原子重构！这可真是太 Great 了！」`);
      footerStatusText.textContent = `全部完成 (${successCount}/${tasks.length})`;
    } else {
      setMascotState('error', `「完成 ${successCount} 个，有 ${failCount} 个重组失败！点击【✗ 失败】查看详细排查信息！」`);
      footerStatusText.textContent = `处理完毕 (成功: ${successCount}, 失败: ${failCount})`;
    }
  });
});
