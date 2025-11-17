import React, { useState, useEffect, useRef } from 'react'
import { Layout, Menu } from 'antd'
import {
  BarChartOutlined,
  ReadOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  FormOutlined,
  AuditOutlined,
  PieChartOutlined,
  TeamOutlined,
  SettingOutlined,
  ApartmentOutlined,
  SafetyOutlined,
  DeploymentUnitOutlined,
  BookOutlined,
  ProfileOutlined,
  BranchesOutlined,
  SolutionOutlined,
  BankOutlined,
  UserOutlined,
  IdcardOutlined,
  AppstoreOutlined,
  ControlOutlined,
  DatabaseOutlined,
  TableOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  ContainerOutlined
} from '@ant-design/icons'
import { AIHomeIcon, AIBrainIcon } from './AIIcons'
import schoolLogo from '../assets/school-logo.svg'

const { Sider } = Layout

const Sidebar = ({ collapsed, onCollapse, selectedKey, onMenuSelect }) => {
  const [openKeys, setOpenKeys] = useState([])
  const titleRef = useRef(null)
  const [logoSize, setLogoSize] = useState(32)

  // 动态处理父级菜单的选中状态与展开逻辑
  useEffect(() => {
    // 清除所有强制选中样式
    const allSubmenus = document.querySelectorAll('.custom-menu .ant-menu-submenu')
    allSubmenus.forEach(submenu => {
      submenu.classList.remove('force-selected')
    })

    // 如果选中的是父级菜单，添加强制选中样式（只给当前父菜单加样式）
    if (
      selectedKey === 'system-management' ||
      selectedKey === 'academic-management' ||
      selectedKey === 'exam-creation' ||
      selectedKey === 'workflow-management'
    ) {
      const targetText =
        selectedKey === 'system-management'
          ? '系统管理'
          : selectedKey === 'academic-management'
          ? '教务管理'
          : selectedKey === 'exam-creation'
          ? '测评中心'
          : '工作流管理'
      const menuTitles = document.querySelectorAll('.custom-menu .ant-menu-submenu .ant-menu-title-content')
      menuTitles.forEach(title => {
        if (title.textContent === targetText) {
          const submenu = title.closest('.ant-menu-submenu')
          if (submenu) {
            submenu.classList.add('force-selected')
          }
        }
      })
    }

    // 选中工作流二级菜单时，确保父级展开
    if (['dataset2', 'dataset', 'dataset-simple', 'shu-ji', 'playground', 'logs'].includes(selectedKey)) {
      setOpenKeys(['workflow-management'])
    }
  }, [selectedKey])

  const handleMenuClick = ({ key, keyPath }) => {
    // 如果点击的是父级菜单项（有子菜单的项）
    if (
      keyPath.length === 1 &&
      (key === 'system-management' || key === 'academic-management' || key === 'exam-creation' || key === 'workflow-management')
    ) {
      // 互斥逻辑：如果当前菜单已经展开，则收起；否则收起其他菜单并展开当前菜单
      if (openKeys.includes(key)) {
        setOpenKeys([])
        // 如果收起菜单，则不选中任何菜单
        onMenuSelect({ key: 'dashboard', breadcrumb: ['dashboard'] }) // 默认回到数据看板
      } else {
        setOpenKeys([key])
        // 选中父级菜单，确保互斥
        onMenuSelect({ key, breadcrumb: [key] })
      }
    } else if (keyPath.length === 1) {
      // 点击普通一级菜单项（无子菜单），收起所有展开的菜单，实现互斥
      setOpenKeys([])
      onMenuSelect({ key, keyPath, breadcrumb: [key] })
    } else {
      // 子菜单项：选中子项以保持其背景和字体样式，同时保持父菜单展开
      if (keyPath.length > 1) {
        const parentKey = keyPath[keyPath.length - 1]
        // 选中子菜单项，传递父子层级用于面包屑
        onMenuSelect({ key, breadcrumb: [parentKey, key] })
        // 确保父菜单保持展开，实现与其他一级菜单的互斥关系
        setOpenKeys([parentKey])
      }
    }
  }

  const handleOpenChange = (keys) => {
    // 确保只能有一个一级菜单展开（互斥逻辑）
    const rootKeys = ['system-management', 'academic-management', 'exam-creation', 'workflow-management'] // 四个父级菜单
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1)

    if (rootKeys.indexOf(latestOpenKey) === -1) {
      setOpenKeys(keys)
    } else {
      // 仅允许一个根菜单展开
      setOpenKeys(latestOpenKey ? [latestOpenKey] : [])
      // 当通过箭头展开系统管理时，强制选中系统管理，实现与其他一级菜单互斥
      if (latestOpenKey) {
        onMenuSelect({ key: latestOpenKey, breadcrumb: [latestOpenKey] })
      }
    }
  }

  // 动态同步 LOGO 高度与两行文字高度一致，实现上下对齐
  useEffect(() => {
    if (!collapsed && titleRef.current) {
      const h = Math.round(titleRef.current.getBoundingClientRect().height)
      // 设定合理边界，避免过大或过小
      const clamped = Math.max(24, Math.min(40, h))
      setLogoSize(clamped)
    } else {
      // 折叠时采用较小尺寸
      setLogoSize(20)
    }
  }, [collapsed])
  const menuItems = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined style={{ color: '#3B82F6' }} />,
      label: '数据看板',
    },
    {
      key: 'teaching-materials',
      icon: <ReadOutlined style={{ color: '#F59E0B' }} />,
      label: '教辅管理',
    },
    {
      key: 'paper-management',
      icon: <FolderOpenOutlined style={{ color: '#10B981' }} />,
      label: '组卷管理',
    },
    {
      key: 'exam-creation',
      icon: <FormOutlined style={{ color: '#EF4444' }} />,
      label: '测评中心',
      children: [
        {
          key: 'test-management',
          icon: <FileDoneOutlined style={{ color: '#F43F5E' }} />,
          label: '测试管理',
        },
        {
          key: 'question-card-management',
          icon: <TableOutlined style={{ color: '#EAB308' }} />,
          label: '题卡管理',
        },
        {
          key: 'grading-management',
          icon: <AuditOutlined style={{ color: '#06B6D4' }} />,
          label: '批阅管理',
        },
      ],
    },
    {
      key: 'learning-report',
      icon: <PieChartOutlined style={{ color: '#8B5CF6' }} />,
      label: '学情报告',
    },
    {
      key: 'academic-management',
      icon: <TeamOutlined style={{ color: '#6366F1' }} />,
      label: '教务管理',
      children: [
        {
          key: 'edu-phase-info',
          icon: <ProfileOutlined style={{ color: '#60A5FA' }} />,
          label: '学段信息',
        },
        {
          key: 'subject-info',
          icon: <BookOutlined style={{ color: '#F59E0B' }} />,
          label: '学科信息',
        },
        {
          key: 'subject-group-info',
          icon: <BranchesOutlined style={{ color: '#22D3EE' }} />,
          label: '学科组信息',
        },
        {
          key: 'teaching-class-info',
          icon: <SolutionOutlined style={{ color: '#34D399' }} />,
          label: '教学班信息',
        },
        {
          key: 'administrative-class-info',
          icon: <BankOutlined style={{ color: '#F472B6' }} />,
          label: '行政班信息',
        },
        {
          key: 'teacher-info',
          icon: <IdcardOutlined style={{ color: '#A855F7' }} />,
          label: '教师信息',
        },
        {
          key: 'student-info',
          icon: <UserOutlined style={{ color: '#10B981' }} />,
          label: '学生信息',
        },
      ],
    },
    {
      key: 'system-management',
      icon: <SettingOutlined style={{ color: '#14B8A6' }} />,
      label: '系统管理',
      children: [
        {
          key: 'menu-management',
          icon: <AppstoreOutlined style={{ color: '#EF4444' }} />,
          label: '菜单管理',
        },
        {
          key: 'role-management',
          icon: <SafetyOutlined style={{ color: '#6366F1' }} />,
          label: '角色管理',
        },
        {
          key: 'strategy-management',
          icon: <ControlOutlined style={{ color: '#F59E0B' }} />,
          label: '策略管理',
        },
      ],
    },
    {
      key: 'workflow-management',
      icon: <DeploymentUnitOutlined style={{ color: '#0EA5E9' }} />,
      label: '工作流管理',
      children: [
        {
          key: 'dataset2',
          icon: <ContainerOutlined style={{ color: '#F97316' }} />,
          label: '数据集',
        },
        {
          key: 'playground',
          icon: <ExperimentOutlined style={{ color: '#8B5CF6' }} />,
          label: 'Playground',
        },
        {
          key: 'logs',
          icon: <FileSearchOutlined style={{ color: '#3B82F6' }} />,
          label: '日志',
        },
      ],
    },
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={256}
      theme="light"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          height: 64,
          margin: 0,
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: '#000000',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          padding: '0 24px',
        }}
      >
        <img
          src={schoolLogo}
          alt="学校LOGO"
          style={{
            width: logoSize,
            height: logoSize,
            marginRight: !collapsed ? 8 : 0,
            objectFit: 'contain',
          }}
        />
        {!collapsed && (
          <div ref={titleRef} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#000000' }}>启辰测试学校</span>
            <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666666' }}>数智教服综合服务引擎</span>
          </div>
        )}
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        defaultSelectedKeys={['dashboard']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          backgroundColor: '#ffffff',
        }}
        className="custom-menu"
      />
    </Sider>
  )
}

export default Sidebar