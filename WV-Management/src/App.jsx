import React, { useState } from 'react'
import { Layout, theme, Avatar, Dropdown, Space, Tabs, Button } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { AIRobotIcon, AIAssistantIcon } from './components/AIIcons'
import Sidebar from './components/Sidebar'
import ContentArea from './components/ContentArea'

const { Header, Content } = Layout

function App() {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState('dashboard')
  const [breadcrumbKeys, setBreadcrumbKeys] = useState(['dashboard'])
  const [workflowTab, setWorkflowTab] = useState('dataset')
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleMenuSelect = ({ key, breadcrumb }) => {
    // 工作流管理与其子级的选择逻辑
    if (key === 'workflow-management') {
      setSelectedMenu('workflow-management')
      setBreadcrumbKeys(['workflow-management'])
      return
    }
    if (['dataset2', 'dataset', 'dataset-simple', 'shu-ji', 'playground', 'logs'].includes(key)) {
      setSelectedMenu(key)
      setWorkflowTab(key === 'dataset-simple' ? 'dataset' : key)
      setBreadcrumbKeys(['workflow-management', key])
      return
    }

    // 默认：其它菜单按原面包屑行为处理
    setSelectedMenu(key)
    setBreadcrumbKeys(Array.isArray(breadcrumb) && breadcrumb.length ? breadcrumb : [key])
  }

  // 面包屑点击导航到对应菜单或三级Tab
  const handleBreadcrumbNavigate = (key) => {
    if (key === 'dashboard') {
      setSelectedMenu('dashboard')
      setBreadcrumbKeys(['dashboard'])
      return
    }
    // 工作流管理与其子级
    if (key === 'workflow-management') {
      setSelectedMenu('workflow-management')
      setBreadcrumbKeys(['workflow-management'])
      return
    }
    if (['dataset2', 'dataset', 'dataset-simple', 'shu-ji', 'playground', 'logs'].includes(key)) {
      setSelectedMenu(key)
      setWorkflowTab(key === 'dataset-simple' ? 'dataset' : key)
      setBreadcrumbKeys(['workflow-management', key])
      return
    }
    // 默认：直接跳转到对应菜单
    setSelectedMenu(key)
    setBreadcrumbKeys([key])
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        selectedKey={selectedMenu}
        onMenuSelect={handleMenuSelect}
      />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 256,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: 24,
          }}
        >
          <div style={{ paddingLeft: 24, display: 'flex', alignItems: 'center' }} >
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
              open={userMenuOpen}
              onOpenChange={setUserMenuOpen}
            >
              <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 6, transition: 'background-color 0.2s', gap: 8 }}>
                <Avatar 
                  size={32}
                  icon={<UserOutlined style={{ color: '#000' }} />}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #d9d9d9' }}
                />
                <span style={{ color: '#333', fontWeight: 500 }}>管理员</span>
                <DownOutlined style={{ color: '#8c8c8c', transition: 'transform 0.2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }} />
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 0,
            minHeight: 280,
            background: '#f0f2f5',
            overflow: 'auto',
          }}
        >
          <ContentArea 
            selectedMenu={selectedMenu} 
            breadcrumbKeys={breadcrumbKeys} 
            onBreadcrumbNavigate={handleBreadcrumbNavigate}
            workflowTab={workflowTab}
          />
        </Content>
      </Layout>
    </Layout>
  )
}

export default App