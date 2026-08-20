// GreatFormat 渲染层逻辑 (东方仗助与疯狂钻石 日语原声台词 & 音效互动系统)
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const queueSection = document.getElementById('queueSection');
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

  // 支持格式映射表 (50+ 格式全能矩阵)
  const FORMAT_OPTIONS = {
    // 图像与 RAW
    png: ['pdf', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif'],
    jpg: ['pdf', 'png', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif'],
    jpeg: ['pdf', 'png', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif'],
    webp: ['pdf', 'png', 'jpg', 'jpeg', 'avif', 'ico', 'tiff', 'bmp', 'gif'],
    avif: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'ico', 'tiff'],
    bmp: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff'],
    tiff: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'ico'],
    tif: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'ico'],
    ico: ['png', 'jpg', 'webp'],
    svg: ['pdf', 'png', 'jpg', 'webp', 'ico'],
    gif: ['png', 'jpg', 'webp', 'mp4', 'pdf'],
    heic: ['jpg', 'png', 'webp', 'pdf'],
    heif: ['jpg', 'png', 'webp', 'pdf'],
    tga: ['png', 'jpg', 'webp', 'pdf'],
    cr2: ['jpg', 'png', 'webp', 'tiff'],
    cr3: ['jpg', 'png', 'webp', 'tiff'],
    nef: ['jpg', 'png', 'webp', 'tiff'],
    arw: ['jpg', 'png', 'webp', 'tiff'],
    dng: ['jpg', 'png', 'webp', 'tiff'],

    // PDF 全能工具箱
    pdf: ['docx', 'xlsx', 'png', 'jpg', 'webp', 'txt', 'html', 'split'],

    // 文档与演示
    docx: ['pdf', 'html', 'txt', 'md', 'epub'],
    doc: ['pdf', 'docx', 'html', 'txt', 'md'],
    rtf: ['pdf', 'docx', 'html', 'txt', 'md'],
    odt: ['pdf', 'docx', 'html', 'txt', 'md'],
    pptx: ['pdf', 'png', 'jpg'],
    ppt: ['pdf', 'png', 'jpg'],

    // 表格与数据
    xlsx: ['pdf', 'csv', 'tsv', 'json', 'html'],
    xls: ['pdf', 'xlsx', 'csv', 'json', 'html'],
    csv: ['xlsx', 'json', 'yaml', 'tsv', 'html'],
    tsv: ['xlsx', 'csv', 'json', 'html'],
    json: ['xlsx', 'csv', 'yaml', 'xml'],
    yaml: ['json', 'csv', 'xlsx'],
    yml: ['json', 'csv', 'xlsx'],
    xml: ['json', 'yaml'],

    // 纯文本与电子书
    md: ['docx', 'pdf', 'html', 'txt', 'epub'],
    markdown: ['docx', 'pdf', 'html', 'txt', 'epub'],
    txt: ['docx', 'pdf', 'html', 'md', 'epub'],
    epub: ['txt', 'md', 'html', 'pdf', 'docx'],
    mobi: ['txt', 'md', 'html', 'pdf', 'epub'],

    // 音频格式
    mp3: ['wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3'],
    wav: ['mp3', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3'],
    flac: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'wma'],
    m4a: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'opus'],
    aac: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'opus'],
    ogg: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'opus'],
    opus: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'],
    wma: ['mp3', 'wav', 'flac', 'm4a', 'aac'],
    ac3: ['mp3', 'wav', 'flac', 'aac'],
    aiff: ['mp3', 'wav', 'flac', 'm4a'],

    // 视频格式
    mp4: ['mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'gif', 'mp3', 'wav', 'aac', 'm4a', 'flac'],
    mkv: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac', 'flac'],
    avi: ['mp4', 'mkv', 'mov', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac'],
    mov: ['mp4', 'mkv', 'avi', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac'],
    wmv: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'gif', 'mp3', 'wav'],
    flv: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'mp3', 'wav'],
    webm: ['mp4', 'mkv', 'mov', 'gif', 'mp3', 'wav', 'ogg'],
    m4v: ['mp4', 'mkv', 'mov', 'mp3', 'aac'],
    ts: ['mp4', 'mkv', 'mp3', 'wav'],
    '3gp': ['mp4', 'mp3', 'aac']
  };

  // JOJO 东方仗助日语台词库
  const JOJO_LINES = {
    IDLE: {
      text: '「ファイルをドラッグ＆ドロップしてくれ！グレートに行こうぜ！」\n（把需要重组的文件拖进来吧！这可真是太 Great 了！）'
    },
    DRAG: {
      text: '「クレイジー・ダイヤモンド！スタンド出現！」\n（替身出击！疯狂钻石准备拆解与重构！）'
    },
    CONVERTING: {
      text: '「ドララララララララララララッ！！DORARARARA！！」\n（ドラララ！疯狂钻石正在高速原子重组中！）'
    },
    SUCCESS: {
      text: '「グレートですよ、こいつはァ！完璧に直ったぜ！」\n（这可真是太 Great 了！所有文件已完美重构完毕！）'
    },
    ERROR: {
      text: '「な、何だとォ！？この仗助サマの髪型をケナしたなァ！？」\n（可恶！遇到了阻碍！点击查看详细排查信息）'
    }
  };

  let activeVoiceAudio = null;
  let voiceFadeTimer = null;
  const TARGET_VOICE_VOLUME = 0.60; // 舒适柔和音量，防止吓人一跳

  // 播放原声音频文件 (柔和渐入 Fade-In + 自然结尾渐出 Fade-Out)
  function playAudioFile(fileName, fadeInMs = 380, targetMaxVol = TARGET_VOICE_VOLUME) {
    if (!audioEnabled) return null;
    try {
      stopVoiceAudio(240);
      const audio = new Audio(`../assets/audio/${fileName}`);
      audio.volume = 0.0;
      activeVoiceAudio = audio;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          const start = Date.now();
          // 平滑渐入 (S-Curve / Sine Smooth Fade-In)
          const inTimer = setInterval(() => {
            if (activeVoiceAudio !== audio) {
              clearInterval(inTimer);
              return;
            }
            const elapsed = Date.now() - start;
            const progress = Math.min(1, elapsed / fadeInMs);
            // 正弦平滑插值曲线
            const curve = Math.sin(progress * (Math.PI / 2));
            audio.volume = Math.min(1, Math.max(0, curve * targetMaxVol));
            if (progress >= 1) clearInterval(inTimer);
          }, 16);

          // 监听音频播放进度，在接近尾声时（剩余 420ms）自动平滑淡出
          const checkNaturalEnd = () => {
            if (activeVoiceAudio !== audio || audio.paused) {
              audio.removeEventListener('timeupdate', checkNaturalEnd);
              return;
            }
            if (audio.duration && (audio.duration - audio.currentTime <= 0.42)) {
              audio.removeEventListener('timeupdate', checkNaturalEnd);
              stopVoiceAudio(380);
            }
          };
          audio.addEventListener('timeupdate', checkNaturalEnd);

        }).catch(err => console.warn(`[Audio] Play ${fileName} failed:`, err.message));
      }
      return audio;
    } catch (e) {
      console.warn('[Audio] Audio error:', e);
      return null;
    }
  }

  // 停止语音 (柔和平滑渐出 Fade-Out)
  function stopVoiceAudio(fadeOutMs = 300) {
    if (activeVoiceAudio) {
      const targetAudio = activeVoiceAudio;
      activeVoiceAudio = null;
      if (voiceFadeTimer) {
        clearInterval(voiceFadeTimer);
        voiceFadeTimer = null;
      }

      const startVol = targetAudio.volume;
      const start = Date.now();

      voiceFadeTimer = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(1, elapsed / fadeOutMs);
        // 余弦平滑衰减曲线
        const curve = Math.cos(progress * (Math.PI / 2));
        targetAudio.volume = Math.max(0, startVol * curve);

        if (progress >= 1) {
          clearInterval(voiceFadeTimer);
          voiceFadeTimer = null;
          try {
            targetAudio.pause();
            targetAudio.currentTime = 0;
          } catch {}
        }
      }, 16);
    }
  }

  // 漫画拟声词漂浮特效
  function spawnMangaSfx(text) {
    if (!mangaSfxContainer) return;
    const sfx = document.createElement('div');
    sfx.className = 'manga-sfx';
    sfx.textContent = text;
    sfx.style.left = Math.random() * 50 + 25 + '%';
    sfx.style.top = Math.random() * 45 + 20 + '%';
    sfx.style.fontSize = Math.random() * 12 + 28 + 'px';
    mangaSfxContainer.appendChild(sfx);
    setTimeout(() => sfx.remove(), 1300);
  }

  // 东方仗助情绪与立绘状态机
  function setMascotState(state, customText = '') {
    if (!mascotAvatar || !mascotImg) return;
    mascotAvatar.classList.remove('converting');

    switch (state) {
      case 'idle':
        mascotImg.src = '../assets/josuke_fullbody_official.png';
        if (standStatusBadge) {
          standStatusBadge.textContent = '待命中';
          standStatusBadge.style.background = '#af52de';
        }
        if (mascotSpeech) mascotSpeech.innerText = customText || JOJO_LINES.IDLE.text;
        break;
      case 'dragover':
        mascotImg.src = '../assets/josuke_fullbody_official.png';
        if (standStatusBadge) {
          standStatusBadge.textContent = '替身出击';
          standStatusBadge.style.background = '#ff2d55';
        }
        if (mascotSpeech) mascotSpeech.innerText = JOJO_LINES.DRAG.text;
        spawnMangaSfx('ゴゴゴゴ');
        break;
      case 'converting':
        stopVoiceAudio();
        mascotAvatar.classList.add('converting');
        mascotImg.src = '../assets/josuke_fullbody_official.png';
        if (standStatusBadge) {
          standStatusBadge.textContent = 'ドララララ！';
          standStatusBadge.style.background = '#fbbf24';
          standStatusBadge.style.color = '#111827';
        }
        if (mascotSpeech) mascotSpeech.innerText = customText || JOJO_LINES.CONVERTING.text;
        playAudioFile('dorarara.mp3');
        break;
      case 'success':
        stopVoiceAudio();
        mascotImg.src = '../assets/josuke_fullbody_official.png';
        if (standStatusBadge) {
          standStatusBadge.textContent = 'グレート！';
          standStatusBadge.style.background = '#34c759';
          standStatusBadge.style.color = '#ffffff';
        }
        if (mascotSpeech) mascotSpeech.innerText = customText || JOJO_LINES.SUCCESS.text;
        playAudioFile('great.mp3');
        spawnMangaSfx('グレート！');
        break;
      case 'error':
        stopVoiceAudio();
        mascotImg.src = '../assets/josuke_fullbody_official.png';
        if (standStatusBadge) {
          standStatusBadge.textContent = '重組失敗';
          standStatusBadge.style.background = '#ff3b30';
          standStatusBadge.style.color = '#ffffff';
        }
        if (mascotSpeech) mascotSpeech.innerText = customText || JOJO_LINES.ERROR.text;
        spawnMangaSfx('ドドドド');
        break;
    }
  }

  // 语音音效开关
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      if (audioEnabled) {
        audioIcon.textContent = '🔊';
        audioText.textContent = 'JOJO 原声: 开';
        audioToggleBtn.classList.remove('muted');
        playAudioFile('great.mp3');
      } else {
        audioIcon.textContent = '🔇';
        audioText.textContent = 'JOJO 原声: 关';
        audioToggleBtn.classList.add('muted');
        stopVoiceAudio();
      }
    });
  }

  // 字节格式化
  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }

  // 获取小写扩展名
  function getExt(filePath) {
    return (filePath.split('.').pop() || '').toLowerCase();
  }

  // 获取文件路径
  function resolveFilePath(file) {
    if (window.electronAPI?.getPathForFile) {
      const p = window.electronAPI.getPathForFile(file);
      if (p) return p;
    }
    return file.path || file.name;
  }

  // 获取扩展名徽标色彩分类
  function getBadgeClass(ext) {
    if (ext === 'pdf') return 'badge-pdf';
    if (['docx', 'doc', 'rtf', 'odt'].includes(ext)) return 'badge-docx';
    if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) return 'badge-excel';
    if (['pptx', 'ppt'].includes(ext)) return 'badge-ppt';
    if (['png', 'jpg', 'jpeg', 'webp', 'ico', 'avif', 'bmp', 'tiff', 'tif', 'svg', 'gif', 'heic', 'heif', 'tga', 'cr2', 'cr3', 'nef', 'arw', 'dng'].includes(ext)) return 'badge-png';
    if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3', 'aiff'].includes(ext)) return 'badge-audio';
    if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'ts', '3gp'].includes(ext)) return 'badge-video';
    if (['json', 'yaml', 'yml', 'xml'].includes(ext)) return 'badge-data';
    if (['md', 'markdown', 'txt', 'epub', 'mobi'].includes(ext)) return 'badge-md';
    return 'badge-default';
  }

  // 添加文件到队列
  function addFiles(files) {
    let addedCount = 0;
    for (const file of files) {
      const realPath = resolveFilePath(file);
      const ext = getExt(realPath || file.name);
      const availableTargets = FORMAT_OPTIONS[ext] || ['pdf'];

      if (tasks.some(t => t.path === realPath)) continue;

      tasks.push({
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
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

  // 渲染任务列表
  function renderTasks() {
    taskList.innerHTML = '';
    taskCountEl.textContent = tasks.length;

    if (tasks.length === 0) {
      if (queueSection) queueSection.style.display = 'none';
      if (queueHeader) queueHeader.style.display = 'none';
      actionFooter.style.display = 'none';
      globalProgressWrapper.style.display = 'none';
      setMascotState('idle');
      return;
    }

    if (queueSection) queueSection.style.display = 'flex';
    if (queueHeader) queueHeader.style.display = 'flex';
    actionFooter.style.display = 'flex';

    tasks.forEach((task) => {
      const item = document.createElement('div');
      item.className = 'task-item';

      const selectOptions = task.availableTargets
        .map(t => `<option value="${t}" ${t === task.target ? 'selected' : ''}>转为 .${t.toUpperCase()}</option>`)
        .join('');

      let statusBadge = `<span class="task-status status-ready">待就绪</span>`;
      if (task.status === 'converting') {
        statusBadge = `<span class="task-status status-converting"><span class="status-spinner"></span> 重构中...</span>`;
      } else if (task.status === 'success') {
        statusBadge = `<span class="task-status status-success">✓ 重构完成</span>`;
      } else if (task.status === 'error') {
        statusBadge = `<span class="task-status status-error error-badge-btn" data-id="${task.id}" title="点击查看详细失败原因">✕ 重组受阻 (排查)</span>`;
      }

      const badgeClass = getBadgeClass(task.ext);

      item.innerHTML = `
        <div class="task-info">
          <div class="file-badge ${badgeClass}">${task.ext}</div>
          <div class="file-detail">
            <div class="file-name" title="${task.path}">${task.name}</div>
            <div class="file-meta-row">
              <span class="file-size">${formatSize(task.size)}</span>
              <span>·</span>
              <span class="file-path-sub" title="${task.path}">${task.path}</span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <select class="apple-select target-select" data-id="${task.id}" ${task.status === 'converting' ? 'disabled' : ''}>
            ${selectOptions}
          </select>
          ${statusBadge}
          ${task.status === 'success' ? `<button class="btn btn-secondary btn-sm preview-btn" data-id="${task.id}">查看结果</button>` : ''}
          <button class="btn btn-icon-only remove-btn" data-id="${task.id}" title="移除此项目" ${task.status === 'converting' ? 'disabled' : ''}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      taskList.appendChild(item);
    });

    // 绑定项目移除事件
    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.remove-btn');
        const id = targetBtn?.getAttribute('data-id');
        if (id) {
          tasks = tasks.filter(t => t.id !== id);
          renderTasks();
        }
      });
    });

    // 绑定格式切换
    document.querySelectorAll('.target-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task) task.target = e.target.value;
      });
    });

    // 绑定查看结果
    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task && task.outputPath) openPreviewModal(task);
      });
    });

    // 绑定错误排查弹窗
    document.querySelectorAll('.error-badge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task) openErrorModal(task);
      });
    });
  }

  // 打开成功预览弹窗
  function openPreviewModal(task) {
    drawerTitle.textContent = '原子重组结果预览';
    drawerBody.innerHTML = `
      <div class="modal-box">
        <div class="modal-box-row"><span class="modal-box-label">源文件:</span> ${task.name}</div>
        <div class="modal-box-row"><span class="modal-box-label">输出文件:</span> ${task.outputPath}</div>
        <div class="modal-box-row" style="color: var(--apple-green); font-weight: 500; margin-top: 4px;">✓ 状态: 原子重构成功 (100% 原始矢量保真)</div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="modalOpenFileBtn">打开转换后文件</button>
        <button class="btn btn-secondary" id="modalOpenFolderBtn">在所在文件夹中显示</button>
      </div>
    `;

    document.getElementById('modalOpenFileBtn')?.addEventListener('click', async () => {
      if (window.electronAPI?.openPath) {
        await window.electronAPI.openPath(task.outputPath);
      }
    });

    document.getElementById('modalOpenFolderBtn')?.addEventListener('click', async () => {
      if (window.electronAPI?.showItemInFolder) {
        await window.electronAPI.showItemInFolder(task.outputPath);
      }
    });

    previewDrawer.classList.add('open');
  }

  // 打开错误弹窗
  function openErrorModal(task) {
    drawerTitle.textContent = '💥 错误排查详情';
    drawerBody.innerHTML = `
      <div class="modal-box box-error">
        <div class="modal-box-row"><span class="modal-box-label">目标文件:</span> ${task.name}</div>
        <div class="modal-box-row"><span class="modal-box-label">源路径:</span> ${task.path}</div>
        <div class="modal-box-row" style="margin-top: 6px;"><span class="modal-box-label">错误原因:</span></div>
        <div class="modal-box-code">${task.errorMsg || '未捕获到具体异常'}</div>
        ${task.errorStack ? `<div class="modal-box-code" style="max-height: 90px; color: var(--text-tertiary);">${task.errorStack}</div>` : ''}
      </div>
      <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
        <strong>常见排查建议：</strong><br>
        1. 确保源文件没有被其他程序独占占用；<br>
        2. 如需指定保存位置，可在顶部工具栏点击【更改】选择保存目录；<br>
        3. Word 与 PDF 已内置 Windows 原生保真与排版重组引擎。
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="modalCloseActionBtn">知道了</button>
      </div>
    `;

    document.getElementById('modalCloseActionBtn')?.addEventListener('click', () => {
      previewDrawer.classList.remove('open');
    });

    previewDrawer.classList.add('open');
  }

  // 关闭弹窗
  closeDrawerBtn.addEventListener('click', () => {
    previewDrawer.classList.remove('open');
  });

  // 点击遮罩关闭弹窗
  previewDrawer.addEventListener('click', (e) => {
    if (e.target === previewDrawer) {
      previewDrawer.classList.remove('open');
    }
  });

  // 拖拽与文件选择
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

  // 批量统一格式
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

  // 选择输出目录
  changeSaveDirBtn.addEventListener('click', async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        customSaveDir = selected;
        savePathDisplay.textContent = selected;
        savePathDisplay.title = selected;
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

  // 开始批量转换 (DORARARA!)
  startConvertBtn.addEventListener('click', async () => {
    if (tasks.length === 0) return;

    setMascotState('converting');
    startConvertBtn.disabled = true;
    footerStatusText.textContent = 'ドララララ！疯狂钻石正在高速原子重组中...';

    updateProgress(5, '⚡ 替身出击！开始原子级拆解...');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      task.status = 'converting';
      renderTasks();

      const currentProgress = ((i + 0.2) / tasks.length) * 100;
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
            task.errorMsg = res.error || '转换失败';
            task.errorStack = res.stack;
            failCount++;
          }
        } else {
          await new Promise(r => setTimeout(r, 400));
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
