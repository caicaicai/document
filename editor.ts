import { MessageCodec, getAllQueryString } from 'ranuts/utils';
import { handleDocumentOperation, initX2T, loadEditorApi, loadScript } from './lib/x2t';
import { setDocmentObj } from './store';

interface EditorParams {
  action: 'upload' | 'new';
  fileName?: string;
  fileType?: string;
  fileId?: string; // Session storage key for file data
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
    fileName: params.fileName,
    fileType: params.fileType,
    fileId: params.fileId,
  };
};

// 从sessionStorage获取文件数据
const getFileFromStorage = (key: string): File | null => {
  try {
    const data = sessionStorage.getItem(key);
    if (!data) {
      console.error('No data found in sessionStorage for key:', key);
      return null;
    }
    
    const { fileName, fileType, fileSize, lastModified, fileData } = JSON.parse(data);
    console.log('Retrieved from storage:', { fileName, fileType, fileSize, fileDataLength: fileData?.length });
    
    // 清理sessionStorage
    sessionStorage.removeItem(key);
    
    // 从base64字符串重建文件
    try {
      if (typeof fileData !== 'string') {
        throw new Error('FileData is not a string');
      }
      
      // 解码base64字符串
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // 创建File对象，包含原始元数据
      const fileOptions: FilePropertyBag = {
        type: fileType,
        lastModified: lastModified
      };
      
      const reconstructedFile = new File([bytes], fileName, fileOptions);
      
      console.log('Successfully reconstructed file:', {
        name: reconstructedFile.name,
        type: reconstructedFile.type,
        size: reconstructedFile.size,
        lastModified: reconstructedFile.lastModified
      });
      
      return reconstructedFile;
    } catch (error) {
      console.error('Failed to reconstruct file:', error);
      return null;
    }
  } catch (error) {
    console.error('Failed to get file from storage:', error);
    return null;
  }
};

// 处理文档上传
const handleUpload = async (params: EditorParams) => {
  try {
    let file: File | null = null;
    
    if (params.fileId) {
      // 从sessionStorage获取文件数据
      file = getFileFromStorage(params.fileId);
    }
    
    if (!file) {
      throw new Error('无法获取文件数据');
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
    console.error('Upload failed:', error);
    showError(`上传失败：${error.message}`);
  }
};

// 处理新建文档
const handleNewDocument = async (params: EditorParams) => {
  try {
    if (!params.fileType) {
      throw new Error('缺少文件类型信息');
    }
    
    const fileName = params.fileName || `新建文档${params.fileType}`;
    
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