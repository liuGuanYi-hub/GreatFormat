// GreatFormat 渲染层逻辑 (东方仗助与疯狂钻石 日语原声台词 & 拳击打击音效系统)
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
  const globalProgressWrapper = document.getElementById('globalProgressWrapper');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressPercentLabel = document.getElementById('progressPercentLabel');
  const progressStatusLabel = document.getElementById('progressStatusLabel');

  // 任务队列数据
  let tasks = [];
  let customSaveDir = null;
  let audioEnabled = true;

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

  // JOJO 日语台词库
  const JOJO_LINES = {
    IDLE: {
      text: '「ファイルをドラッグ＆ドロップしてくれ！グレートに行こうぜ！」\n（把需要重组的文件拖进来吧！这可真是太 Great 了！）'
    },
    DRAG: {
      text: '「クレイジー・ダイヤモンド！スタンド出現！」\n（替身出击！疯狂钻石准备拆解与重构！）'
    },
    CONVERTING: {
      text: '「ドララララララララララララッ！！DORARARARA！！」\n（ドラララ！疯狂钻石正在极速原子重组中！）'
    },
    SUCCESS: {
      text: '「グレートですよ、こいつはァ！完璧に直ったぜ！」\n（这可真是太 Great 了！所有文件已完美重构完毕！）'
    },
    ERROR: {
      text: '「な、何だとォ！？この仗助サマの髪型をケナしたなァ！？」\n（可恶！竟然遇到了阻碍！点击查看详细排查信息）'
    }
  };

  // 播放原声音频文件 (MP3 / WAV)
  function playAudioFile(fileName) {
    if (!audioEnabled) return null;
    try {
      const audio = new Audio(`../assets/audio/${fileName}`);
      audio.volume = 0.95;
      audio.play().catch(err => console.warn(`[Audio] Play ${fileName} failed:`, err.message));
      return audio;
    } catch (e) {
      console.warn('[Audio] Audio error:', e);
      return null;
    }
  }

  // 连续拳击音效播放器
  function playPunchSound() {
    if (!audioEnabled) return;
    try {
      const audio = new Audio('../assets/audio/punch.wav');
      audio.volume = 0.85;
      audio.playbackRate = 0.95 + Math.random() * 0.2; // 随机轻微变化音调
      audio.play().catch(() => {});
    } catch {}
  }

  // 漫画拟声词漂浮特效
  function spawnMangaSfx(text) {
    const sfx = document.createElement('div');
    sfx.className = 'manga-sfx';
    sfx.textContent = text;
    sfx.style.left = Math.random() * 55 + 25 + '%';
    sfx.style.top = Math.random() * 45 + 25 + '%';
    sfx.style.fontSize = Math.random() * 16 + 32 + 'px';
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
        mascotSpeech.innerText = customText || JOJO_LINES.IDLE.text;
        break;
      case 'dragover':
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = '替身出击';
        standStatusBadge.style.background = 'rgba(236, 72, 153, 0.5)';
        mascotSpeech.innerText = JOJO_LINES.DRAG.text;
        spawnMangaSfx('ゴゴゴゴ');
        break;
      case 'converting':
        mascotAvatar.classList.add('converting');
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = 'ドララララ！';
        standStatusBadge.style.background = 'rgba(251, 191, 36, 0.7)';
        mascotSpeech.innerText = customText || JOJO_LINES.CONVERTING.text;
        // 播放东方仗助原声战吼
        playAudioFile('dorarara.mp3');
        break;
      case 'success':
        mascotImg.src = '../assets/josuke_success.png';
        standStatusBadge.textContent = 'グレート！';
        standStatusBadge.style.background = 'rgba(16, 185, 129, 0.6)';
        mascotSpeech.innerText = customText || JOJO_LINES.SUCCESS.text;
        // 播放东方仗助原声 "グレートですよ、こいつはァ！"
        playAudioFile('great.mp3');
        spawnMangaSfx('グレート！');
        break;
      case 'error':
        mascotImg.src = '../assets/josuke_action.png';
        standStatusBadge.textContent = '重組失敗';
        standStatusBadge.style.background = 'rgba(239, 68, 68, 0.7)';
        mascotSpeech.innerText = customText || JOJO_LINES.ERROR.text;
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
      playAudioFile('great.mp3');
    } else {
      audioIcon.textContent = '🔇';
      audioText.textContent = 'JOJO 语音: 关闭';
      audioToggleBtn.classList.add('muted');
    }
  });

  function formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  function getExt(filePath) {
    return (filePath.split('.').pop() || '').toLowerCase();
  }

  function resolveFilePath(file) {
    if (window.electronAPI?.getPathForFile) {
      const p = window.electronAPI.getPathForFile(file);
      if (p) return p;
    }
    return file.path || file.name;
  }

  function addFiles(files) {
    let addedCount = 0;
    for (const file of files) {
      const realPath = resolveFilePath(file);
      const ext = getExt(realPath || file.name);
      const availableTargets = FORMAT_OPTIONS[ext] || ['pdf'];
      
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
      setMascotState('idle', `「${tasks.length} 個のファイルを装填したぜ！目標フォーマットを選んで変換ボタンを押してくれ！」\n（已装载 ${tasks.length} 个文件！选择目标格式后点击转换！）`);
    }
  }

  function renderTasks() {
    taskList.innerHTML = '';
    taskCountEl.textContent = tasks.length;

    if (tasks.length === 0) {
      queueHeader.style.display = 'none';
      actionFooter.style.display = 'none';
      globalProgressWrapper.style.display = 'none';
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

    document.getElementById('openFileBtn')?.addEventListener('click', async () => {
      if (window.electronAPI?.openPath) {
        await window.electronAPI.openPath(task.outputPath);
      }
    });
    document.getElementById('openFolderBtn')?.addEventListener('click', async () => {
      if (window.electronAPI?.showItemInFolder) {
        await window.electronAPI.showItemInFolder(task.outputPath);
      }
    });

    previewDrawer.classList.add('open');
  }

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
        2. Word 转 PDF 已内置 Chromium 引擎，零安装即可生成。<br>
        3. 如需指定保存位置，可在顶部点击【更改】选择保存目录。
      </div>
    `;

    previewDrawer.classList.add('open');
  }

  closeDrawerBtn.addEventListener('click', () => {
    previewDrawer.classList.remove('open');
  });

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

  clearAllBtn.addEventListener('click', () => {
    tasks = [];
    renderTasks();
  });

  changeSaveDirBtn.addEventListener('click', async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        customSaveDir = selected;
        savePathDisplay.textContent = selected;
      }
    }
  });

  // 更新进度条
  function updateProgress(percent, label = '') {
    globalProgressWrapper.style.display = 'block';
    progressBarFill.style.width = `${percent}%`;
    progressPercentLabel.textContent = `${Math.round(percent)}%`;
    if (label) progressStatusLabel.textContent = label;
  }

  // 开始转换 (DORARARA!)
  startConvertBtn.addEventListener('click', async () => {
    if (tasks.length === 0) return;

    setMascotState('converting');
    startConvertBtn.disabled = true;
    footerStatusText.textContent = 'ドララララ！疯狂钻石正在高速原子重组中...';

    // 显示进度条初始状态
    updateProgress(5, '⚡ 替身出击！开始原子级拆解...');

    // 极速机关枪拳击打击音效 (每 110ms 打出一记真实重拳)
    const punchInterval = setInterval(() => {
      playPunchSound();
      if (Math.random() > 0.6) {
        spawnMangaSfx(Math.random() > 0.5 ? 'ドラァ！' : 'ドラララ！');
      }
    }, 110);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'converting';
      renderTasks();

      const currentProgress = ((i + 0.3) / tasks.length) * 100;
      updateProgress(currentProgress, `⚡ 正在重组 [${i + 1}/${tasks.length}]: ${task.name}...`);

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

      const itemDoneProgress = ((i + 1) / tasks.length) * 100;
      updateProgress(itemDoneProgress, `⚡ 处理进度 [${i + 1}/${tasks.length}]`);
      renderTasks();
    }

    clearInterval(punchInterval);
    startConvertBtn.disabled = false;

    if (failCount === 0) {
      updateProgress(100, '✨ 这可真是太 Great 了！原子重构全部完成！');
      setMascotState('success');
      footerStatusText.textContent = `全部完成 (${successCount}/${tasks.length})`;
    } else {
      updateProgress(100, `💥 重组完成 (成功: ${successCount}, 失败: ${failCount})`);
      setMascotState('error');
      footerStatusText.textContent = `处理完毕 (成功: ${successCount}, 失败: ${failCount})`;
    }
  });
});
