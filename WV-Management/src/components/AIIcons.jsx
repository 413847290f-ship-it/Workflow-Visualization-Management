import React from 'react'

// AI生成的现代化图标组件

// 首页图标
export const AIHomeIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

// 用户头像图标
export const AIUserIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" fill="none"/>
    <path 
      d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
)

// 智能机器人图标 (替代用户头像)
export const AIRobotIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="8" width="16" height="12" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    <circle cx="9" cy="13" r="1.5" fill={color}/>
    <circle cx="15" cy="13" r="1.5" fill={color}/>
    <path d="M9 17H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 5V8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="3" r="1" fill={color}/>
  </svg>
)

// 智能助手图标
export const AIAssistantIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
  </svg>
)

// 现代化数据图标
export const AIDataIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 3V21H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 14L12 9L16 13L21 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="7" cy="14" r="2" fill={color}/>
    <circle cx="12" cy="9" r="2" fill={color}/>
    <circle cx="16" cy="13" r="2" fill={color}/>
    <circle cx="21" cy="8" r="2" fill={color}/>
  </svg>
)

// 智能大脑图标
export const AIBrainIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path 
      d="M9.5 2C7.01472 2 5 4.01472 5 6.5C5 7.14 5.13 7.75 5.36 8.3C4.55 9.1 4 10.24 4 11.5C4 13.43 5.57 15 7.5 15H8.5C9.33 15 10 15.67 10 16.5S9.33 18 8.5 18H7C5.9 18 5 18.9 5 20S5.9 22 7 22H17C18.1 22 19 21.1 19 20S18.1 18 17 18H15.5C14.67 18 14 17.33 14 16.5S14.67 15 15.5 15H16.5C18.43 15 20 13.43 20 11.5C20 10.24 19.45 9.1 18.64 8.3C18.87 7.75 19 7.14 19 6.5C19 4.01472 16.9853 2 14.5 2C13.5 2 12.6 2.4 11.9 3C11.3 2.4 10.5 2 9.5 2Z" 
      stroke={color} 
      strokeWidth="2" 
      fill="none"
    />
    <circle cx="9" cy="8" r="1" fill={color}/>
    <circle cx="15" cy="8" r="1" fill={color}/>
    <path d="M9 12C10 13 11 13 12 12C13 13 14 13 15 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// 学校Logo图标
export const SchoolLogoIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    {/* 外层圆形边框 */}
    <circle cx="50" cy="50" r="45" 
            fill="none" 
            stroke="url(#borderGradient)" 
            strokeWidth="3"/>
    
    {/* 渐变定义 */}
    <defs>
      <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#8B5CF6', stopOpacity:1}} />
        <stop offset="25%" style={{stopColor:'#EC4899', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#F97316', stopOpacity:1}} />
        <stop offset="75%" style={{stopColor:'#10B981', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
      </linearGradient>
      
      <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#F97316', stopOpacity:1}} />
        <stop offset="25%" style={{stopColor:'#EAB308', stopOpacity:1}} />
        <stop offset="50%" style={{stopColor:'#10B981', stopOpacity:1}} />
        <stop offset="75%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
        <stop offset="100%" style={{stopColor:'#8B5CF6', stopOpacity:1}} />
      </linearGradient>
    </defs>
    
    {/* 五角星 */}
    <polygon points="50,15 52,22 59,22 54,27 56,34 50,30 44,34 46,27 41,22 48,22" fill="#DC2626"/>
    <polygon points="25,25 27,32 34,32 29,37 31,44 25,40 19,44 21,37 16,32 23,32" fill="#EA580C"/>
    <polygon points="75,25 77,32 84,32 79,37 81,44 75,40 69,44 71,37 66,32 73,32" fill="#16A34A"/>
    <polygon points="20,65 22,72 29,72 24,77 26,84 20,80 14,84 16,77 11,72 18,72" fill="#9333EA"/>
    <polygon points="80,65 82,72 89,72 84,77 86,84 80,80 74,84 76,77 71,72 78,72" fill="#2563EB"/>
    
    {/* 中心圆形区域 */}
    <circle cx="50" cy="50" r="20" fill="none" stroke="url(#circleGradient)" strokeWidth="2"/>
    
    {/* 人形图标 */}
    <circle cx="50" cy="42" r="3" fill="#1E3A8A"/>
    <path d="M50 46 L45 55 L47 65 L53 65 L55 55 Z" fill="#1E3A8A"/>
    
    {/* 齿轮图标 */}
    <g transform="translate(62, 58)">
      <circle cx="0" cy="0" r="6" fill="none" stroke="#1E3A8A" strokeWidth="2"/>
      <circle cx="0" cy="0" r="2" fill="#1E3A8A"/>
      <rect x="-1" y="-8" width="2" height="3" fill="#1E3A8A"/>
      <rect x="-1" y="5" width="2" height="3" fill="#1E3A8A"/>
      <rect x="-8" y="-1" width="3" height="2" fill="#1E3A8A"/>
      <rect x="5" y="-1" width="3" height="2" fill="#1E3A8A"/>
    </g>
    
    {/* 波浪线 */}
    <path d="M30 55 Q40 50, 50 55 T70 55" fill="none" stroke="url(#circleGradient)" strokeWidth="2"/>
    <path d="M30 60 Q40 55, 50 60 T70 60" fill="none" stroke="url(#circleGradient)" strokeWidth="1.5"/>
    <path d="M30 65 Q40 60, 50 65 T70 65" fill="none" stroke="url(#circleGradient)" strokeWidth="1"/>
  </svg>
)

// 自由对比图标
export const CompareIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="8" height="6" rx="2" stroke={color} strokeWidth="2"/>
    <rect x="13" y="13" width="8" height="6" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M9 8H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 16H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 4L14 6L12 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 20L10 18L12 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// 退出自由对比图标
export const ExitCompareIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="7" height="6" rx="2" stroke={color} strokeWidth="2"/>
    <rect x="13" y="13" width="7" height="6" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M9 8H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M10 16H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M18 6L20 8L18 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14L4 16L6 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 8H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 16H12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

// 运行图标
export const AIRunIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 3L19 12L5 21V3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none"/>
  </svg>
)

// 文件夹图标
export const AIFolderIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 7V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V9C20 7.89543 19.1046 7 18 7H12L10 4H6C4.89543 4 4 4.89543 4 6V7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)