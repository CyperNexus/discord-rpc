

let activeAccId = localStorage.getItem('livecord_active_acc') || 'acc_1';
let accounts = [];
let currentConfig = {};
let unlockedAccounts = {};

document.addEventListener('DOMContentLoaded', () => {
  initNeonParticlesCanvas();
  initSubNav();
  fetchAccounts();
  bindInputEvents();

  const container = document.getElementById('account-tabs-container');
  if (container) {
    container.addEventListener('wheel', (evt) => {
      if (evt.deltaY !== 0) {
        evt.preventDefault();
        container.scrollLeft += evt.deltaY;
      }
    }, { passive: false });
  }

  
  setInterval(async () => {
    try {
      const res = await fetch('/api/check-reload');
      const data = await res.json();
      if (data.reload) {
        location.reload();
      }
    } catch (e) {}
  }, 2500);
});


function initNeonParticlesCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.min(65, Math.floor((width * height) / 18000));

  const colors = [
    { r: 236, g: 72, b: 153 },  
    { r: 6, g: 182, b: 212 },   
    { r: 16, g: 185, b: 129 },  
    { r: 168, g: 85, b: 247 }   
  ];

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2.5 + 1.5;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = Math.random() * 0.6 + 0.4;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  let mouseX = -1000, mouseY = -1000;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  const maxDistance = 160;

  function animate() {
    ctx.clearRect(0, 0, width, height);

    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const lineAlpha = (1 - dist / maxDistance) * 0.4;
          const col1 = particles[i].color;
          const col2 = particles[j].color;

          const grad = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          grad.addColorStop(0, `rgba(${col1.r}, ${col1.g}, ${col1.b}, ${lineAlpha})`);
          grad.addColorStop(1, `rgba(${col2.r}, ${col2.g}, ${col2.b}, ${lineAlpha})`);

          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }

      
      const mdx = particles[i].x - mouseX;
      const mdy = particles[i].y - mouseY;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 180) {
        const mAlpha = (1 - mdist / 180) * 0.55;
        const col = particles[i].color;
        ctx.save();
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${mAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        ctx.restore();
      }

      particles[i].update();
      particles[i].draw();
    }

    requestAnimationFrame(animate);
  }

  animate();
}


function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>[${type.toUpperCase()}]</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}


function initSubNav() {
  const tabs = document.querySelectorAll('.nav-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = section.id === `tab-${target}` ? 'block' : 'none';
      });
    });
  });
}



async function fetchAccounts() {
  try {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    if (data.success) {
      accounts = data.accounts;
      
      
      if (!accounts.some(a => a.id === activeAccId)) {
        activeAccId = accounts[0]?.id || 'acc_1';
        localStorage.setItem('livecord_active_acc', activeAccId);
      }

      renderAccountTabs();
      
      
      const activeAccObj = accounts.find(a => a.id === activeAccId);
      const mainArea = document.getElementById('main-content-area');
      const lockOverlay = document.getElementById('account-lock-overlay');
      
      if (activeAccObj && activeAccObj.hasPassword && !unlockedAccounts[activeAccId]) {
        mainArea.classList.add('locked');
        lockOverlay.style.display = 'flex';
      } else {
        mainArea.classList.remove('locked');
        lockOverlay.style.display = 'none';
      }

      loadAccountConfig(activeAccId);
    }
  } catch (err) {
    showToast('Lỗi khi tải danh sách tài khoản', 'error');
  }
}


function renderAccountTabs() {
  const container = document.getElementById('account-tabs-container');
  if (!container) return;

  const canDelete = accounts.length > 1;

  let tabsHtml = accounts.map((acc, index) => {
    const isActive = acc.id === activeAccId;
    const dotClass = acc.connected ? 'connected' : (acc.tokenConfigured ? 'configured' : '');
    const tagText = acc.connected ? acc.userTag : (acc.tokenConfigured ? 'OFFLINE' : 'NO TOKEN');
    const avatarImg = acc.avatar ? `<img src="${acc.avatar}" class="acc-avatar-thumb">` : `<span class="acc-dot ${dotClass}"></span>`;
    const singleClass = canDelete ? '' : 'single';

    return `
      <div class="acc-tab-wrapper">
        <button class="acc-tab ${isActive ? 'active' : ''} ${singleClass}" onclick="switchAccount('${acc.id}')">
          ${avatarImg}
          <span>${acc.name.toUpperCase()}</span>
          <span style="font-size: 11px; opacity: 0.7; font-family: var(--font-mono);">(${tagText})</span>
        </button>
        ${canDelete ? `<button class="acc-del-btn" title="Xóa tài khoản" onclick="deleteAccount('${acc.id}', event)">×</button>` : ''}
      </div>
    `;
  }).join('');

  tabsHtml += `
    <button class="btn-add-acc" onclick="openCreateAccountModal()" style="flex-shrink: 0;">
      <span>+ THÊM TÀI KHOẢN</span>
    </button>
  `;

  container.innerHTML = tabsHtml;
}


function openCreateAccountModal() {
  document.getElementById('new-acc-token').value = '';
  document.getElementById('new-acc-password').value = '';
  document.getElementById('new-acc-confirm-password').value = '';
  document.getElementById('create-account-modal').style.display = 'flex';
  document.getElementById('new-acc-token').focus();
}

function closeCreateAccountModal() {
  document.getElementById('create-account-modal').style.display = 'none';
}

async function submitCreateAccount() {
  const token = document.getElementById('new-acc-token').value.trim();
  const password = document.getElementById('new-acc-password').value.trim();
  const confirmPassword = document.getElementById('new-acc-confirm-password').value.trim();

  if (!token) {
    showToast('Vui lòng nhập Token Discord!', 'error');
    return;
  }
  if (!password) {
    showToast('Vui lòng nhập mật khẩu bảo vệ!', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showToast('Mật khẩu xác nhận không trùng khớp!', 'error');
    return;
  }

  showToast('Đang kiểm tra token & tạo tài khoản...', 'info');

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã tạo thành công ${data.account.name}!`, 'success');
      closeCreateAccountModal();

      
      unlockedAccounts[data.account.id] = true;

      await fetchAccounts();
      await switchAccount(data.account.id);
      
      const container = document.getElementById('account-tabs-container');
      if (container) container.scrollLeft = container.scrollWidth;
    } else {
      showToast(data.error || 'Lỗi khi tạo tài khoản', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server', 'error');
  }
}


let pendingDeleteAccId = null;

function openDeleteAccountModal(accId, accName) {
  pendingDeleteAccId = accId;
  document.getElementById('delete-modal-msg').innerHTML = `Xác nhận xóa tài khoản <strong>${escapeHtml(accName)}</strong>. Vui lòng nhập mật khẩu tài khoản để tiếp tục:`;
  document.getElementById('delete-acc-password').value = '';
  document.getElementById('delete-account-modal').style.display = 'flex';
  document.getElementById('delete-acc-password').focus();
}

function closeDeleteAccountModal() {
  document.getElementById('delete-account-modal').style.display = 'none';
  pendingDeleteAccId = null;
}

async function submitDeleteAccount() {
  const password = document.getElementById('delete-acc-password').value.trim();
  if (!password) {
    showToast('Vui lòng nhập mật khẩu để xác nhận xóa!', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/accounts/${pendingDeleteAccId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Xóa tài khoản thành công!', 'info');
      closeDeleteAccountModal();

      if (activeAccId === pendingDeleteAccId) {
        activeAccId = data.remainingAccounts[0]?.id || 'acc_1';
        localStorage.setItem('livecord_active_acc', activeAccId);
      }

      await fetchAccounts();
    } else {
      showToast(data.error || 'Lỗi khi xóa tài khoản', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server', 'error');
  }
}


async function deleteAccount(accId, event) {
  if (event) event.stopPropagation();

  if (accounts.length <= 1) {
    showToast('Phải giữ lại tối thiểu 1 tài khoản!', 'error');
    return;
  }

  const targetAcc = accounts.find(a => a.id === accId);
  if (!targetAcc) return;

  if (targetAcc.hasPassword) {
    openDeleteAccountModal(accId, targetAcc.name);
  } else {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${targetAcc.name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/accounts/${accId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Đã xóa ${targetAcc.name}!`, 'info');
        if (activeAccId === accId) {
          activeAccId = data.remainingAccounts[0]?.id || 'acc_1';
          localStorage.setItem('livecord_active_acc', activeAccId);
        }
        await fetchAccounts();
      } else {
        showToast(data.error || 'Lỗi khi xóa tài khoản', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối server', 'error');
    }
  }
}


async function switchAccount(accId) {
  activeAccId = accId;
  localStorage.setItem('livecord_active_acc', accId);
  renderAccountTabs();

  const activeAccObj = accounts.find(a => a.id === accId);
  const mainArea = document.getElementById('main-content-area');
  const lockOverlay = document.getElementById('account-lock-overlay');

  if (activeAccObj && activeAccObj.hasPassword && !unlockedAccounts[accId]) {
    mainArea.classList.add('locked');
    lockOverlay.style.display = 'flex';
    document.getElementById('lock-password-input').value = '';
    document.getElementById('lock-password-input').focus();
  } else {
    mainArea.classList.remove('locked');
    lockOverlay.style.display = 'none';
  }

  await loadAccountConfig(accId);
  showToast(`Đã chuyển sang quản lý ${activeAccObj ? activeAccObj.name : accId}`, 'info');
}


async function unlockActiveAccount() {
  const passwordInput = document.getElementById('lock-password-input');
  const password = passwordInput.value.trim();
  if (!password) {
    showToast('Vui lòng nhập mật khẩu!', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      unlockedAccounts[activeAccId] = true;

      const mainArea = document.getElementById('main-content-area');
      const lockOverlay = document.getElementById('account-lock-overlay');
      mainArea.classList.remove('locked');
      lockOverlay.style.display = 'none';

      showToast('Mở khóa tài khoản thành công!', 'success');
      loadAccountConfig(activeAccId);
    } else {
      showToast(data.error || 'Mật khẩu không chính xác!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối tới server', 'error');
  }
}


async function loadAccountConfig(accId) {
  try {
    const res = await fetch(`/api/accounts/${accId}/config`);
    currentConfig = await res.json();

    
    document.getElementById('acc-token-input').value = currentConfig.token || '';
    document.getElementById('rpc-enabled').checked = currentConfig.enabled !== false;
    document.getElementById('rpc-mode-select').value = currentConfig.rpcRotationMode || currentConfig.rpcMode || 'sequential';
    document.getElementById('rpc-status').value = currentConfig.status || 'online';

    
    renderRpcProfiles(currentConfig.rpcProfiles || []);

    
    document.getElementById('afk-enabled').checked = Boolean(currentConfig.afkEnabled);
    document.getElementById('afk-message').value = currentConfig.afkMessage || '';

    
    document.getElementById('dyn-status-enabled').checked = Boolean(currentConfig.dynamicStatusEnabled);
    document.getElementById('dyn-status-mode').value = currentConfig.dynamicStatusMode || 'sequential';
    renderDynamicStatusSteps(currentConfig.dynamicStatusSteps || []);

    
    if (document.getElementById('hypesquad-house-select')) {
      document.getElementById('hypesquad-house-select').value = currentConfig.hypesquadMode || 'disabled';
    }
    if (document.getElementById('hypesquad-interval-input')) {
      document.getElementById('hypesquad-interval-input').value = currentConfig.hypesquadIntervalMinutes || 60;
    }

    
    if (document.getElementById('quests-interval-input')) {
      document.getElementById('quests-interval-input').value = currentConfig.autoQuestIntervalHours || 6;
    }

    
    

    
    applyCustomThemeDOM(currentConfig);

    
    updateDiscordPreview();

    
    if (currentConfig.connected) {
      loadVoiceGuilds();
      loadAfkLogs();
    }
  } catch (err) {
    showToast('Lỗi khi tải cấu hình tài khoản', 'error');
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


function renderRpcProfiles(profiles) {
  const container = document.getElementById('rpc-profiles-list');
  if (!container) return;

  if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 16px; font-family: var(--font-mono); font-size: 11px;">Chưa có Profile RPC nào. Bấm nút "+ THÊM PROFILE RPC" bên trên để tạo.</div>`;
    return;
  }

  container.innerHTML = profiles.map((p, idx) => `
    <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; color: var(--accent-signal);">PROFILE #${idx + 1}: ${escapeHtml(p.rpcName || 'Nghệ sĩ / Game')}</span>
        <button class="btn-danger" onclick="removeRpcProfile(${idx})" style="padding: 4px 8px; font-size: 10px;">XÓA PROFILE</button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">ACTIVITY TYPE:</label>
          <select class="form-select prof-type" data-idx="${idx}" onchange="updateProfileField(${idx}, 'type', this.value)">
            <option value="LISTENING" ${p.type === 'LISTENING' ? 'selected' : ''}>LISTENING (Đang nghe)</option>
            <option value="PLAYING" ${p.type === 'PLAYING' ? 'selected' : ''}>PLAYING (Đang chơi)</option>
            <option value="STREAMING" ${p.type === 'STREAMING' ? 'selected' : ''}>STREAMING (Đang phát trực tiếp)</option>
            <option value="WATCHING" ${p.type === 'WATCHING' ? 'selected' : ''}>WATCHING (Đang xem)</option>
            <option value="COMPETING" ${p.type === 'COMPETING' ? 'selected' : ''}>COMPETING (Đang thi đấu)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">TÊN BÀI HÁT / GAME:</label>
          <input type="text" value="${escapeHtml(p.rpcName || '')}" placeholder="Tên bài hát / Game" class="form-input prof-name" data-idx="${idx}" oninput="updateProfileField(${idx}, 'rpcName', this.value)">
        </div>
      </div>

      <div class="form-row" style="align-items: center; margin-bottom: 12px;">
        <div class="form-group" style="width: 50%;">
          <label class="form-label" style="color: var(--accent-signal);">GIẢ LẬP NỀN TẢNG (HIỆN LOGO):</label>
          <select class="form-input prof-spoof-platform" data-idx="${idx}" onchange="updateProfileField(${idx}, 'spoofPlatform', this.value)">
            <option value="off" ${p.spoofPlatform === 'off' || (!p.spoofPlatform && !p.metaQuestEnabled) ? 'selected' : ''}>Tắt Giả Lập</option>
            
            
            
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">DETAILS (DÒNG 1 - TÊN CA SĨ / CHI TIẾT):</label>
          <input type="text" value="${escapeHtml(p.details || '')}" placeholder="Dòng 1" class="form-input prof-details" data-idx="${idx}" oninput="updateProfileField(${idx}, 'details', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">STATE (DÒNG 2 - ALBUM / TRẠNG THÁI):</label>
          <input type="text" value="${escapeHtml(p.state || '')}" placeholder="Dòng 2" class="form-input prof-state" data-idx="${idx}" oninput="updateProfileField(${idx}, 'state', this.value)">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">THANH THỜI LƯỢNG (PROGRESS BAR):</label>
          <select class="form-select prof-pb-mode" data-idx="${idx}" onchange="updateProfileField(${idx}, 'progressBarMode', this.value)">
            <option value="infinite" ${(p.progressBarMode || 'infinite') === 'infinite' ? 'selected' : ''}>VÔ TẬN (496179:23:13 --- 23999999999:59:59)</option>
            <option value="real" ${p.progressBarMode === 'real' ? 'selected' : ''}>THỰC TẾ (Đếm từ 00:00 đến hết bài)</option>
            <option value="none" ${p.progressBarMode === 'none' ? 'selected' : ''}>TẮT (Chỉ đếm giờ 🎵 00:00:00)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">THỜI GIAN HIỂN THỊ (GIÂY):</label>
          <input type="number" value="${p.durationSeconds || 15}" min="3" placeholder="Thời gian (Giây)" class="form-input prof-duration" data-idx="${idx}" oninput="updateProfileField(${idx}, 'durationSeconds', parseInt(this.value)||15)">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">LINK ẢNH LỚN (LARGE IMAGE URL):</label>
          <input type="text" value="${escapeHtml(p.largeImage || '')}" placeholder="https://..." class="form-input prof-large-img" data-idx="${idx}" oninput="updateProfileField(${idx}, 'largeImage', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">HOVER TÊN ẢNH LỚN (LARGE IMAGE TEXT):</label>
          <input type="text" value="${escapeHtml(p.largeText || '')}" placeholder="Tên khi rơ chuột vào ảnh lớn" class="form-input prof-large-text" data-idx="${idx}" oninput="updateProfileField(${idx}, 'largeText', this.value)">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">LINK ẢNH NHỎ (SMALL IMAGE URL - GÓC DƯỚI):</label>
          <input type="text" value="${escapeHtml(p.smallImage || '')}" placeholder="https://..." class="form-input prof-small-img" data-idx="${idx}" oninput="updateProfileField(${idx}, 'smallImage', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">HOVER TÊN ẢNH NHỎ (SMALL IMAGE TEXT):</label>
          <input type="text" value="${escapeHtml(p.smallText || '')}" placeholder="Tên khi rơ chuột vào ảnh nhỏ" class="form-input prof-small-text" data-idx="${idx}" oninput="updateProfileField(${idx}, 'smallText', this.value)">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <input type="text" value="${escapeHtml(p.button1Label || 'My sivi')}" placeholder="Tên Nút 1" class="form-input prof-btn1-label" data-idx="${idx}" oninput="updateProfileField(${idx}, 'button1Label', this.value)">
        </div>
        <div class="form-group">
          <input type="text" value="${escapeHtml(p.button1URL || 'https://cypernexus.dev')}" placeholder="Link Nút 1" class="form-input prof-btn1-url" data-idx="${idx}" oninput="updateProfileField(${idx}, 'button1URL', this.value)">
        </div>
        <div class="form-group">
          <input type="text" value="${escapeHtml(p.button2Label || 'OuterVerse Panel')}" placeholder="Tên Nút 2" class="form-input prof-btn2-label" data-idx="${idx}" oninput="updateProfileField(${idx}, 'button2Label', this.value)">
        </div>
        <div class="form-group">
          <input type="text" value="${escapeHtml(p.button2URL || 'https://discord.gg')}" placeholder="Link Nút 2" class="form-input prof-btn2-url" data-idx="${idx}" oninput="updateProfileField(${idx}, 'button2URL', this.value)">
        </div>
      </div>
    </div>
  `).join('');
}

function syncRpcProfilesFromDOM() {
  if (!currentConfig.rpcProfiles || !Array.isArray(currentConfig.rpcProfiles)) return;
  const types = document.querySelectorAll('.prof-type');
  const names = document.querySelectorAll('.prof-name');
  const details = document.querySelectorAll('.prof-details');
  const states = document.querySelectorAll('.prof-state');
  const pbModes = document.querySelectorAll('.prof-pb-mode');
  const durations = document.querySelectorAll('.prof-duration');
  const largeImgs = document.querySelectorAll('.prof-large-img');
  const largeTexts = document.querySelectorAll('.prof-large-text');
  const smallImgs = document.querySelectorAll('.prof-small-img');
  const smallTexts = document.querySelectorAll('.prof-small-text');
  const btn1Labels = document.querySelectorAll('.prof-btn1-label');
  const btn1Urls = document.querySelectorAll('.prof-btn1-url');
  const btn2Labels = document.querySelectorAll('.prof-btn2-label');
  const btn2Urls = document.querySelectorAll('.prof-btn2-url');
  

  types.forEach((el, i) => {
    if (currentConfig.rpcProfiles[i]) {
      currentConfig.rpcProfiles[i].type = el.value;
      if (names[i]) currentConfig.rpcProfiles[i].rpcName = names[i].value;
      if (details[i]) currentConfig.rpcProfiles[i].details = details[i].value;
      if (states[i]) currentConfig.rpcProfiles[i].state = states[i].value;
      if (pbModes[i]) currentConfig.rpcProfiles[i].progressBarMode = pbModes[i].value;
      if (durations[i]) currentConfig.rpcProfiles[i].durationSeconds = parseInt(durations[i].value) || 15;
      if (largeImgs[i]) currentConfig.rpcProfiles[i].largeImage = largeImgs[i].value;
      if (largeTexts[i]) currentConfig.rpcProfiles[i].largeText = largeTexts[i].value;
      if (smallImgs[i]) currentConfig.rpcProfiles[i].smallImage = smallImgs[i].value;
      if (smallTexts[i]) currentConfig.rpcProfiles[i].smallText = smallTexts[i].value;
      if (btn1Labels[i]) currentConfig.rpcProfiles[i].button1Label = btn1Labels[i].value;
      if (btn1Urls[i]) currentConfig.rpcProfiles[i].button1URL = btn1Urls[i].value;
      if (btn2Labels[i]) currentConfig.rpcProfiles[i].button2Label = btn2Labels[i].value;
      if (btn2Urls[i]) currentConfig.rpcProfiles[i].button2URL = btn2Urls[i].value;
      
    }
  });
}

function updateProfileField(idx, field, val) {
  if (currentConfig.rpcProfiles && currentConfig.rpcProfiles[idx]) {
    currentConfig.rpcProfiles[idx][field] = val;
    updateDiscordPreview();
  }
}

function addRpcProfile() {
  syncRpcProfilesFromDOM();
  currentConfig.rpcProfiles = currentConfig.rpcProfiles || [];
  currentConfig.rpcProfiles.push({
    id: `prof_${Date.now()}`,
    name: `Profile #${currentConfig.rpcProfiles.length + 1}`,
    type: 'LISTENING',
    rpcName: 'Tên Bài Hát Mới',
    details: 'Tên Ca Sĩ',
    state: 'Album / Single',
    largeImage: 'https://cdn.discordapp.com/embed/avatars/0.png',
    largeText: 'OuterVerse Engine',
    smallImage: 'https://cdn.discordapp.com/embed/avatars/1.png',
    smallText: 'Verified Operator',
    button1Label: 'My sivi',
    button1URL: 'https://cypernexus.dev',
    button2Label: 'OuterVerse Panel',
    button2URL: 'https://discord.gg',
    durationSeconds: 15,
    progressBarMode: 'infinite',
    
  });
  renderRpcProfiles(currentConfig.rpcProfiles);
  updateDiscordPreview();
}

function removeRpcProfile(idx) {
  syncRpcProfilesFromDOM();
  currentConfig.rpcProfiles.splice(idx, 1);
  renderRpcProfiles(currentConfig.rpcProfiles);
  updateDiscordPreview();
}


function updateDiscordPreview() {
  const avatar = currentConfig.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const tag = currentConfig.userTag || 'User#0000';
  const username = currentConfig.username || (currentConfig.name || 'Account');

  document.getElementById('card-avatar').src = avatar;
  document.getElementById('card-username').textContent = username;
  document.getElementById('card-tag').textContent = tag;

  
  const customStatusEl = document.getElementById('card-custom-status');
  if (customStatusEl) {
    let customText = '';
    let customEmoji = '';

    const dynEnabledEl = document.getElementById('dyn-status-enabled');
    const dynEnabled = dynEnabledEl ? dynEnabledEl.checked : Boolean(currentConfig.dynamicStatusEnabled);

    if (dynEnabled && currentConfig.dynamicStatusSteps && currentConfig.dynamicStatusSteps.length > 0) {
      const step = currentConfig.dynamicStatusSteps[0];
      customText = step.text || '';
      customEmoji = step.emoji || '';
    } else if (currentConfig.customStatusText || currentConfig.customStatusEmoji) {
      customText = currentConfig.customStatusText || '';
      customEmoji = currentConfig.customStatusEmoji || '';
    }

    if (customText || customEmoji) {
      customStatusEl.textContent = `${customEmoji} ${customText}`.trim();
      customStatusEl.style.display = 'block';
    } else {
      customStatusEl.style.display = 'none';
    }
  }

  const statusDot = document.getElementById('card-status-dot');
  statusDot.className = `discord-status-dot ${currentConfig.status || 'online'}`;

  const enabled = document.getElementById('rpc-enabled').checked;
  const activityBox = document.getElementById('card-activity-box');

  if (!enabled) {
    activityBox.style.display = 'none';
    return;
  }
  activityBox.style.display = 'flex';

  let type, name, details, state, largeImg, smallImg, btn1Label, btn2Label;
  

  if (currentConfig.rpcProfiles && currentConfig.rpcProfiles.length > 0) {
    const prof = currentConfig.rpcProfiles[0];
    type = prof.type || 'PLAYING';
    name = prof.rpcName || 'VS Code';
    details = prof.details || '';
    state = prof.state || '';
    largeImg = prof.largeImage || '';
    smallImg = prof.smallImage || '';
    btn1Label = prof.button1Label || '';
    btn2Label = prof.button2Label || '';
    
  } else {
    type = 'LISTENING';
    name = currentConfig.rpcName || 'VS Code';
    details = currentConfig.details || '';
    state = currentConfig.state || '';
    largeImg = currentConfig.largeImage || '';
    smallImg = '';
    btn1Label = currentConfig.button1Label || '';
    btn2Label = currentConfig.button2Label || '';
  }

  let platformIcon = '';
  if (spoofPlatform === 'metaquest') platformIcon = ' ∞';
  else if (spoofPlatform === 'playstation') platformIcon = ' 🎮';
  else if (spoofPlatform === 'xbox') platformIcon = ' 🟢';

  document.getElementById('card-act-header').textContent = `${type.toUpperCase()}${platformIcon}`;
  document.getElementById('card-act-name').textContent = name;
  document.getElementById('card-act-details').textContent = details;
  document.getElementById('card-act-state').textContent = state;

  const largeImgEl = document.getElementById('card-act-large-img');
  const smallImgEl = document.getElementById('card-act-small-img');

  if (largeImg) {
    largeImgEl.src = largeImg;
    largeImgEl.style.display = 'block';
  } else {
    largeImgEl.style.display = 'none';
  }

  if (smallImg) {
    smallImgEl.src = smallImg;
    smallImgEl.style.display = 'block';
  } else {
    smallImgEl.style.display = 'none';
  }

  const btnContainer = document.getElementById('card-act-buttons');
  btnContainer.innerHTML = '';

  if (btn1Label) {
    btnContainer.innerHTML += `<div class="activity-btn">${btn1Label}</div>`;
  }
  if (btn2Label) {
    btnContainer.innerHTML += `<div class="activity-btn">${btn2Label}</div>`;
  }
}


function bindInputEvents() {
  const inputIds = ['rpc-enabled', 'rpc-mode-select', 'rpc-status', 'dyn-status-enabled', 'dyn-status-mode'];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateDiscordPreview);
      el.addEventListener('change', updateDiscordPreview);
    }
  });
}


async function saveToken() {
  const token = document.getElementById('acc-token-input').value.trim();
  if (!token) {
    showToast('Vui lòng nhập Token Discord!', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, enabled: true })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu Token! Đang kết nối Discord...', 'success');
      fetchAccounts();
    } else {
      showToast(data.error || 'Lỗi khi lưu Token', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server', 'error');
  }
}


async function saveRPC() {
  const enabled = document.getElementById('rpc-enabled').checked;
  const mode = document.getElementById('rpc-mode-select').value;

  const payload = {
    enabled: enabled,
    rpcMode: mode,
    rpcRotationMode: mode,
    status: document.getElementById('rpc-status').value,
    rpcProfiles: currentConfig.rpcProfiles || []
  };

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      const activeAccObj = accounts.find(a => a.id === activeAccId);
      const accName = activeAccObj ? activeAccObj.name : activeAccId;
      showToast(enabled ? `Đã phát RPC thành công cho ${accName}!` : `Đã TẮT RPC cho ${accName}!`, 'success');
      fetchAccounts();
    }
  } catch (err) {
    showToast('Lỗi khi lưu RPC', 'error');
  }
}


async function saveAFK() {
  const payload = {
    afkEnabled: document.getElementById('afk-enabled').checked,
    afkMessage: document.getElementById('afk-message').value
  };

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu cấu hình AFK!', 'success');
    }
  } catch (err) {
    showToast('Lỗi khi lưu AFK', 'error');
  }
}

async function loadAfkLogs() {
  try {
    const res = await fetch(`/api/accounts/${activeAccId}/afk/logs`);
    const data = await res.json();
    if (data.success) {
      renderAfkLogs(data.logs || []);
    }
  } catch (err) {}
}

function renderAfkLogs(logs) {
  const tbody = document.getElementById('afk-logs-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-dim);">Chưa có lượt tag tên nào</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="font-weight: 600;">${l.author?.tag || l.author?.username}</td>
      <td>${l.guild ? l.guild.name : 'Tin nhắn riêng (DM)'}</td>
      <td>#${l.channel?.name}</td>
      <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.content}</td>
      <td style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">${new Date(l.timestamp).toLocaleTimeString()}</td>
    </tr>
  `).join('');
}

async function clearAfkLogs() {
  try {
    await fetch(`/api/accounts/${activeAccId}/afk/logs`, { method: 'DELETE' });
    showToast('Đã xóa nhật ký AFK!', 'success');
    loadAfkLogs();
  } catch (e) {}
}


function renderDynamicStatusSteps(steps) {
  const container = document.getElementById('dyn-steps-container');
  if (!container) return;

  container.innerHTML = steps.map((s, idx) => `
    <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
      <input type="text" value="${escapeHtml(s.emoji || '')}" placeholder="Emoji" style="width: 70px;" class="form-input dyn-emoji" data-idx="${idx}" oninput="updateDynStepPreview()">
      <input type="text" value="${escapeHtml(s.text || '')}" placeholder="Nội dung trạng thái" style="flex: 1;" class="form-input dyn-text" data-idx="${idx}" oninput="updateDynStepPreview()">
      <input type="number" value="${s.durationSeconds || (s.durationMinutes ? s.durationMinutes * 60 : 15)}" min="3" placeholder="Giây" style="width: 110px;" class="form-input dyn-duration-sec" data-idx="${idx}">
      <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">GIÂY</span>
      <button class="btn-danger" onclick="removeDynStep(${idx})">XÓA</button>
    </div>
  `).join('');
}

function updateDynStepPreview() {
  const emojis = document.querySelectorAll('.dyn-emoji');
  const texts = document.querySelectorAll('.dyn-text');
  const durations = document.querySelectorAll('.dyn-duration-sec');

  const steps = [];
  emojis.forEach((el, i) => {
    steps.push({
      emoji: el.value,
      text: texts[i].value,
      durationSeconds: parseInt(durations[i].value) || 15
    });
  });
  currentConfig.dynamicStatusSteps = steps;
  updateDiscordPreview();
}

function addDynStep() {
  updateDynStepPreview();
  currentConfig.dynamicStatusSteps = currentConfig.dynamicStatusSteps || [];
  currentConfig.dynamicStatusSteps.push({ emoji: '⚡', text: 'Trạng thái động mới', durationSeconds: 15 });
  renderDynamicStatusSteps(currentConfig.dynamicStatusSteps);
  updateDiscordPreview();
}

function removeDynStep(idx) {
  updateDynStepPreview();
  currentConfig.dynamicStatusSteps.splice(idx, 1);
  renderDynamicStatusSteps(currentConfig.dynamicStatusSteps);
  updateDiscordPreview();
}

async function saveDynamicStatus() {
  const emojis = document.querySelectorAll('.dyn-emoji');
  const texts = document.querySelectorAll('.dyn-text');
  const durations = document.querySelectorAll('.dyn-duration-sec');

  const steps = [];
  emojis.forEach((el, i) => {
    steps.push({
      emoji: el.value,
      text: texts[i].value,
      durationSeconds: parseInt(durations[i].value) || 15
    });
  });

  const payload = {
    dynamicStatusEnabled: document.getElementById('dyn-status-enabled').checked,
    dynamicStatusMode: document.getElementById('dyn-status-mode').value,
    dynamicStatusSteps: steps
  };

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã lưu Dynamic Status & Timer thành công!', 'success');
    }
  } catch (err) {
    showToast('Lỗi khi lưu Dynamic Status', 'error');
  }
}


async function loadVoiceGuilds() {
  try {
    const res = await fetch(`/api/accounts/${activeAccId}/voice/guilds`);
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('voice-guild-select');
      select.innerHTML = `<option value="">-- CHỌN MÁY CHỦ DISCORD --</option>` +
        data.guilds.map(g => `<option value="${g.id}">${g.name} (${g.voiceChannelCount} kênh thoại)</option>`).join('');
      
      if (currentConfig.voiceHolderGuildId) {
        select.value = currentConfig.voiceHolderGuildId;
        loadVoiceChannels(currentConfig.voiceHolderGuildId);
      }
    }
  } catch (err) {}
}

async function loadVoiceChannels(guildId) {
  if (!guildId) return;
  try {
    const res = await fetch(`/api/accounts/${activeAccId}/voice/channels?guildId=${guildId}`);
    const data = await res.json();
    if (data.success) {
      const select = document.getElementById('voice-channel-select');
      select.innerHTML = `<option value="">-- CHỌN KÊNH THOẠI --</option>` +
        data.channels.map(c => `<option value="${c.id}">${c.name} (${c.memberCount} người)</option>`).join('');
      
      if (currentConfig.voiceHolderChannelId) {
        select.value = currentConfig.voiceHolderChannelId;
      }
    }
  } catch (err) {}
}

async function joinVoice() {
  const guildId = document.getElementById('voice-guild-select').value;
  const channelId = document.getElementById('voice-channel-select').value;
  const selfMute = document.getElementById('voice-mute').checked;
  const selfDeaf = document.getElementById('voice-deaf').checked;

  if (!guildId || !channelId) {
    showToast('Vui lòng chọn máy chủ và kênh thoại!', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/voice/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guildId, channelId, selfMute, selfDeaf })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã tham gia kênh thoại: ${data.channelName}`, 'success');
    } else {
      showToast(data.error || 'Không thể vào kênh thoại', 'error');
    }
  } catch (err) {
    showToast('Lỗi khi tham gia kênh thoại', 'error');
  }
}

async function leaveVoice() {
  try {
    await fetch(`/api/accounts/${activeAccId}/voice/leave`, { method: 'POST' });
    showToast('Đã rời kênh thoại!', 'info');
  } catch (err) {}
}


async function changeHypeSquadNow() {
  const houseId = document.getElementById('hypesquad-house-select').value;
  const intervalMinutes = parseInt(document.getElementById('hypesquad-interval-input').value) || 60;

  try {
    const res = await fetch(`/api/accounts/${activeAccId}/hypesquad/change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ houseId, intervalMinutes })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã cập nhật HypeSquad Badge: ${data.houseName}`, 'success');
    } else {
      showToast(data.error || 'Lỗi khi đổi HypeSquad Badge', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server', 'error');
  }
}

