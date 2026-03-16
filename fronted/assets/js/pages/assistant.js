document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('assistantTitle', 'assistantDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card">
        <h3>Suggested Questions</h3>
        <div class="list">
          <button class="ghost-btn suggest">请解释臭氧预测值、置信区间和风险等级</button>
          <button class="ghost-btn suggest">请概括 MY34 沙尘暴专题应该展示什么</button>
          <button class="ghost-btn suggest">请帮我解读模型散点图和残差图</button>
        </div>
      </div>
      <div class="card">
        <h3>Assistant Panel</h3>
        <div class="chat-log" id="chatLog"></div>
        <div class="field" style="margin-top:12px"><label data-i18n="labelQuestion"></label><textarea id="chatInput" data-i18n-placeholder="placeholderQuestion"></textarea></div>
        <div class="card-actions"><button class="btn" id="sendBtn" data-i18n="btnSend"></button></div>
      </div>
    </section>
  `;
  marsApp.applyI18n();
  document.getElementById('sendBtn').onclick = sendChat;
  document.querySelectorAll('.suggest').forEach(btn => btn.onclick = () => { chatInput.value = btn.textContent; sendChat(); });
});

async function sendChat() {
  const value = chatInput.value.trim();
  if (!value) return;
  append(value, 'user');
  chatInput.value = '';
  try {
    const data = await api.post('/assistant/chat', { question: value });
    append(data.answer || 'No answer.', 'bot');
  } catch (e) {
    append('智能助手暂时不可用，请稍后重试。', 'bot');
  }
}

function append(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}