/* ============================================================
 *  底部友情链接 —— 全站统一展示，增删链接只改这里即可
 * ============================================================ */
window.FRIEND_LINKS = [
  { name: "电脑小百科", url: "https://xiaobaike.dpdns.org/" },
  { name: "国外十大VPS推荐", url: "https://1000.vps.cd/" }
];

/* ============================================================
 *  常用网站导航数据 —— 站内"常用网站"下拉菜单与"网站导航"页共用
 *  quick: true 的站点会同时出现在顶栏下拉菜单中
 * ============================================================ */
window.NAV_SITES = [
  {
    cat: "常用工具 · 站点推荐",
    sites: [
      { name: "封面在线生成", url: "https://diy.ee.cd/", desc: "封面图片在线制作", badge: "推荐", quick: true },
      { name: "笔记卡片生成", url: "https://diy.ee.cd/note.html", desc: "笔记卡片在线制作", badge: "推荐", quick: true },
      { name: "常用软件下载", url: "https://xiaobaike.dpdns.org/", desc: "常用软件一站下载", badge: "推荐", quick: true },
      { name: "2026 海外 VPS 推荐", url: "https://1000.vps.cd/", desc: "海外 VPS 测评与推荐", badge: "推荐", quick: true }
    ]
  },
  {
    cat: "微软官方 · Windows",
    sites: [
      { name: "Windows 11 下载", url: "https://www.microsoft.com/zh-cn/software-download/windows11", desc: "官方镜像与安装助手", badge: "官方" },
      { name: "Windows 10 下载", url: "https://www.microsoft.com/zh-cn/software-download/windows10", desc: "官方镜像与媒体创建工具", badge: "官方" },
      { name: "Microsoft 更新目录", url: "https://www.catalog.update.microsoft.com/", desc: "累积更新 / 驱动离线包", badge: "官方" },
      { name: "Microsoft 支持", url: "https://support.microsoft.com/zh-cn", desc: "官方帮助与故障排查", badge: "官方" },
      { name: "Windows 生命周期", url: "https://learn.microsoft.com/lifecycle/", desc: "产品支持周期查询", badge: "官方" }
    ]
  },
  {
    cat: "微软官方 · 办公与开发",
    sites: [
      { name: "Microsoft 365", url: "https://www.microsoft.com/zh-cn/microsoft-365", desc: "Office / 365 官方页面", badge: "官方" },
      { name: "Microsoft 账户", url: "https://account.microsoft.com/", desc: "账户、设备与密钥管理", badge: "官方" },
      { name: "Visual Studio 下载", url: "https://visualstudio.microsoft.com/zh-hans/downloads/", desc: "IDE 与生成工具", badge: "官方" },
      { name: ".NET 下载", url: "https://dotnet.microsoft.com/download", desc: ".NET 运行时与 SDK", badge: "官方" },
      { name: "Edge 浏览器", url: "https://www.microsoft.com/edge/download", desc: "官方下载", badge: "官方" }
    ]
  },
  {
    cat: "启动盘与刻录工具",
    sites: [
      { name: "Rufus", url: "https://rufus.ie/zh/", desc: "轻量 U 盘启动盘制作" },
      { name: "Ventoy", url: "https://www.ventoy.net/cn/", desc: "多系统 U 盘，拷入 ISO 即用" },
      { name: "UltraISO 软碟通", url: "https://cn.ezbsystems.com/ultraiso/", desc: "ISO 编辑与刻录" },
      { name: "7-Zip", url: "https://www.7-zip.org/", desc: "免费压缩工具，可直接解压 ISO" }
    ]
  },
  {
    cat: "硬件检测与校验",
    sites: [
      { name: "CPU-Z", url: "https://www.cpuid.com/softwares/cpu-z.html", desc: "CPU / 内存 / 主板信息" },
      { name: "CrystalDiskInfo", url: "https://crystalmark.info/", desc: "硬盘健康状态监测" },
      { name: "HashTab", url: "http://implbits.com/HashTab/", desc: "右键菜单 SHA-1 / MD5 校验" }
    ]
  },
  {
    cat: "显卡与芯片组驱动",
    sites: [
      { name: "NVIDIA 驱动", url: "https://www.nvidia.cn/Download/", desc: "GeForce / Studio 驱动", badge: "官方" },
      { name: "AMD 驱动", url: "https://www.amd.com/zh-hans/support", desc: " Radeon 显卡与芯片组", badge: "官方" },
      { name: "Intel 下载中心", url: "https://www.intel.com/content/www/cn/zh/download-center/home.html", desc: "核显 / 无线网卡驱动", badge: "官方" }
    ]
  },
  {
    cat: "社区与镜像资源",
    sites: [
      { name: "Microsoft Learn", url: "https://learn.microsoft.com/zh-cn/", desc: "官方文档与教程", badge: "官方" },
      { name: "Answers 微软社区", url: "https://answers.microsoft.com/zh-hans", desc: "官方问答社区", badge: "官方" },
      { name: "MSDN, i tell you", url: "https://next.itellyou.cn/", desc: "知名原版镜像索引站" }
    ]
  }
];
