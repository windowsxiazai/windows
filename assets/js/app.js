/* ============================================================
 *  Windows 镜像站 —— 页面渲染逻辑
 *  依赖：data.js（镜像元数据）、links.js（下载链接，更新只改它）
 * ============================================================ */
(function () {
  "use strict";

  var DATA = window.MSDN_DATA || { systems: [] };
  var LINKS = window.SITE_LINKS || { iso: {} };

  /* ---------------- 站点信息 ---------------- */
  var SITE = {
    name: "Windows 镜像站",
    sub: "MSDN 原版镜像",
    pages: "index.html",
  };

  /* ---------------- 工具函数 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* 版本 id -> 显示名：25h2 -> 25H2，sp1 -> SP1，rtm -> RTM，update -> Update，2024 -> 2024 */
  /* 规则之外的版本 id 在此指定显示名 */
  var VER_NAMES = { ltsc: "LTSC / LTSB" };
  function verLabel(id) {
    if (VER_NAMES[id]) return VER_NAMES[id];
    if (/^\d+$/.test(id)) return id;
    if (/^(sp\d+|rtm)$/i.test(id)) return id.toUpperCase();
    var m = id.match(/^(\d{2,4})h(\d+)$/i);
    if (m) return m[1] + "H" + m[2];
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  /* ---------------- 复制到剪贴板（含 file:// 降级） ---------------- */
  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast(okMsg || "复制成功"); }
      catch (e) { toast("复制失败，请手动复制"); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg || "复制成功"); }, fallback);
    } else { fallback(); }
  }

  var toastTimer = null;
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = "none"; }, 1600);
  }

  /* ---------------- 帮助弹窗 ---------------- */
  var HELP = {
    ed2k: {
      title: "ed2k 下载工具",
      body: '<p>ed2k 链接需使用支持 eMule 协议的下载工具：</p>' +
            '<p>1. 复制本站提供的 <code>ed2k://</code> 链接；</p>' +
            '<p>2. 打开 eMule（电驴）或迅雷，任务会自动添加，也可手动新建任务粘贴链接；</p>' +
            '<p>3. 下载完成后务必进行 SHA-1 / MD5 校验。</p>',
    },
    bt: {
      title: "BT 磁力下载工具",
      body: '<p>磁力链接可使用以下工具下载：</p>' +
            '<p>迅雷、qBittorrent、Free Download Manager 等。</p>' +
            '<p>1. 复制 <code>magnet:?xt=</code> 开头的磁力链接；</p>' +
            '<p>2. 在下载工具中新建 BT 任务并粘贴；</p>' +
            '<p>3. 下载完成后务必进行 SHA-1 / MD5 校验。</p>',
    },
    install: {
      title: "安装说明",
      body: '<p>1. 下载完成后，先校验文件的 <code>SHA-1</code> / <code>MD5</code> 与本站标注一致；</p>' +
            '<p>2. 使用 <a href="https://rufus.ie/" target="_blank" rel="noopener">Rufus</a> 或 UltraISO 将 ISO 镜像写入 U 盘制作启动盘；</p>' +
            '<p>3. 开机选择 U 盘启动，按提示安装；</p>' +
            '<p>4. 安装后请使用有效的正版密钥激活。</p>',
    },
    hasher: {
      title: "SHA-1 校验工具",
      body: '<p>下载 <a href="https://windows.ee.cd/tools/Hasher_4.2.zip" class="hasher-link">Hasher 校验工具</a>，将镜像文件拖入即可计算 SHA-1 / MD5，与本站标注核对一致后再使用（不区分大小写）。</p>',
    },
  };

  function openDialog(key) {
    var conf = HELP[key];
    if (!conf) return;
    closeDialog();
    var mask = el("div", "dialog-mask");
    var dlg = el("div", "dialog");
    dlg.innerHTML =
      '<div class="dialog-title">' + esc(conf.title) + '<span class="dialog-close" title="关闭">×</span></div>' +
      '<div class="dialog-body">' + conf.body + "</div>";
    mask.addEventListener("click", closeDialog);
    $(".dialog-close", dlg).addEventListener("click", closeDialog);
    document.body.appendChild(mask);
    document.body.appendChild(dlg);
  }
  function closeDialog() {
    $$(".dialog-mask, .dialog").forEach(function (n) { n.parentNode && n.parentNode.removeChild(n); });
  }

  /* ---------------- 下载渠道定义 ----------------
   * pair：需要同行展示"地址+密码"的网盘渠道。
   * 只要在 links.js 中填写对应字段，页面上就会自动出现该渠道。
   */
  var CHANNELS = [
    { key: "xunlei", label: "迅雷云盘", visit: true },
    { key: "aliyun", label: "阿里云盘", visit: true },
    { key: "baidu", label: "百度网盘", pair: "baiduPwd", pairLabel: "百度网盘密码", visit: true },
    { key: "caiyun", label: "移动云盘", pair: "caiyunPwd", pairLabel: "移动云盘密码", visit: true },
    { key: "ed2k", label: "ed2k 下载", help: "ed2k", helpLabel: "下载工具" },
    { key: "magnet", label: "BT 磁力", help: "bt", helpLabel: "下载工具" },
  ];

  /* 某镜像可用的渠道数 */
  function activeChannels(lk) {
    if (!lk) return 0;
    var n = 0;
    CHANNELS.forEach(function (c) {
      if (lk[c.key]) n++;
      if (c.pair && lk[c.pair]) n++;
    });
    return n;
  }

  function buildRow(label, id, value, opts) {
    opts = opts || {};
    /* 网盘渠道：附"访问"按钮（位于复制按钮左侧），点击直达网盘页面 */
    var visit = !!(opts.visit && /^https?:\/\//i.test(value || ""));
    var item = el("div", "item" + (opts.cls ? " " + opts.cls : "") + (visit ? " has-visit" : ""));
    var html = '<div class="label">' + esc(label) + "</div>" +
      '<div class="edit"><input type="text" class="input" id="' + id + '" readonly value="' + esc(value) + '"></div>' +
      '<div class="copy" data-copy-target="' + id + '">复制</div>' +
      (visit ? '<a class="visit" href="' + esc(value) + '" target="_blank" rel="noopener">访问</a>' : "");
    if (opts.help) {
      html = '<div class="help" data-help="' + opts.help + '">' + esc(opts.helpLabel || "说明") + "</div>" + html;
    }
    item.innerHTML = html;
    return item;
  }

  function buildDownload(linkKey) {
    var box = el("div", "download");
    var lk = LINKS[linkKey] || {};   /* links.js 为扁平结构：key 即镜像文件名 */
    var count = activeChannels(lk);
    if (!count) {
      box.appendChild(el("div", "empty", "暂无可用下载链接，可在 assets/js/links.js 中补充该镜像的下载地址。"));
      return box;
    }
    CHANNELS.forEach(function (c) {
      var val = lk[c.key];
      if (val) {
        var row = buildRow(c.label, "dl_" + c.key + "_" + md5Slug(linkKey), val, {
          help: c.help, helpLabel: c.helpLabel, visit: c.visit,
        });
        if (!c.pair) box.appendChild(row);
      }
    });
    /* 带"地址+密码"的网盘渠道：一行地址 + 一行密码 */
    CHANNELS.forEach(function (c) {
      if (!c.pair) return;
      var val = lk[c.key];
      if (!val) return;
      var clear = el("div", "clear");
      var slug = md5Slug(linkKey);
      clear.appendChild(buildRow(c.label, "dl_" + c.key + "_" + slug, val, { cls: "url", visit: c.visit }));
      if (lk[c.pair]) {
        clear.appendChild(buildRow(c.pairLabel, "dl_" + c.pair + "_" + slug, lk[c.pair], { cls: "pass" }));
      }
      box.appendChild(clear);
    });
    return box;
  }

  /* 长文件名 -> 短 DOM id（取 dvd 校验码即可保证唯一性） */
  function md5Slug(linkKey) {
    var m = String(linkKey).match(/_([0-9a-f]{8})$/i);
    return (m ? m[1] : String(linkKey).slice(-12)).replace(/[^0-9a-z]/gi, "");
  }

  /* ---------------- 公共骨架：侧栏 + 顶栏 ---------------- */
  var ICON =
    '<svg width="30" height="30" viewBox="0 0 24 24" fill="none">' +
    '<rect x="2" y="2" width="9" height="9" rx="1" fill="#fff"/><rect x="13" y="2" width="9" height="9" rx="1" fill="rgba(255,255,255,.65)"/>' +
    '<rect x="2" y="13" width="9" height="9" rx="1" fill="rgba(255,255,255,.65)"/><rect x="13" y="13" width="9" height="9" rx="1" fill="#fff"/></svg>';

  function currentSystemId() {
    return document.body.getAttribute("data-system") || "";
  }

  function renderSkeleton() {
    var sysId = currentSystemId();
    var side = $(".side");
    var navItems = DATA.systems.map(function (s) {
      return '<li class="' + (s.id === sysId ? "active" : "") + '"><a href="' + s.id + '.html">' + esc(s.name) + "</a></li>";
    }).join("");
    side.innerHTML =
      '<a class="logo" href="index.html">' + ICON +
      '<span class="logo-name">' + esc(SITE.name) + '<span class="logo-sub">' + esc(SITE.sub) + "</span></span></a>" +
      '<div class="nav"><ul class="list">' +
      '<li class="' + (sysId ? "" : "active") + '"><a href="index.html">首页</a></li>' +
      navItems +
      '<li class="' + (sysId === "links" ? "active" : "") + '"><a href="links.html">网站导航</a></li>' +
      "</ul></div>" +
      '<div class="copyright">windows.ee.cd<br>资源来自网络收集<br>安装后请使用正版密钥激活</div>';

    /* 顶栏"常用网站"下拉菜单（quick: true 的站点） */
    var quick = [];
    (window.NAV_SITES || []).forEach(function (c) {
      c.sites.forEach(function (s) { if (s.quick) quick.push(s); });
    });
    var ddItems = quick.map(function (s) {
      return '<a class="dd-item" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        "<b>" + esc(s.name) + (s.badge ? ' <i class="dd-badge">' + esc(s.badge) + "</i>" : "") + "</b>" +
        "<span>" + esc(s.desc) + "</span></a>";
    }).join("");
    var header = $(".header");
    header.innerHTML =
      '<div class="menu-btn" id="menuBtn"></div>' +
      '<div class="dd" id="favDD">' +
      '<span class="dd-toggle" id="ddToggle">常用网站 <i class="dd-caret"></i></span>' +
      '<div class="dd-panel">' + ddItems +
      '<a class="dd-item dd-more" href="links.html">进入网站导航页 →</a>' +
      "</div></div>" +
      '<ul class="list">' +
      '<li class="hide-mobile"><a href="#" id="favBtn">收藏本站</a></li>' +
      '<li><a href="#" id="hasherBtn">校验工具</a></li>' +
      '<li><a href="index.html#about">关于本站</a></li>' +
      "</ul>";

    /* 底部友情链接（数据见 nav.js 的 FRIEND_LINKS） */
    var footer = $(".footer");
    if (footer) {
      var fl = (window.FRIEND_LINKS || []).map(function (s) {
        return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + "</a>";
      }).join("");
      if (fl) {
        footer.insertBefore(el("div", "friend-links", '<span class="fl-label">友情链接：</span>' + fl), footer.firstChild);
      }
    }
  }

  /* ---------------- 网站导航页 ---------------- */
  function renderLinksPage() {
    document.title = "网站导航 - " + SITE.name;
    var container = $(".container");
    (window.NAV_SITES || []).forEach(function (cat) {
      var sec = el("div", "link-cat");
      sec.innerHTML = '<div class="title"><h1>' + esc(cat.cat) + "</h1></div>";
      var grid = el("div", "link-grid");
      cat.sites.forEach(function (s) {
        var a = el("a", "link-card");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML =
          '<div class="lc-name">' + esc(s.name) + (s.badge ? ' <i class="dd-badge">' + esc(s.badge) + "</i>" : "") + "</div>" +
          '<div class="lc-desc">' + esc(s.desc) + "</div>" +
          '<div class="lc-url">' + esc(String(s.url).replace(/^https?:\/\//, "").replace(/\/$/, "")) + "</div>";
        grid.appendChild(a);
      });
      sec.appendChild(grid);
      container.appendChild(sec);
    });
  }

  /* ---------------- 首页 ---------------- */
  function countIso(system) {
    var n = 0;
    system.versions.forEach(function (v) { n += v.items.length; });
    return n;
  }
  function latestVersion(system) {
    var labels = system.versions.filter(function (v) { return v.items.length; })
      .map(function (v) { return verLabel(v.id); });
    return labels.slice(0, 3).join(" / ");
  }
  function renderHome() {
    var grid = $("#homeGrid");
    if (!grid) return;
    grid.innerHTML = DATA.systems.map(function (s) {
      return '<a class="home-card" href="' + s.id + '.html">' +
        '<div class="hc-name">' + esc(s.name) + "</div>" +
        '<div class="hc-meta">镜像 <b>' + countIso(s) + "</b> 个<br>版本：" + esc(latestVersion(s) || "-") + "</div></a>";
    }).join("");
  }

  /* ---------------- 系统页 ---------------- */
  function findSystem(sysId) {
    for (var i = 0; i < DATA.systems.length; i++) {
      if (DATA.systems[i].id === sysId) return DATA.systems[i];
    }
    return null;
  }

  function renderSystem() {
    var sysId = currentSystemId();
    var sys = findSystem(sysId);
    if (!sys) return;
    document.title = sys.name + " - " + SITE.name;

    var container = $(".container");
    var tabs = el("div", "menu");
    var ul = el("ul");
    sys.versions.forEach(function (v) {
      var li = el("li");
      li.setAttribute("data-ver", v.id);
      li.innerHTML = '<a href="#' + v.id + '">' + esc(verLabel(v.id)) + "</a><i></i>";
      li.addEventListener("click", function () { location.hash = v.id; });
      ul.appendChild(li);
    });
    tabs.appendChild(ul);
    container.appendChild(tabs);

    /* 搜索过滤：按标题/版本标签实时筛选当前版本的镜像 */
    var searchBar = el("div", "search-bar");
    searchBar.innerHTML =
      '<input type="text" class="search-input" id="searchInput" placeholder="筛选当前版本：如 专业版 / x64 / 企业版" autocomplete="off">' +
      '<span class="search-clear" id="searchClear" title="清空">×</span>';
    container.appendChild(searchBar);
    var searchEmpty = el("div", "search-empty", "没有匹配的镜像，请更换关键词试试。");
    container.appendChild(searchEmpty);

    var list = el("div", "msdn");
    container.appendChild(list);

    function applyFilter() {
      var kw = ($("#searchInput").value || "").trim().toLowerCase();
      $("#searchClear").classList.toggle("show", !!kw);
      var visible = 0;
      $$(".msdn .box", list).forEach(function (box) {
        var hit = !kw || box.textContent.toLowerCase().indexOf(kw) >= 0;
        box.style.display = hit ? "" : "none";
        if (hit) visible++;
      });
      searchEmpty.style.display = visible ? "none" : "block";
    }

    function show(verId) {
      if (!sys.versions.some(function (v) { return v.id === verId; })) {
        verId = (sys.versions[0] || {}).id;
      }
      $$("li", ul).forEach(function (li) {
        li.className = li.getAttribute("data-ver") === verId ? "active" : "";
      });
      var ver = null;
      sys.versions.forEach(function (v) { if (v.id === verId) ver = v; });
      list.innerHTML = "";
      (ver ? ver.items : []).forEach(function (item, idx) {
        list.appendChild(buildBox(item, idx === 0));
      });
      $("#searchInput").value = "";
      $("#searchClear").classList.remove("show");
      searchEmpty.style.display = "none";
    }

    function onHash() {
      show((location.hash || "").replace("#", ""));
    }
    window.addEventListener("hashchange", onHash);
    onHash();

    $("#searchInput").addEventListener("input", applyFilter);
    $("#searchClear").addEventListener("click", function () {
      $("#searchInput").value = "";
      applyFilter();
      $("#searchInput").focus();
    });
  }

  function buildBox(item, isCurrent) {
    var box = el("div", "box" + (isCurrent ? " current" : ""));
    var linkKey = String(item.file || "").replace(/\.iso$/i, "");   /* 与 links.js 的 key 规则一致（Office 镜像保留 .img 后缀） */

    var editions = (item.editions || []).map(function (e) { return "<span>" + esc(e) + "</span>"; }).join("");
    box.innerHTML =
      '<div class="name"><h1>' + esc(item.title) + '</h1><span class="toggle">[详情]</span></div>' +
      '<div class="tag">' +
      '<span class="bit">' + esc(item.bits) + "</span>" +
      '<span class="lang">' + esc(item.lang) + "</span>" +
      '<span class="date">' + esc(item.date) + "</span>" +
      editions +
      "</div>" +
      '<div class="detail">' +
      '<table class="param"><tbody>' +
      paramRow("文件名", item.file) +
      paramRow("SHA-256", item.sha256) +
      paramRow("SHA-1", item.sha1) +
      paramRow("MD5", item.md5) +
      paramRow("文件大小", item.size) +
      "</tbody></table></div>";

    $(".detail", box).appendChild(buildDownload(linkKey));

    box.addEventListener("click", function () {
      if (box.className.indexOf("current") < 0) {
        $$(".msdn .box.current").forEach(function (b) { b.classList.remove("current"); });
        box.classList.add("current");
      }
    });
    return box;
  }

  function paramRow(name, value) {
    return '<tr><td class="param-name">' + esc(name) + '</td><td class="param-value">' + esc(value || "-") + "</td></tr>";
  }

  /* ---------------- 全局事件 ---------------- */
  function bindGlobal() {
    /* 常用网站下拉菜单：点击开关、点击外部或 Esc 收起 */
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      var inDD = false;
      var node = t;
      while (node && node !== document.body) {
        if (node.classList && node.classList.contains("dd")) { inDD = true; break; }
        node = node.parentNode;
      }
      if (!inDD) $$(".dd.open").forEach(function (d) { d.classList.remove("open"); });
      if (t.id === "ddToggle") {
        ev.preventDefault();
        t.parentNode.classList.toggle("open");
      }
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") $$(".dd.open").forEach(function (d) { d.classList.remove("open"); });
    });

    document.addEventListener("click", function (ev) {
      var t = ev.target;
      while (t && t !== document.body) {
        if (t.classList && t.classList.contains("copy")) {
          var id = t.getAttribute("data-copy-target");
          var input = id && document.getElementById(id);
          if (input) copyText(input.value);
          ev.stopPropagation();
          return;
        }
        if (t.classList && t.classList.contains("help")) {
          openDialog(t.getAttribute("data-help"));
          ev.stopPropagation();
          return;
        }
        t = t.parentNode;
      }
    });

    document.addEventListener("click", function (ev) {
      if (ev.target.id === "menuBtn") {
        var side = $(".side");
        side.classList.toggle("open");
      } else if (ev.target.id === "hasherBtn") {
        ev.preventDefault();
        openDialog("hasher");
      } else if (ev.target.id === "favBtn") {
        ev.preventDefault();
        try {
          window.external && window.external.AddFavorite(location.href, document.title);
        } catch (e) {
          toast("请按 Ctrl+D 收藏本站");
        }
      }
    });

    /* 返回顶部 */
    var top = el("div", "back-to-top", "顶部");
    document.body.appendChild(top);
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.addEventListener("scroll", function () {
      top.style.display = window.pageYOffset > 300 ? "block" : "none";
    });
  }

  /* ---------------- 入口 ---------------- */
  function init() {
    renderSkeleton();
    var sysId = currentSystemId();
    if (sysId === "links") { renderLinksPage(); }
    else if (sysId) { renderSystem(); }
    else { renderHome(); }
    bindGlobal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
