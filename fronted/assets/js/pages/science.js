document.addEventListener('DOMContentLoaded', () => {
  marsApp.renderShell('scienceTitle', 'scienceDesc');
  document.getElementById('page-content').innerHTML = `
    <section class="grid grid-2">
      <div class="card"><h3>火星百科</h3><p class="muted">火星大气、季节、环境与极区特征。</p></div>
      <div class="card"><h3>臭氧知识</h3><p class="muted">臭氧形成机制、火星臭氧空间分布与研究价值。</p></div>
      <div class="card"><h3>深空任务</h3><p class="muted">火星探测任务时间线、重要里程碑与关联数据来源。</p></div>
      <div class="card"><h3>趣味问答</h3><p class="muted">可扩展为小测试、交互问答与外链资源。</p></div>
    </section>
  `;
});