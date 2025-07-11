import { MessageCodec, getAllQueryString } from 'ranuts/utils';
import { handleDocumentOperation, initX2T, loadEditorApi, loadScript } from './lib/x2t';
import { setDocmentObj } from './store';

interface EditorParams {
  action: 'upload' | 'new';
  fileType?: string;
  external?: string; // 是否来自外部调用
}

declare global {
  interface Window {
    DocsAPI: {
      DocEditor: new (elementId: string, config: any) => any;
    };
  }
}

// 隐藏加载界面
const hideLoading = () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
};

// 显示错误信息
const showError = (message?: string) => {
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorMessage = document.getElementById('error-message');
  
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
  
  if (errorMessage) {
    if (message) {
      const errorDescription = errorMessage.querySelector('.error-description');
      if (errorDescription) {
        errorDescription.textContent = message;
      }
    }
    errorMessage.style.display = 'block';
  }
};

// 获取URL参数
const getUrlParams = (): EditorParams | null => {
  const params = getAllQueryString();
  const action = params.action as 'upload' | 'new';
  
  if (!action || (action !== 'upload' && action !== 'new')) {
    return null;
  }
  
  return {
    action,
    fileType: params.fileType,
    external: params.external,
  };
};

// 创建文件选择UI
const createFileSelector = (): { overlay: HTMLElement; container: HTMLElement } => {
  // 创建背景遮罩
  const overlay = document.createElement('div');
  overlay.className = 'file-selector-overlay';
  
  // 创建主容器
  const container = document.createElement('div');
  container.className = 'file-selector-container';
  container.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 48px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 500px;
    z-index: 1002;
  `;
  
  container.innerHTML = `
    <div class="file-selector-icon" style="font-size: 64px; margin-bottom: 24px;">📁</div>
    <h2 style="font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">选择要编辑的文档</h2>
    <p style="color: #666; line-height: 1.5; margin: 0 0 32px 0;">
      支持 Word (.docx, .doc)、Excel (.xlsx, .xls)、PowerPoint (.pptx, .ppt) 等格式
    </p>
    <input type="file" id="file-input" accept=".docx,.xlsx,.pptx,.doc,.xls,.ppt" style="display: none;">
    <button id="select-file-btn" class="select-file-button" style="
      background: #1890ff;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-right: 16px;
    ">选择文件</button>
    <button id="cancel-btn" class="cancel-button" style="
      background: #f5f5f5;
      color: #666;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    ">取消</button>
  `;
  
  // 将容器添加到遮罩中
  overlay.appendChild(container);
  
  return { overlay, container };
};

// 处理文档上传 - 显示文件选择器
const handleUpload = async (params: EditorParams) => {
  try {
    hideLoading();
    
    // 创建文件选择器UI
    const { overlay, container } = createFileSelector();
    document.body.appendChild(overlay);
    
    // 获取文件输入元素和按钮
    const fileInput = container.querySelector('#file-input') as HTMLInputElement;
    const selectBtn = container.querySelector('#select-file-btn') as HTMLButtonElement;
    const cancelBtn = container.querySelector('#cancel-btn') as HTMLButtonElement;
    
    // 点击选择文件按钮
    selectBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // 取消按钮 - 关闭页面
    cancelBtn.addEventListener('click', () => {
      window.close();
    });
    
    // 文件选择处理
    fileInput.addEventListener('change', async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // 移除文件选择器UI
          document.body.removeChild(overlay);
          
          // 显示加载状态
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            const loadingText = loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
              loadingText.textContent = '正在加载文档...';
            }
          }
          
          setDocmentObj({
            fileName: file.name,
            file: file,
            url: window.URL.createObjectURL(file),
          });
          
          await initX2T();
          await handleDocumentOperation({ 
            file: file, 
            fileName: file.name, 
            isNew: false 
          });
          
          hideLoading();
        } catch (error) {
          console.error('File processing failed:', error);
          showError(`文件处理失败：${error.message}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Upload initialization failed:', error);
    showError(`初始化失败：${error.message}`);
  }
};

// 处理新建文档
const handleNewDocument = async (params: EditorParams) => {
  try {
    if (!params.fileType) {
      throw new Error('缺少文件类型信息');
    }
    
    const fileName = `新建文档${params.fileType}`;
    
    setDocmentObj({
      fileName: fileName,
      file: undefined,
    });
    
    await loadScript();
    await loadEditorApi();
    await initX2T();
    await handleDocumentOperation({ 
      file: undefined, 
      fileName: fileName, 
      isNew: true 
    });
    
    hideLoading();
  } catch (error) {
    console.error('Create new document failed:', error);
    showError(`创建新文档失败：${error.message}`);
  }
};

// 初始化编辑器
const initEditor = async () => {
  try {
    const params = getUrlParams();
    
    if (!params) {
      throw new Error('无效的URL参数');
    }
    
    if (params.action === 'upload') {
      await handleUpload(params);
    } else if (params.action === 'new') {
      await handleNewDocument(params);
    }
  } catch (error) {
    console.error('Editor initialization failed:', error);
    showError(`初始化失败：${error.message}`);
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initEditor);

// 处理页面关闭前的清理
window.addEventListener('beforeunload', () => {
  if (window.editor) {
    window.editor.destroyEditor();
  }
}); 