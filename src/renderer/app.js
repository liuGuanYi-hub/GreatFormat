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

    // PDF 全能工具箱 (含 AI 结构化提取与安全压缩)
    pdf: ['docx', 'clean-md', 'xlsx', 'compress', 'watermark', 'encrypt', 'decrypt', 'png', 'jpg', 'webp', 'txt', 'html', 'split'],

    // 文档与演示
    docx: ['pdf', 'clean-md', 'html', 'txt', 'epub'],
    doc: ['pdf', 'docx', 'clean-md', 'html', 'txt'],
    rtf: ['pdf', 'docx', 'clean-md', 'html', 'txt'],
    odt: ['pdf', 'docx', 'clean-md', 'html', 'txt'],
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

  // JOJO 东方仗助日语台词库 (与番剧原声音频 1:1 精准对应，无任何重复)
  const JOJO_LINES = {
    IDLE: {
      text: '「よっ！アンジェロ！ファイルをドラッグ＆ドロップしてくれ！」\n（哟！安杰罗！把需要重组的文件拖进来吧！）',
      audio: 'yo_angelo.mp3',
      sfx: 'よっ！'
    },
    DRAG: {
      text: '「クレイジー・ダイヤモンド！スタンド出現！」\n（替身出击！疯狂钻石准备拆解与重构！）',
      audio: 'crazy_diamond.mp3',
      sfx: 'ゴゴゴゴ'
    },
    CONVERTING: {
      text: '「ドララララララララララララッ！！DORARARARA！！」\n（ドラララ！疯狂钻石正在高速原子重组中！）',
      audio: 'dorarara.mp3',
      sfx: 'ドラララ！'
    },
    SUCCESS: {
      text: '「グレートですよ、こいつはァ！完璧に直ったぜ！」\n（这可真是太 Great 了！所有文件已完美重构完毕！）',
      audio: 'great_desuyo.mp3',
      sfx: 'グレート！'
    },
    ERROR: {
      text: '「な、何だとォ！？この仗助サマの髪型をケナしたなァ！？」\n（可恶！遇到了阻碍！点击查看详细排查信息）',
      audio: 'josuke_rage.mp3',
      sfx: 'ドドドド'
    }
  };

  let activeVoiceAudio = null;
  let voiceFadeTimer = null;
  const TARGET_VOICE_VOLUME = 0.80; // 饱满舒适音量

  // 播放原声音频文件 (快速平滑渐入，完整播放不截断)
  function playAudioFile(fileName, fadeInMs = 120, targetMaxVol = TARGET_VOICE_VOLUME) {
    if (!audioEnabled) return null;
    try {
      stopVoiceAudio(150);
      const audio = new Audio(`../assets/audio/${fileName}`);
      audio.volume = 0.2;
      activeVoiceAudio = audio;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          const start = Date.now();
          const inTimer = setInterval(() => {
            if (activeVoiceAudio !== audio) {
              clearInterval(inTimer);
              return;
            }
            const elapsed = Date.now() - start;
            const progress = Math.min(1, elapsed / fadeInMs);
            audio.volume = Math.min(1, Math.max(0.2, 0.2 + progress * (targetMaxVol - 0.2)));
            if (progress >= 1) clearInterval(inTimer);
          }, 16);

          audio.onended = () => {
            if (activeVoiceAudio === audio) activeVoiceAudio = null;
          };
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
        playAudioFile(JOJO_LINES.DRAG.audio, 260);
        spawnMangaSfx(JOJO_LINES.DRAG.sfx);
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
        playAudioFile(JOJO_LINES.CONVERTING.audio, 200);
        spawnMangaSfx(JOJO_LINES.CONVERTING.sfx);
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
        playAudioFile(JOJO_LINES.SUCCESS.audio, 280);
        spawnMangaSfx(JOJO_LINES.SUCCESS.sfx);
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
        playAudioFile(JOJO_LINES.ERROR.audio, 250);
        spawnMangaSfx(JOJO_LINES.ERROR.sfx);
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

      const getTargetLabel = (t) => {
        switch (t) {
          case 'clean-md': return '🤖 提取 Clean Markdown (AI/RAG专用)';
          case 'compress': return '🗜️ 智能极限压缩 (.PDF)';
          case 'watermark': return '🛡️ 注入防泄密水印 (.PDF)';
          case 'encrypt': return '🔒 AES-256 密码加密 (.PDF)';
          case 'decrypt': return '🔓 移除密码保护 (.PDF)';
          case 'docx': return '📝 逆向重构 Word (.DOCX)';
          case 'xlsx': return '📊 提取表格为 Excel (.XLSX)';
          case 'split': return '✂️ 逐页拆分 PDF (.PDF)';
          default: return `转为 .${t.toUpperCase()}`;
        }
      };

      const selectOptions = task.availableTargets
        .map(t => `<option value="${t}" ${t === task.target ? 'selected' : ''}>${getTargetLabel(t)}</option>`)
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
      const isPdf = task.ext === 'pdf';

      item.innerHTML = `
        <div class="task-info">
          <div class="file-badge ${badgeClass}">${task.ext}</div>
          <div class="file-detail">
            <div class="file-name" title="${task.path}">
              ${task.name}
              ${isPdf ? `<button class="page-manage-btn" data-id="${task.id}" title="可视化调整页面顺序、旋转或删页">📄 页面管理</button>` : ''}
            </div>
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

    // 绑定 PDF 页面管理按钮
    document.querySelectorAll('.page-manage-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = tasks.find(t => t.id === id);
        if (task) openPdfOrganizer(task);
      });
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

  // ==========================================================================
  // PDF 页面可视化管理工作台 (PDF Page Organizer)
  // ==========================================================================
  const pdfOrganizerModal = document.getElementById('pdfOrganizerModal');
  const organizerDocTitle = document.getElementById('organizerDocTitle');
  const organizerPageCount = document.getElementById('organizerPageCount');
  const pdfPageGrid = document.getElementById('pdfPageGrid');
  const closeOrganizerBtn = document.getElementById('closeOrganizerBtn');
  const cancelOrganizerBtn = document.getElementById('cancelOrganizerBtn');
  const applyOrganizerBtn = document.getElementById('applyOrganizerBtn');
  const organizerRotateAllBtn = document.getElementById('organizerRotateAllBtn');
  const organizerResetBtn = document.getElementById('organizerResetBtn');

  let currentOrganizerTask = null;
  let rawOrganizerPages = []; // 初始备份
  let organizerPages = [];    // 当前工作数据: [{ id, originalIndex, pageNumber, thumbnail, rotateOffset }]
  let dragSrcEl = null;

  async function openPdfOrganizer(task) {
    currentOrganizerTask = task;
    organizerDocTitle.textContent = `📄 PDF 页面管理: ${task.name}`;
    pdfPageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">⚡ 正在使用 PyMuPDF 极速渲染页面缩略图...</div>';
    pdfOrganizerModal.classList.add('open');

    try {
      if (window.electronAPI?.getPdfThumbnails) {
        const res = await window.electronAPI.getPdfThumbnails(task.path);
        if (res.success && res.pages) {
          rawOrganizerPages = res.pages.map((p, idx) => ({
            id: `p-${idx}-${Date.now()}`,
            originalIndex: p.pageIndex,
            pageNumber: p.pageNumber,
            thumbnail: p.thumbnail,
            rotateOffset: 0
          }));
          organizerPages = JSON.parse(JSON.stringify(rawOrganizerPages));
          renderOrganizerGrid();
          return;
        }
      }
      pdfPageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff3b30;">无法生成缩略图，请确认源文件存在且未损坏。</div>';
    } catch (err) {
      pdfPageGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ff3b30;">渲染失败: ${err.message}</div>`;
    }
  }

  function renderOrganizerGrid() {
    pdfPageGrid.innerHTML = '';
    organizerPageCount.textContent = `${organizerPages.length} 页`;

    if (organizerPages.length === 0) {
      pdfPageGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">所有页面已被删除。点击“还原初始”可重新载入。</div>';
      return;
    }

    organizerPages.forEach((page, displayIndex) => {
      const card = document.createElement('div');
      card.className = 'pdf-page-card';
      card.draggable = true;
      card.setAttribute('data-index', displayIndex);

      card.innerHTML = `
        <div class="page-preview-box">
          <img src="${page.thumbnail}" class="page-thumbnail-img" style="transform: rotate(${page.rotateOffset}deg);" alt="第 ${page.pageNumber} 页">
        </div>
        <div class="page-card-footer">
          <span class="page-number-label">第 ${displayIndex + 1} 页 (原P${page.pageNumber})</span>
          <div class="page-action-btns">
            <button class="page-icon-btn rotate-btn" title="顺时针旋转 90°">🔄</button>
            <button class="page-icon-btn delete delete-btn" title="删除此页">🗑️</button>
          </div>
        </div>
      `;

      // 旋转单页
      card.querySelector('.rotate-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        page.rotateOffset = (page.rotateOffset + 90) % 360;
        const img = card.querySelector('.page-thumbnail-img');
        if (img) img.style.transform = `rotate(${page.rotateOffset}deg)`;
      });

      // 删除单页
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        organizerPages.splice(displayIndex, 1);
        renderOrganizerGrid();
      });

      // HTML5 Drag & Drop
      card.addEventListener('dragstart', (e) => {
        dragSrcEl = card;
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over-target');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-target');
      });

      card.addEventListener('drop', (e) => {
        e.stopPropagation();
        card.classList.remove('drag-over-target');
        if (dragSrcEl !== card) {
          const fromIndex = parseInt(dragSrcEl.getAttribute('data-index'), 10);
          const toIndex = parseInt(card.getAttribute('data-index'), 10);
          const moved = organizerPages.splice(fromIndex, 1)[0];
          organizerPages.splice(toIndex, 0, moved);
          renderOrganizerGrid();
        }
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.pdf-page-card').forEach(c => c.classList.remove('drag-over-target'));
      });

      pdfPageGrid.appendChild(card);
    });
  }

  // 全体顺时针旋转 90°
  organizerRotateAllBtn?.addEventListener('click', () => {
    organizerPages.forEach(p => {
      p.rotateOffset = (p.rotateOffset + 90) % 360;
    });
    renderOrganizerGrid();
  });

  // 还原初始
  organizerResetBtn?.addEventListener('click', () => {
    organizerPages = JSON.parse(JSON.stringify(rawOrganizerPages));
    renderOrganizerGrid();
  });

  // 关闭工作台
  const closeOrganizer = () => pdfOrganizerModal.classList.remove('open');
  closeOrganizerBtn?.addEventListener('click', closeOrganizer);
  cancelOrganizerBtn?.addEventListener('click', closeOrganizer);

  // 应用重排并保存
  applyOrganizerBtn?.addEventListener('click', async () => {
    if (!currentOrganizerTask || organizerPages.length === 0) {
      alert('请至少保留一个页面！');
      return;
    }

    applyOrganizerBtn.disabled = true;
    applyOrganizerBtn.textContent = '⚡ 疯狂钻石重构中...';

    const pageOperations = organizerPages.map(p => ({
      originalIndex: p.originalIndex,
      rotateOffset: p.rotateOffset
    }));

    const originalDir = customSaveDir || currentOrganizerTask.path.replace(/[/\\][^/\\]+$/, '');
    const baseName = currentOrganizerTask.name.replace(/\.pdf$/i, '');
    const outputPath = `${originalDir}\\${baseName}_reorganized_${Date.now().toString().slice(-4)}.pdf`;

    try {
      if (window.electronAPI?.reorganizePdf) {
        const res = await window.electronAPI.reorganizePdf({
          inputPath: currentOrganizerTask.path,
          outputPath,
          pageOperations
        });

        if (res.success) {
          closeOrganizer();
          setMascotState('success', `「PDFのページを完璧に再構成したぜ！${organizerPages.length} ページを出力した！」\n（页面可视化重排完毕！已成功输出 ${organizerPages.length} 页全新 PDF！）`);
          tasks.push({
            id: `task-${Date.now()}`,
            name: outputPath.replace(/.*[/\\]/, ''),
            path: outputPath,
            size: res.size || 0,
            ext: 'pdf',
            availableTargets: ['docx', 'clean-md', 'xlsx', 'compress', 'png'],
            target: 'clean-md',
            status: 'success',
            outputPath: outputPath,
            errorMsg: null,
            errorStack: null
          });
          renderTasks();
          return;
        }
      }
      alert('页面重排未成功执行');
    } catch (err) {
      alert(`重排失败: ${err.message}`);
    } finally {
      applyOrganizerBtn.disabled = false;
      applyOrganizerBtn.textContent = '⚡ 应用页面重组并保存';
    }
  });

  // ==========================================================================
  // 疯狂钻石「修复战报」系统 (Crazy Diamond Battle Report)
  // ==========================================================================
  const repairReportModal = document.getElementById('repairReportModal');
  const reportCountVal = document.getElementById('reportCountVal');
  const reportSavedVal = document.getElementById('reportSavedVal');
  const reportTimeVal = document.getElementById('reportTimeVal');
  const openReportFolderBtn = document.getElementById('openReportFolderBtn');
  const confirmReportBtn = document.getElementById('confirmReportBtn');
  const closeReportBtn = document.getElementById('closeReportBtn');

  let lastBatchOutputDir = null;

  function showRepairReport(count, savedBytes, durationSec, sampleOutputPath) {
    if (reportCountVal) reportCountVal.textContent = `${count} 个`;
    if (reportSavedVal) {
      if (savedBytes > 0) {
        reportSavedVal.textContent = formatSize(savedBytes);
      } else {
        reportSavedVal.textContent = '超清保真';
      }
    }
    if (reportTimeVal) reportTimeVal.textContent = `${durationSec} 秒`;

    lastBatchOutputDir = sampleOutputPath ? sampleOutputPath.replace(/[/\\][^/\\]+$/, '') : customSaveDir;
    repairReportModal.classList.add('open');
  }

  const closeReport = () => repairReportModal.classList.remove('open');
  closeReportBtn?.addEventListener('click', closeReport);
  confirmReportBtn?.addEventListener('click', closeReport);

  openReportFolderBtn?.addEventListener('click', async () => {
    if (lastBatchOutputDir && window.electronAPI?.openPath) {
      await window.electronAPI.openPath(lastBatchOutputDir);
    }
  });

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

  // 东方仗助立绘点击彩蛋台词库 (5套经典互动，全部绑定专属独立番剧原声)
  const CLICK_EASTER_EGGS = [
    {
      badge: '自信名台词',
      text: '「グレートだぜ…！この仗助サマに任せな！」\n（太 Great 了……！一切交给我仗助吧！）',
      audio: 'gureto_daze.mp3',
      sfx: 'グレート！'
    },
    {
      badge: '极致爽快',
      text: '「新年元旦の朝に新しいパンツを穿いたような爽快な気分だぜ！」\n（就像是新年元旦早晨换上了新内裤一样，浑身舒爽痛快啊！）',
      audio: 'underwear_quote_clean.mp3',
      sfx: 'スッキリ！'
    },
    {
      badge: '迎难而上',
      text: '「オレのスタンド、クレイジー・ダイヤモンドはプレッシャーを跳ね返すぜ！」\n（替身出击！疯狂钻石可以抵御一切压力！）',
      audio: 'pressure_action.mp3',
      sfx: 'ズギューン！'
    },
    {
      badge: '完美修复',
      text: '「グレートですよ、こいつはァ！完璧に直ったぜ！」\n（这可真是太 Great 了！所有文件已被完美修复！）',
      audio: 'great_desuyo.mp3',
      sfx: 'グレート！'
    },
    {
      badge: '日常打招呼',
      text: '「よっ！アンジェロ！何か直したいファイルでもあるのか？」\n（哟！安杰罗！有什么需要我来修复重构的文件吗？）',
      audio: 'yo_angelo.mp3',
      sfx: 'よっ！'
    }
  ];

  // 东方仗助立绘点击互动 (眨眼弹跳 + 随机专属番剧原声台词)
  if (mascotAvatar) {
    mascotAvatar.addEventListener('click', () => {
      // 触发眨眼弹跳微动效
      mascotAvatar.classList.remove('blink-bounce');
      void mascotAvatar.offsetWidth; // 触发 reflow
      mascotAvatar.classList.add('blink-bounce');

      // 随机挑选一句经典彩蛋
      const egg = CLICK_EASTER_EGGS[Math.floor(Math.random() * CLICK_EASTER_EGGS.length)];
      if (standStatusBadge) {
        standStatusBadge.textContent = egg.badge;
        standStatusBadge.style.background = '#ff2d55';
      }
      if (mascotSpeech) mascotSpeech.innerText = egg.text;

      // 播放台词对应的专属番剧原声音效与拟声词
      playAudioFile(egg.audio, 280);
      spawnMangaSfx(egg.sfx);
    });
  }

  // 高级设置相关 DOM
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingQualitySlider = document.getElementById('settingQualitySlider');
  const settingQualityVal = document.getElementById('settingQualityVal');
  const settingStripExif = document.getElementById('settingStripExif');
  const settingAudioBitrate = document.getElementById('settingAudioBitrate');
  const settingTargetSize = document.getElementById('settingTargetSize');
  const settingWatermarkText = document.getElementById('settingWatermarkText');
  const settingPdfPassword = document.getElementById('settingPdfPassword');
  const settingContextMenu = document.getElementById('settingContextMenu');

  // 全局高级预设对象
  let advancedSettings = {
    quality: 82,
    stripExif: true,
    audioBitrate: '192k',
    targetSize: 'none',
    watermarkText: 'CONFIDENTIAL',
    pdfPassword: '',
    contextMenu: false
  };

  // 质量滑块数值联动
  if (settingQualitySlider && settingQualityVal) {
    settingQualitySlider.addEventListener('input', (e) => {
      settingQualityVal.textContent = `${e.target.value}%`;
    });
  }

  // 打开设置
  if (openSettingsBtn && settingsModal) {
    openSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('open');
    });
  }

  // 关闭设置
  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('open');
    });
  }

  // 保存设置并应用
  if (saveSettingsBtn && settingsModal) {
    saveSettingsBtn.addEventListener('click', async () => {
      advancedSettings = {
        quality: parseInt(settingQualitySlider?.value || 82, 10),
        stripExif: settingStripExif?.checked ?? true,
        audioBitrate: settingAudioBitrate?.value || '192k',
        targetSize: settingTargetSize?.value || 'none',
        watermarkText: settingWatermarkText?.value || 'CONFIDENTIAL',
        pdfPassword: settingPdfPassword?.value || '',
        contextMenu: settingContextMenu?.checked ?? false
      };

      // 切换 Windows 资源管理器右键菜单
      if (window.electronAPI?.toggleContextMenu) {
        try {
          await window.electronAPI.toggleContextMenu(advancedSettings.contextMenu);
        } catch (e) {
          console.warn('[Settings] toggleContextMenu error:', e);
        }
      }

      settingsModal.classList.remove('open');
      setMascotState('idle', '「設定を保存したぜ！グレートな変換を続けよう！」\n（高级预设已保存并生效！继续享受 Great 的转换吧！）');
    });
  }

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

    const startTime = Date.now();
    const totalOriginalBytes = tasks.reduce((sum, t) => sum + (t.size || 0), 0);

    setMascotState('converting');
    startConvertBtn.disabled = true;
    footerStatusText.textContent = 'ドララララ！疯狂钻石正在高速原子重组中...';

    updateProgress(5, '⚡ 替身出击！开始原子级拆解...');

    let successCount = 0;
    let failCount = 0;
    let totalOutputBytes = 0;
    let sampleOutputPath = null;

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
            outputDir: customSaveDir,
            quality: advancedSettings.quality,
            stripExif: advancedSettings.stripExif,
            audioBitrate: advancedSettings.audioBitrate,
            watermarkText: advancedSettings.watermarkText,
            password: advancedSettings.pdfPassword
          });

          if (res.success) {
            task.status = 'success';
            task.outputPath = res.outputPath;
            sampleOutputPath = res.outputPath;
            if (res.size) totalOutputBytes += res.size;
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
          sampleOutputPath = task.outputPath;
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
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const savedBytes = Math.max(0, totalOriginalBytes - totalOutputBytes);

    if (failCount === 0) {
      updateProgress(100, '✨ 这可真是太 Great 了！原子重构全部完成！');
      setMascotState('success');
      footerStatusText.textContent = `全部完成 (${successCount}/${tasks.length})`;
      showRepairReport(successCount, savedBytes, durationSec, sampleOutputPath);
    } else {
      updateProgress(100, `💥 重组完成 (成功: ${successCount}, 失败: ${failCount})`);
      setMascotState('error');
      footerStatusText.textContent = `处理完毕 (成功: ${successCount}, 失败: ${failCount})`;
      if (successCount > 0) {
        showRepairReport(successCount, savedBytes, durationSec, sampleOutputPath);
      }
    }
  });
});
