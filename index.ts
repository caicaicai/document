import { MessageCodec, Platform, getAllQueryString } from 'ranuts/utils';
import type { MessageHandler } from 'ranuts/utils';
import { setDocmentObj } from './store';
import 'ranui/button';
import './styles/base.css';

interface RenderOfficeData {
  chunkIndex: number;
  data: string;
  lastModified: number;
  name: string;
  size: number;
  totalChunks: number;
  type: string;
}

declare global {
  interface Window {
    onCreateNew: (ext: string) => Promise<void>;
    DocsAPI: {
      DocEditor: new (elementId: string, config: any) => any;
    };
  }
}

let fileChunks: RenderOfficeData[] = [];

const events: Record<string, MessageHandler<any, unknown>> = {
  RENDER_OFFICE: async (data: RenderOfficeData) => {
    // 处理来自外部的文档渲染请求
    fileChunks.push(data);
    if (fileChunks.length >= data.totalChunks) {
      const file = await MessageCodec.decodeFileChunked(fileChunks);
      
      // 生成唯一的文件ID
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 读取文件为ArrayBuffer，然后转换为base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      const base64Data = btoa(binaryString);
      
      // 将文件数据存储到sessionStorage
      sessionStorage.setItem(fileId, JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
        fileData: base64Data
      }));
      
      // 构建编辑器URL
      const url = new URL('./editor.html', window.location.href);
      url.searchParams.set('action', 'upload');
      url.searchParams.set('fileId', fileId);
      
      // 在新页面打开编辑器
      window.open(url.toString(), '_blank');
      
      fileChunks = [];
    }
  },
  CLOSE_EDITOR: () => {
    fileChunks = [];
    // 编辑器现在在新页面中，无需处理
  },
};

Platform.init(events);

const { file } = getAllQueryString();

const onCreateNew = async (ext: string) => {
  const fileName = `新建文档${ext}`;
  const url = new URL('./editor.html', window.location.href);
  url.searchParams.set('action', 'new');
  url.searchParams.set('fileName', fileName);
  url.searchParams.set('fileType', ext);
  
  // 在新页面打开编辑器
  window.open(url.toString(), '_blank');
};
// example: window.onCreateNew('.docx')
// example: window.onCreateNew('.xlsx')
// example: window.onCreateNew('.pptx')
window.onCreateNew = onCreateNew;

// Create a single file input element
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.docx,.xlsx,.pptx,.doc,.xls,.ppt';
fileInput.style.setProperty('visibility', 'hidden');
document.body.appendChild(fileInput);

const onOpenDocument = async () => {
  return new Promise((resolve) => {
    // 触发文件选择器的点击事件
    fileInput.click();
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 生成唯一的文件ID
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // 读取文件为ArrayBuffer，然后转换为base64
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
          const base64Data = btoa(binaryString);
          
          // 将文件数据存储到sessionStorage
          sessionStorage.setItem(fileId, JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            lastModified: file.lastModified,
            fileData: base64Data
          }));
          
          // 构建编辑器URL
          const url = new URL('./editor.html', window.location.href);
          url.searchParams.set('action', 'upload');
          url.searchParams.set('fileId', fileId);
          
          // 在新页面打开编辑器
          window.open(url.toString(), '_blank');
          resolve(true);
        } catch (error) {
          console.error('Failed to process file:', error);
          alert('文件处理失败，请重试');
        }
        
        // 清空文件选择，这样同一个文件可以重复选择
        fileInput.value = '';
      }
    };
  });
};

// Create and append the professional homepage
const createHomepage = () => {
  const homepage = document.createElement('div');
  homepage.id = 'homepage';
  homepage.className = 'homepage-container';
  
  homepage.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#gradient1)"/>
                <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h12v2H8v-2z" fill="white"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#1890ff"/>
                    <stop offset="100%" style="stop-color:#096dd9"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="logo-text">OnlyOffice Web</h1>
          </div>
          <nav class="nav">
            <a href="#features" class="nav-link">功能特性</a>
            <a href="#how-it-works" class="nav-link">使用方法</a>
            <a href="https://github.com/ranuts/document" class="nav-link" target="_blank">GitHub</a>
          </nav>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h2 class="hero-title">
              强大的在线文档编辑器
              <span class="hero-subtitle">完全本地化，隐私优先</span>
            </h2>
            <p class="hero-description">
              基于 OnlyOffice 的现代化文档编辑器，支持 Word、Excel、PowerPoint 等多种格式。
              所有处理都在您的浏览器中完成，无需上传到服务器，保护您的隐私安全。
            </p>
            <div class="hero-actions">
              <div class="action-buttons">
                <r-button class="btn-primary" id="upload-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l3 3h-2v4H7V4H5l3-3z" fill="currentColor"/>
                    <path d="M4 9v4h8V9h1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V9h1z" fill="currentColor"/>
                  </svg>
                  上传文档
                </r-button>
                <div class="new-document-group">
                  <r-button class="btn-secondary" id="new-word-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="2" width="10" height="12" rx="1" fill="currentColor"/>
                      <rect x="4" y="4" width="8" height="1" fill="white"/>
                      <rect x="4" y="6" width="8" height="1" fill="white"/>
                      <rect x="4" y="8" width="6" height="1" fill="white"/>
                    </svg>
                    新建 Word
                  </r-button>
                  <r-button class="btn-secondary" id="new-excel-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="1" fill="currentColor"/>
                      <line x1="2" y1="6" x2="14" y2="6" stroke="white"/>
                      <line x1="2" y1="10" x2="14" y2="10" stroke="white"/>
                      <line x1="6" y1="2" x2="6" y2="14" stroke="white"/>
                      <line x1="10" y1="2" x2="10" y2="14" stroke="white"/>
                    </svg>
                    新建 Excel
                  </r-button>
                  <r-button class="btn-secondary" id="new-ppt-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="3" width="12" height="10" rx="1" fill="currentColor"/>
                      <rect x="4" y="5" width="8" height="2" fill="white"/>
                      <rect x="4" y="8" width="5" height="1" fill="white"/>
                      <rect x="4" y="10" width="6" height="1" fill="white"/>
                    </svg>
                    新建 PowerPoint
                  </r-button>
                </div>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-image">
              <div class="document-preview">
                <div class="document-header">
                  <div class="document-controls">
                    <div class="control-dot red"></div>
                    <div class="control-dot yellow"></div>
                    <div class="control-dot green"></div>
                  </div>
                  <div class="document-title">文档编辑器</div>
                </div>
                <div class="document-content">
                  <div class="document-toolbar">
                    <div class="toolbar-group">
                      <div class="toolbar-item"></div>
                      <div class="toolbar-item"></div>
                      <div class="toolbar-item"></div>
                    </div>
                    <div class="toolbar-group">
                      <div class="toolbar-item"></div>
                      <div class="toolbar-item"></div>
                    </div>
                  </div>
                  <div class="document-body">
                    <div class="document-line long"></div>
                    <div class="document-line"></div>
                    <div class="document-line medium"></div>
                    <div class="document-line"></div>
                    <div class="document-line long"></div>
                    <div class="document-line short"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-header">
          <h3 class="section-title">核心功能特性</h3>
          <p class="section-description">为您提供完整的文档编辑解决方案</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h4 class="feature-title">隐私优先</h4>
            <p class="feature-description">所有文档处理都在本地浏览器中完成，绝不上传到服务器，保护您的数据隐私。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📝</div>
            <h4 class="feature-title">多格式支持</h4>
            <p class="feature-description">支持 DOCX、XLSX、PPTX 等主流办公文档格式，满足各种文档编辑需求。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h4 class="feature-title">实时编辑</h4>
            <p class="feature-description">流畅的实时编辑体验，即时保存，让您的创作不间断。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h4 class="feature-title">无需部署</h4>
            <p class="feature-description">纯前端架构，无需服务器部署，打开浏览器即可使用。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h4 class="feature-title">即开即用</h4>
            <p class="feature-description">无需注册登录，无需下载安装，访问网页即可开始编辑文档。</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔧</div>
            <h4 class="feature-title">功能完整</h4>
            <p class="feature-description">提供完整的文档编辑功能，包括格式设置、图片插入、表格制作等。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works Section -->
    <section class="how-it-works" id="how-it-works">
      <div class="container">
        <div class="section-header">
          <h3 class="section-title">如何使用</h3>
          <p class="section-description">简单三步，开始您的文档编辑之旅</p>
        </div>
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4 class="step-title">上传或新建</h4>
              <p class="step-description">点击"上传文档"打开现有文件，或选择"新建"创建空白文档</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4 class="step-title">编辑文档</h4>
              <p class="step-description">使用完整的编辑工具对文档进行修改，支持格式设置、插入图片等</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4 class="step-title">保存下载</h4>
              <p class="step-description">编辑完成后，点击保存按钮即可下载编辑后的文档到本地</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-left">
            <p>&copy; 2024 OnlyOffice Web. 基于 OnlyOffice 开源项目构建</p>
          </div>
          <div class="footer-right">
            <a href="https://github.com/ranuts/document" target="_blank" class="footer-link">GitHub</a>
            <a href="https://github.com/ONLYOFFICE/web-apps" target="_blank" class="footer-link">OnlyOffice</a>
          </div>
        </div>
      </div>
    </footer>
  `;

  // Add event listeners
  const uploadBtn = homepage.querySelector('#upload-btn');
  const newWordBtn = homepage.querySelector('#new-word-btn');
  const newExcelBtn = homepage.querySelector('#new-excel-btn');
  const newPptBtn = homepage.querySelector('#new-ppt-btn');

  uploadBtn?.addEventListener('click', onOpenDocument);
  newWordBtn?.addEventListener('click', () => onCreateNew('.docx'));
  newExcelBtn?.addEventListener('click', () => onCreateNew('.xlsx'));
  newPptBtn?.addEventListener('click', () => onCreateNew('.pptx'));

  // Add smooth scrolling for navigation links
  const navLinks = homepage.querySelectorAll('a[href^="#"]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      const targetElement = document.getElementById(targetId || '');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Insert homepage at the beginning of body
  document.body.insertBefore(homepage, document.body.firstChild);
};

// Initialize the containers
createHomepage();

if (!file) {
  // Don't automatically open document dialog, let user choose
  // onOpenDocument();
} else {
  setDocmentObj({
    fileName: Math.random().toString(36).substring(2, 15),
    url: file,
  });
}
