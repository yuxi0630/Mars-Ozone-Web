document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('governanceTitle', 'governanceDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card">
        <h3>Dataset Upload</h3>
        <div class="field"><label data-i18n="labelName"></label><input id="datasetName"></div>
        <div class="field"><label data-i18n="labelType"></label><select id="datasetType"><option>mcd</option><option>openmars</option><option>derived</option></select></div>
        <div class="field"><label data-i18n="labelDesc"></label><textarea id="datasetDesc"></textarea></div>
        <div class="field"><label>File</label><input type="file" id="datasetFile"></div>
        <div class="card-actions"><button class="btn" id="uploadBtn" data-i18n="btnUpload"></button></div>
        <div class="footer-note" id="uploadStatus">--</div>
      </div>
      <div class="card">
        <h3>Governance Modules</h3>
        <div class="list">
          <div class="list-item">数据审核：状态、流转、责任人</div>
          <div class="list-item">数据版本：发布、回滚、说明</div>
          <div class="list-item">数据增强：插值补全、异常检测</div>
          <div class="list-item">更新记录：日志、时间线、变更摘要</div>
        </div>
      </div>
    </section>
  `;
  marsApp.applyI18n();
  document.getElementById('uploadBtn').onclick = uploadDataset;
});

async function uploadDataset() {
  const file = datasetFile.files[0];
  if (!file) return marsApp.toast('请先选择文件', true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('datasetName', datasetName.value || 'Untitled Dataset');
  fd.append('datasetType', datasetType.value);
  fd.append('description', datasetDesc.value || '');
  fd.append('source', 'frontend-upload');
  try {
    await api.upload('/datasets/upload', fd, true);
    uploadStatus.textContent = '上传成功，可继续扩展审核与版本管理流程。';
    marsApp.toast('数据集上传成功');
  } catch (e) {
    uploadStatus.textContent = `上传失败：${e.message}`;
    marsApp.toast(`上传失败：${e.message}`, true);
  }
}