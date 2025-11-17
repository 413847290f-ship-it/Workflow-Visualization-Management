import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App.jsx'
import './index.css'

// Ant Design 主题配置
const theme = {
  token: {
    // 主色调
    colorPrimary: '#1453E4',
    // 成功色
    colorSuccess: '#52c41a',
    // 警告色
    colorWarning: '#faad14',
    // 错误色
    colorError: '#ff4d4f',
    // 信息色
    colorInfo: '#1453E4',
    // 边框圆角
    borderRadius: 6,
    // 字体大小
    fontSize: 14,
    // 组件高度
    controlHeight: 32,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Menu: {
      itemBg: '#ffffff',
      itemSelectedBg: '#e6f7ff',
      itemSelectedColor: '#1453E4',
      itemHoverBg: '#f5f5f5',
      itemColor: '#333333',
      itemActiveBg: '#e6f7ff',
      groupTitleColor: '#333333',
      groupTitleFontSize: 14,
    },
    Button: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN} theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)