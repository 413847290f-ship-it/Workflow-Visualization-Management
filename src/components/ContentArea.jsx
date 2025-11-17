import React, { useState, useEffect, useRef, useMemo } from 'react'
  import {
    Card,
    Table,
    Button,
    Input,
    Select,
    DatePicker,
    Space,
    Row,
    Col,
    Breadcrumb,
    Dropdown,
    message,
    Modal,
    Form,
    Upload,
    Radio,
    Tabs,
    List,
    Tag,
    Checkbox,
    Switch,
    Tooltip,
    Drawer,
    Badge
  } from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  MoreOutlined,
  SafetyOutlined,
  UploadOutlined,
  UpOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  FolderOpenOutlined,
  BranchesOutlined,
  StarOutlined,
  ClockCircleOutlined,
  Loading3QuartersOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  TagOutlined
} from '@ant-design/icons'
import { EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import ShuJiList from './pages/ShuJiList'
import { CompareIcon, ExitCompareIcon, AIDataIcon, AIRunIcon, AIFolderIcon } from './AIIcons'
import { Resizable } from 'react-resizable'
import 'react-resizable/css/styles.css'

const { RangePicker } = DatePicker
const { Option } = Select

// 标签体系：学科 × 题型 组合与黑名单
const TAG_BLACKLIST = new Set(['OCR', '手写体', '批改', '英语计算题', '历史计算题', '地理作文题'])
const TAG_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const TAG_TYPES = ['选择题', '填空题', '计算题', '阅读题', '作文题', '判断题']
const DEFAULT_TAG = '生物填空题'
// 允许的标签：不在黑名单且不包含“计算题”字样
const isTagAllowed = (t) => !!t && !TAG_BLACKLIST.has(t) && !String(t).includes('计算题')
// 通用批阅与 OCR 识别的允许标签集合（白名单）
const GENERAL_GRADING_TAGS = ['英语默写', '语文微写作', '语文全开放式题', '语文语义相近题', '语文作文题', '数学简答题']
const OCR_RECOGNITION_TAGS = ['语文作文题', '数学填空题', '数学简答题', '语文学科', '英语学科']
// 根据当前页签返回允许的标签集合
const getTagOptionsForTab = (tabKey) => (tabKey === 'image' ? OCR_RECOGNITION_TAGS : GENERAL_GRADING_TAGS).filter(isTagAllowed)
const DEFAULT_TAG_OPTIONS = TAG_SUBJECTS
  .flatMap(s => TAG_TYPES.map(t => `${s}${t}`))
  .filter(isTagAllowed)

// 示例数据与占位图生成（文本/图片）
const svgPlaceholder = (text) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#2f54eb"/><text x="50%" y="50%" font-size="48" fill="#fff" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`
  )

const generateTextSampleItems = (count = 15) => {
  const ts = dayjs().format('YYYYMMDDHHmmss')
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const creators = ['管理员', '教务处', '系统管理员', '张老师', '李老师', '王老师', '数据组']
  const tagPool = GENERAL_GRADING_TAGS.filter(isTagAllowed)
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: count }).map((_, i) => {
    const idx = i + 1
    const suffix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)]
    const displayId = `${ts}${suffix}`
    const pickTags = () => {
      const shuffled = [...tagPool].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, 1)
    }
    return {
      key: `seed-text-${ts}-${idx}`,
      id: `T${ts}${String(idx).padStart(4, '0')}`,
      displayId,
      type: 'text',
      input: `学生作答示例${idx}`,
      question: `原题示例${idx}`,
      correctAnswer: `正确答案示例${idx}`,
      fullScore: 100,
      imageUrl: undefined,
      checkStatus: Math.random() < 0.5 ? '已核查' : '未核查',
      updateTime: now,
      createTime: now,
      creator: creators[idx % creators.length],
      tags: pickTags()
    }
  })
}

const generateImageSampleItems = (count = 4) => {
  const ts = dayjs().format('YYYYMMDDHHmmss')
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const creators = ['管理员', '教务处', '系统管理员', '张老师', '李老师', '王老师', '数据组']
  const tagPool = OCR_RECOGNITION_TAGS.filter(isTagAllowed)
  const letters = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({ length: count }).map((_, i) => {
    const idx = i + 1
    const id = `i${ts}${String(idx).padStart(4, '0')}`
    const suffix = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)]
    const displayId = `${ts}${suffix}`
    const pickTags = () => {
      const shuffled = [...tagPool].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, 1)
    }
    return {
      key: `seed-image-${ts}-${idx}`,
      id,
      displayId,
      type: 'image',
      input: `图片：示例图片-${String(idx).padStart(2, '0')}.png`,
      question: '',
      correctAnswer: '',
      fullScore: '',
      imageUrl: svgPlaceholder(`示例图片 ${idx}`),
      recognition: `示例图片 ${idx}`,
      checkStatus: Math.random() < 0.5 ? '已核查' : '未核查',
      updateTime: now,
      createTime: now,
      creator: creators[idx % creators.length],
      tags: pickTags()
    }
  })
}

// 生成日志示例数据
const generateLogItems = (count = 40) => {
  const now = dayjs()
  const statuses = ['成功', '失败', '进行中', '已取消']
  const tenants = ['启辰学校', '晨曦中学', '博雅高中', '启航教育']
  const agents = [
    { id: 'agent-001', name: '执行端A' },
    { id: 'agent-002', name: '执行端B' },
    { id: 'agent-003', name: '执行端C' },
    { id: 'agent-004', name: '执行端D' }
  ]
  // 工作流队列（与UI下拉一致）
  const queues = [
    '评分默认队列 (wf.correction.default)',
    'OCR默认队列 (wf.ocr.default)',
    '通用默认队列 (wf.general.default)'
  ]
  // 工作流队列任务编号（按 report.generate.taskXXXX 格式）
  const workflowQueues = [
    'report.generate.task0001',
    'report.generate.task0002', 
    'report.generate.task0003',
    'report.generate.task0004',
    'report.generate.task0005'
  ]
  const prompts = ['批阅逻辑V1', 'OCR识别优化', '标准化评分流程', '错误用例复查']
  const taskPairs = [
    { name: '【语文作文题】OCR识别', target: 'Qwen3-VL-30B-A3B-Instruct-AWQ' },
    { name: '【英语默写】自动批改', target: 'qwen-turbo' }
  ]
  return Array.from({ length: count }).map((_, i) => {
    const createTime = now.subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss')
    const status = statuses[i % statuses.length]
    const total = 50 + (i % 50)
    const success = Math.floor(total * (0.6 + (i % 5) * 0.05))
    const error = Math.max(0, total - success)
    const accuracy = total > 0 ? Math.round((success / total) * 100) : 0
    const agent = agents[i % agents.length]
    const queue = queues[i % queues.length]
    const workflowQueue = workflowQueues[i % workflowQueues.length]
    // 按“工作流队列”的规则映射到具体工作流（保持稳定对应关系）
    const queueToWorkflow = {
      '评分默认队列 (wf.correction.default)': { name: '【英语默写】自动批改', target: 'qwen-turbo' },
      'OCR默认队列 (wf.ocr.default)': { name: '【语文作文题】OCR识别', target: 'Qwen3-VL-30B-A3B-Instruct-AWQ' },
      '通用默认队列 (wf.general.default)': { name: '【物理选择题】通用处理', target: 'general-processor' }
    }
    const pair = queueToWorkflow[queue] || queueToWorkflow['通用默认队列 (wf.general.default)']
    const isSuccess = status === '成功'
    const checkStatus = isSuccess ? (Math.random() < 0.5 ? '已核查' : '未核查') : '未核查'
    return {
      key: `log-${i + 1}`,
      createTime,
      name: pair.name,
      target: pair.target,
      prompt: prompts[i % prompts.length],
      totalCount: total,
      queue,
      workflowQueue,
      agentId: agent.id,
      agentName: agent.name,
      totalExecTime: `${(10 + (i % 20))}.${i % 10}s`,
      avgExecTime: `${100 + (i % 80)}ms`,
      status,
      checkStatus,
      result: status === '成功' ? '完成' : status === '失败' ? '异常结束' : status === '进行中' ? '执行中' : '已取消',
      successCount: success,
      errorCount: error,
      accuracy,
      tenantName: tenants[i % tenants.length]
    }
  })
}

const ContentArea = ({ selectedMenu, breadcrumbKeys, onBreadcrumbNavigate, workflowTab }) => {
  const [pgCompareMode, setPgCompareMode] = useState(false);
  // 使用 antd v5 的 message 实例，避免静态方法的上下文警告
  const [messageApi, messageContextHolder] = message.useMessage()
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(undefined)
  const [selectedGrade, setSelectedGrade] = useState(undefined)
  const [selectedVersion, setSelectedVersion] = useState(undefined)
  const [updateTimeRange, setUpdateTimeRange] = useState(null)
  const [tableHeight, setTableHeight] = useState(400)
  const [filteredData, setFilteredData] = useState([])
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [uploadFileList, setUploadFileList] = useState([])
  const [form] = Form.useForm()
  const [datasetForm] = Form.useForm()
  // 文本批量新增相关状态
  const [datasetTextUploadList, setDatasetTextUploadList] = useState([])
  const [datasetTextBatchEntries, setDatasetTextBatchEntries] = useState([])
  const [datasetEditForm] = Form.useForm()
  const [datasetViewModalVisible, setDatasetViewModalVisible] = useState(false)
  const [datasetViewRecord, setDatasetViewRecord] = useState(null)
  const [datasetTextEditModalVisible, setDatasetTextEditModalVisible] = useState(false)
  // ShuJi 页面：外部新增触发器（用于灰色背景区域的按钮触发子组件新增）
  const [shuJiAddTrigger, setShuJiAddTrigger] = useState(0)
  const [datasetTextEditingRecord, setDatasetTextEditingRecord] = useState(null)
  const [datasetTextEditForm] = Form.useForm()
  const contentRef = useRef(null)
  const topRef = useRef(null)
  const listCardRef = useRef(null)
  const DEFAULT_STATUS_STORAGE_KEY = 'datasetCheckStatusMap'
  const genId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let s = ''
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return s
  }
  const previewIds = useMemo(() => ({
    '通用批阅': [genId(), genId()],
    '作文评分': [genId(), genId()],
    '手阅登分': [genId(), genId()],
    'OCR识别': [genId(), genId()],
    '图片打分': [genId(), genId()]
  }), [])
  const [datasetDrawerOpen, setDatasetDrawerOpen] = useState(false)
  const [workflowDrawerOpen, setWorkflowDrawerOpen] = useState(false)
  const [selectedDatasetCount, setSelectedDatasetCount] = useState(0)

  // 数据集管理页状态（仿教辅列表样式）
  const [datasetLoading, setDatasetLoading] = useState(false)
  const [datasetSearchText, setDatasetSearchText] = useState('')
  const [datasetCreatorFilter, setDatasetCreatorFilter] = useState('')
  const [datasetIdFilter, setDatasetIdFilter] = useState('')
  const [datasetTagsFilter, setDatasetTagsFilter] = useState([])
  const [datasetTagKeyword, setDatasetTagKeyword] = useState('')
  const [datasetFilterTagOptions, setDatasetFilterTagOptions] = useState([])
  const [datasetTimeRange, setDatasetTimeRange] = useState(null)
  const [datasetAddModalVisible, setDatasetAddModalVisible] = useState(false)
  const [datasetAddPreviewSelectedTypes, setDatasetAddPreviewSelectedTypes] = useState([])
  const [datasetAddBatchSelectedTags, setDatasetAddBatchSelectedTags] = useState([])
  const [datasetAddBatchTagInput, setDatasetAddBatchTagInput] = useState('')
  const addDatasetAddBatchTagOption = () => {
    const v = (datasetAddBatchTagInput || '').trim()
    if (!v) return
    if (!isTagAllowed(v)) {
      messageApi.warning('该标签不允许添加')
      setDatasetAddBatchTagInput('')
      return
    }
    setDatasetTagOptions(prev => (prev.includes(v) ? prev : [...prev, v]))
    setDatasetAddBatchSelectedTags(prev => (prev.includes(v) ? prev : [...prev, v]))
    setDatasetAddBatchTagInput('')
  }
  const [datasetAddPreviewTagsMap, setDatasetAddPreviewTagsMap] = useState({})
  const [datasetAddPreviewGroundTruthMap, setDatasetAddPreviewGroundTruthMap] = useState({})
  const [datasetAddPreviewCheckStatusMap, setDatasetAddPreviewCheckStatusMap] = useState({})
  const [datasetAddSelectedCardIds, setDatasetAddSelectedCardIds] = useState([])
  const [datasetAddTagKeyword, setDatasetAddTagKeyword] = useState('')
  const [datasetAddTagKeywords, setDatasetAddTagKeywords] = useState([])
  const [datasetAddTextMode, setDatasetAddTextMode] = useState('single')
  const [datasetAddCardsReady, setDatasetAddCardsReady] = useState(false)
  const [selectFlowVisible, setSelectFlowVisible] = useState(false)
  const [selectFlowStep, setSelectFlowStep] = useState(0)
  const [selectFlowOrg, setSelectFlowOrg] = useState(undefined)
  const [selectFlowGroup, setSelectFlowGroup] = useState(undefined)
  const [selectFlowHomework, setSelectFlowHomework] = useState(undefined)
  const [selectFlowQuestion, setSelectFlowQuestion] = useState(undefined)
  const [datasetAddImportVisible, setDatasetAddImportVisible] = useState(false)
  const [datasetAddImportType, setDatasetAddImportType] = useState('通用批阅')
  const [datasetAddImportName, setDatasetAddImportName] = useState('')
  const [datasetAddImportDescription, setDatasetAddImportDescription] = useState('')
  const [datasetAddImportFields, setDatasetAddImportFields] = useState({})
  const [datasetImportPreviewVisible, setDatasetImportPreviewVisible] = useState(false)
  const [datasetImportPreviewTitle, setDatasetImportPreviewTitle] = useState('')
  const [datasetImportPreviewContent, setDatasetImportPreviewContent] = useState('')
  const openDatasetImportPreview = (title, content) => {
    setDatasetImportPreviewTitle(title || '')
    setDatasetImportPreviewContent(String(content || ''))
    setDatasetImportPreviewVisible(true)
  }
  const [datasetImportImagePreviewVisible, setDatasetImportImagePreviewVisible] = useState(false)
  const [datasetImportImagePreviewSrc, setDatasetImportImagePreviewSrc] = useState('')
  const openDatasetImportImagePreview = (src) => {
    setDatasetImportImagePreviewSrc(String(src || ''))
    setDatasetImportImagePreviewVisible(true)
  }
  const [datasetAddHoverSelect, setDatasetAddHoverSelect] = useState(false)
  const [datasetAddHoverImport, setDatasetAddHoverImport] = useState(false)
  const [datasetAddOrgFilter, setDatasetAddOrgFilter] = useState(undefined)
  const [datasetAddSubjectGroupFilter, setDatasetAddSubjectGroupFilter] = useState(undefined)
  const [datasetAddHomeworkFilter, setDatasetAddHomeworkFilter] = useState(undefined)
  const [datasetAddPreviewOrgMap, setDatasetAddPreviewOrgMap] = useState({})
  const [datasetAddPreviewSubjectGroupMap, setDatasetAddPreviewSubjectGroupMap] = useState({})
  const [datasetAddPreviewHomeworkMap, setDatasetAddPreviewHomeworkMap] = useState({})
  const IMAGE_TYPES = new Set(['手阅登分', 'OCR识别', '图片打分'])
  const previewIdTypeMap = useMemo(() => {
    const m = {}
    Object.entries(previewIds).forEach(([type, ids]) => {
      ;(Array.isArray(ids) ? ids : [ids]).forEach((id) => { m[id] = type })
    })
    return m
  }, [previewIds])
  useEffect(() => {
    if (datasetAddModalVisible) {
      const defaults = {}
      Object.values(previewIds).forEach((ids) => {
        ;(Array.isArray(ids) ? ids : [ids]).forEach((id) => { defaults[id] = '未核查' })
      })
      setDatasetAddPreviewCheckStatusMap(defaults)
      setDatasetAddPreviewTagsMap({})
      setDatasetAddPreviewGroundTruthMap({})
      setDatasetAddSelectedCardIds([])
      setDatasetAddCardsReady(false)
      setDatasetAddTextMode('single')
      const orgs = ['机构A', '机构B', '机构C']
      const groups = ['中职三年级语文学科组', '高三理科学科组', '初中英语学科组', '高二数学学科组']
      const hws = ['深度学习系统试题', '高三语文作文训练', '数学综合练习', '英语阅读训练', '历史材料题作业', '地理综合作业', '物理实验数据分析', '化学方程式练习']
      const orgMap = {}
      const groupMap = {}
      const hwMap = {}
      let idx = 0
      Object.values(previewIds).forEach((ids) => {
        ;(Array.isArray(ids) ? ids : [ids]).forEach((id) => {
          orgMap[id] = orgs[idx % orgs.length]
          groupMap[id] = groups[idx % groups.length]
          hwMap[id] = hws[idx % hws.length]
          idx++
        })
      })
      setDatasetAddPreviewOrgMap(orgMap)
      setDatasetAddPreviewSubjectGroupMap(groupMap)
      setDatasetAddPreviewHomeworkMap(hwMap)
    }
  }, [datasetAddModalVisible, previewIds])
  const [datasetAddTypeFilter, setDatasetAddTypeFilter] = useState(undefined)
  const [datasetAddStatusFilter, setDatasetAddStatusFilter] = useState(undefined)
  const [datasetUploadList, setDatasetUploadList] = useState([])
  const [datasetData, setDatasetData] = useState(() => [
    ...generateTextSampleItems(15),
    ...generateImageSampleItems(14)
  ])
  const [datasetTabKey, setDatasetTabKey] = useState('text')
  const [datasetBatchSelectMode, setDatasetBatchSelectMode] = useState(false)
  const [datasetTextFilteredData, setDatasetTextFilteredData] = useState([])
  const [datasetImageFilteredData, setDatasetImageFilteredData] = useState([])
  const [datasetSelectedIds, setDatasetSelectedIds] = useState([])
  const [datasetSelectedImageIds, setDatasetSelectedImageIds] = useState([])
  // 顶部筛选：核查状态
  const [datasetFilterStatus, setDatasetFilterStatus] = useState(undefined)
  // 新增表单：标签选项与自定义添加
  const [datasetTagOptions, setDatasetTagOptions] = useState(getTagOptionsForTab('text'))
  const [datasetTagInput, setDatasetTagInput] = useState('')
  const addDatasetTagOption = () => {
    const v = (datasetTagInput || '').trim()
    if (!v) return
    if (!isTagAllowed(v)) {
      messageApi.warning('该标签不允许添加')
      setDatasetTagInput('')
      return
    }
    if (!datasetTagOptions.includes(v)) {
      messageApi.warning('该标签不在当前允许列表中')
      setDatasetTagInput('')
      return
    }
    setDatasetTagInput('')
  }
  // 批量修改：状态与标签选择
  const [datasetBatchCheckStatus, setDatasetBatchCheckStatus] = useState(undefined)
  const [datasetBatchSelectedTags, setDatasetBatchSelectedTags] = useState([])
  const [datasetBatchTagsTouched, setDatasetBatchTagsTouched] = useState(false)
  const [datasetBatchTagInput, setDatasetBatchTagInput] = useState('')
  const addDatasetBatchTagOption = () => {
    const v = (datasetBatchTagInput || '').trim()
    if (!v) return
    if (!isTagAllowed(v)) {
      messageApi.warning('该标签不允许添加')
      setDatasetBatchTagInput('')
      return
    }
    setDatasetTagOptions(prev => (prev.includes(v) ? prev : [...prev, v]))
    setDatasetBatchSelectedTags(prev => (prev.includes(v) ? prev : [...prev, v]))
    setDatasetBatchTagsTouched(true)
    setDatasetBatchTagInput('')
  }
  const getVisiblePreviewTags = (id) => {
    const kws = Array.isArray(datasetAddTagKeywords) ? datasetAddTagKeywords.map(s => String(s).trim().toLowerCase()).filter(Boolean) : []
    const list = datasetAddPreviewTagsMap[id] || []
    if (!kws.length) return list
    return list.filter(t => {
      const tt = String(t).toLowerCase()
      return kws.some(kw => tt.includes(kw))
    })
  }
  const [datasetEditModalVisible, setDatasetEditModalVisible] = useState(false)
  const [datasetEditingRecord, setDatasetEditingRecord] = useState(null)
  // 图片查看器状态
  const [imageViewerVisible, setImageViewerVisible] = useState(false)

  // 统一标签规范化：移除黑名单与未收录标签，必要时使用默认标签
  const normalizeTagList = (tags) => {
    const raw = Array.isArray(tags) ? tags : String(tags || '').split('、').filter(Boolean)
    const cleaned = raw.filter(t => t && !TAG_BLACKLIST.has(t))
    const allowed = new Set(datasetTagOptions)
    const normalized = cleaned.filter(t => allowed.has(t))
    return normalized.length ? normalized : [datasetTagOptions[0]]
  }

  const cardMatchesTagKeyword = (id) => {
    const kws = Array.isArray(datasetAddTagKeywords) ? datasetAddTagKeywords.map(s => String(s).trim().toLowerCase()).filter(Boolean) : []
    if (!kws.length) return true
    const tags = (datasetAddPreviewTagsMap[id] || []).map(t => String(t).toLowerCase())
    return tags.some(tt => kws.some(kw => tt.includes(kw)))
  }

  const cardMatchesExtraFilters = (id) => {
    if (datasetAddOrgFilter && (datasetAddPreviewOrgMap[id] !== datasetAddOrgFilter)) return false
    if (datasetAddSubjectGroupFilter && (datasetAddPreviewSubjectGroupMap[id] !== datasetAddSubjectGroupFilter)) return false
    if (datasetAddHomeworkFilter && (datasetAddPreviewHomeworkMap[id] !== datasetAddHomeworkFilter)) return false
    return true
  }

  // 首次加载时对示例数据进行重打标签
  useEffect(() => {
    setDatasetData(prev => prev.map(item => ({
      ...item,
      tags: normalizeTagList(item.tags)
    })))
  }, [])

  // 加载已保存的默认核查状态并应用（若存在）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_STATUS_STORAGE_KEY)
      if (!saved) return
      const map = JSON.parse(saved)
      if (map && typeof map === 'object') {
        setDatasetData(prev => prev.map(item => ({
          ...item,
          checkStatus: map[item.id] ?? item.checkStatus
        })))
      }
    } catch (e) {
      // 忽略本地存储异常
    }
  }, [])

  // 若未保存默认状态，则以“当前状态”为默认并持久化（仅一次）
  useEffect(() => {
    const saved = localStorage.getItem(DEFAULT_STATUS_STORAGE_KEY)
    if (saved) return
    if (!datasetData || datasetData.length === 0) return
    try {
      const map = Object.fromEntries(datasetData.map(d => [d.id, d.checkStatus]))
      localStorage.setItem(DEFAULT_STATUS_STORAGE_KEY, JSON.stringify(map))
      messageApi.success('已将当前核查状态设为默认')
    } catch (e) {
      // 忽略本地存储异常
    }
  }, [datasetData])

  // 根据页签切换动态刷新标签选项集合
  useEffect(() => {
    setDatasetTagOptions(getTagOptionsForTab(datasetTabKey))
  }, [datasetTabKey])
  const [imageViewerSrc, setImageViewerSrc] = useState(null)
  const [imageViewerRecord, setImageViewerRecord] = useState(null)
  const [imageViewerScale, setImageViewerScale] = useState(1)

  const openImageViewer = (item) => {
    if (!item || !item.imageUrl) {
      messageApi.error('该记录没有可查看的图片')
      return
    }
    setImageViewerRecord(item)
    setImageViewerSrc(item.imageUrl)
    setImageViewerScale(1)
    setImageViewerVisible(true)
  }

  const handleViewerWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    setImageViewerScale(prev => {
      const next = prev * factor
      return Math.min(4, Math.max(0.2, next))
    })
  }

  // 动态计算表格高度，贴合底部（适配不同屏幕高度）
  useEffect(() => {
    const updateHeights = () => {
      const contentH = contentRef.current?.clientHeight || 0
      const topH = topRef.current?.clientHeight || 0
      // 列表Card可用总高度：内容区域减去上方区域高度
      const cardTotalH = Math.max(0, contentH - topH)

      // 读取Card body的真实内边距
      const cardBodyEl = listCardRef.current?.querySelector('.ant-card-body')
      const bodyStyles = cardBodyEl ? window.getComputedStyle(cardBodyEl) : null
      const bodyPaddingTop = bodyStyles ? parseFloat(bodyStyles.paddingTop) : 0
      const bodyPaddingBottom = bodyStyles ? parseFloat(bodyStyles.paddingBottom) : 0

      // 可用于Table容器的可用高度（减去Card body内边距）
      const tableContainerH = Math.max(0, cardTotalH - bodyPaddingTop - bodyPaddingBottom)

      // 读取表头和分页的真实高度
      const theadEl = listCardRef.current?.querySelector('.ant-table-thead')
      const headerH = theadEl?.offsetHeight || 0
      const paginationEl = listCardRef.current?.querySelector('.ant-table-pagination')
      const paginationH = paginationEl?.offsetHeight || 0

      // 预留水平滚动条占用高度（Windows约17-20px）
      const scrollbarH = 18

      const y = Math.max(200, tableContainerH - headerH - paginationH - scrollbarH)
      setTableHeight(y)
    }
    
    updateHeights()
    
    const ro = new ResizeObserver(updateHeights)
    if (contentRef.current) ro.observe(contentRef.current)
    if (topRef.current) ro.observe(topRef.current)
    if (listCardRef.current) ro.observe(listCardRef.current)
    
    window.addEventListener('resize', updateHeights)
    
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateHeights)
    }
  }, [])

  // 初始按类型填充数据集过滤数据（兼容无 type 的旧数据：按 input 文本判断）
  useEffect(() => {
    const textData = datasetData.filter(d => !/^图片：/.test(String(d.input)))
    const imageData = datasetData.filter(d => /^图片：/.test(String(d.input)))
    setDatasetTextFilteredData(textData)
    setDatasetImageFilteredData(imageData)
  }, [datasetData])

  useEffect(() => {
    const sourceAll = datasetData.filter(d => (datasetTabKey === 'text') ? !/^图片：/.test(String(d.input)) : /^图片：/.test(String(d.input)))
    const all = (sourceAll || []).flatMap(item => normalizeTagList(item.tags))
    const uniq = Array.from(new Set(all.filter(Boolean)))
    setDatasetFilterTagOptions(uniq.map(t => ({ value: t, label: t })))
  }, [datasetTabKey, datasetData])

  // 数据集筛选：输入联动模糊过滤（支持 ID 与 input 文本），清空时恢复原列表
  useEffect(() => {
    const query = (datasetSearchText || '').trim().toLowerCase()
    const idQuery = (datasetIdFilter || '').trim().toLowerCase()
    const tagKw = (datasetTagKeyword || '').trim().toLowerCase()
    const baseText = datasetData.filter(d => !/^图片：/.test(String(d.input)))
    const baseImage = datasetData.filter(d => /^图片：/.test(String(d.input)))
    const inRange = (item) => {
      if (!datasetTimeRange || datasetTimeRange.length !== 2) return true
      const [start, end] = datasetTimeRange
      const dt = dayjs(String(item.updateTime))
      const afterStart = dt.isAfter(start.startOf('day')) || dt.isSame(start.startOf('day'))
      const beforeEnd = dt.isBefore(end.endOf('day')) || dt.isSame(end.endOf('day'))
      return afterStart && beforeEnd
    }
    const match = (item) => {
      const tagsText = Array.isArray(item.tags) ? item.tags.join('、') : String(item.tag || '')
      const normalizedTags = normalizeTagList(item.tags)
      const byText = !query || [item.id, item.displayId, item.creator, tagsText]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(query))
      const byId = !idQuery || [item.id, item.displayId]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(idQuery))
      const byStatus = !datasetFilterStatus ? true : item.checkStatus === datasetFilterStatus
      const creatorQuery = (datasetCreatorFilter || '').trim().toLowerCase()
      const byCreator = !creatorQuery || String(item.creator || '').toLowerCase().includes(creatorQuery)
      const byTagKeyword = !tagKw || String(tagsText || '').toLowerCase().includes(tagKw)
      const byTags = !datasetTagsFilter || datasetTagsFilter.length === 0 ? true : datasetTagsFilter.some(t => normalizedTags.includes(t))
      return byText && byId && byStatus && byCreator && byTagKeyword && byTags && inRange(item)
    }
    setDatasetTextFilteredData(baseText.filter(match))
    setDatasetImageFilteredData(baseImage.filter(match))
  }, [datasetSearchText, datasetIdFilter, datasetCreatorFilter, datasetFilterStatus, datasetTimeRange, datasetData, datasetTagsFilter, datasetTagKeyword])

  // 模拟数据（包含作者、出版社、版本、简介、学科等）
  const mockData = [
    {
      key: '1',
      name: '教辅资料001',
      author: '陈建国',
      publisher: '启辰出版社',
      subject: '数学',
      grade: '高一',
      version: '人教版A',
      createTime: '2024-01-15 09:30:25',
      updateTime: '2024-01-20 14:22:18',
      creator: '系统管理员',
      description: '高一数学同步练习'
    },
    {
      key: '2',
      name: '教辅资料002',
      author: '李明远',
      publisher: '学林出版社',
      subject: '语文',
      grade: '高二',
      version: '统编版B',
      createTime: '2024-01-10 11:15:42',
      updateTime: '2024-01-18 16:45:33',
      creator: '教务处',
      description: '高二语文阅读理解训练'
    },
    {
      key: '3',
      name: '教辅资料003',
      author: '王晓燕',
      publisher: '新知出版社',
      subject: '英语',
      grade: '高三',
      version: '外研版C',
      createTime: '2024-01-08 08:20:15',
      updateTime: '2024-01-16 13:55:27',
      creator: '张主任',
      description: '高三英语词汇与语法专项'
    },
    {
      key: '4',
      name: '教辅资料004',
      author: '赵建国',
      publisher: '教育科学出版社',
      subject: '物理',
      grade: '高一',
      version: '人教版',
      createTime: '2024-01-12 15:40:08',
      updateTime: '2024-01-22 10:12:45',
      creator: '李副校长',
      description: '高一物理力学基础'
    },
    {
      key: '5',
      name: '教辅资料005',
      author: '陈雅琴',
      publisher: '北京师范大学出版社',
      subject: '化学',
      grade: '高二',
      version: '苏教版',
      createTime: '2024-01-05 13:25:36',
      updateTime: '2024-01-15 17:38:52',
      creator: '王科长',
      description: '高二化学有机化学专题'
    },
    {
      key: '6',
      name: '教辅资料006',
      author: '刘德华',
      publisher: '华东师范大学出版社',
      subject: '生物',
      grade: '高三',
      version: '人教版',
      createTime: '2024-01-03 10:18:29',
      updateTime: '2024-01-13 12:44:16',
      creator: '黄主任',
      description: '高三生物遗传学重点'
    },
    {
      key: '7',
      name: '教辅资料007',
      author: '周文博',
      publisher: '江苏教育出版社',
      subject: '历史',
      grade: '高一',
      version: '统编版',
      createTime: '2024-01-20 16:52:14',
      updateTime: '2024-01-25 09:27:38',
      creator: '陈处长',
      description: '高一历史古代史专题'
    },
    {
      key: '8',
      name: '教辅资料008',
      author: '吴秀兰',
      publisher: '人民教育出版社',
      subject: '地理',
      grade: '高二',
      version: '人教版',
      createTime: '2024-01-18 14:33:21',
      updateTime: '2024-01-28 11:56:47',
      creator: '赵老师',
      description: '高二地理自然地理综合'
    },
    {
      key: '9',
      name: '教辅资料009',
      author: '郑海涛',
      publisher: '浙江教育出版社',
      subject: '政治',
      grade: '高三',
      version: '统编版',
      createTime: '2024-01-14 12:07:53',
      updateTime: '2024-01-24 15:19:42',
      creator: '孙主管',
      description: '高三政治马克思主义基本原理'
    },
    {
      key: '10',
      name: '教辅资料010',
      author: '孙丽娟',
      publisher: '山东教育出版社',
      subject: '数学',
      grade: '高二',
      version: '人教版B',
      createTime: '2024-01-11 09:45:17',
      updateTime: '2024-01-21 13:28:35',
      creator: '马校长',
      description: '高二数学解析几何专题'
    },
    {
      key: '11',
      name: '教辅资料011',
      author: '马建军',
      publisher: '湖南教育出版社',
      subject: '语文',
      grade: '高一',
      version: '统编版',
      createTime: '2024-01-09 11:22:48',
      updateTime: '2024-01-19 16:14:26',
      creator: '李督导',
      description: '高一语文现代文阅读技巧'
    },
    {
      key: '12',
      name: '教辅资料012',
      author: '朱慧敏',
      publisher: '四川教育出版社',
      subject: '英语',
      grade: '高二',
      version: '人教版',
      createTime: '2024-01-07 08:36:12',
      updateTime: '2024-01-17 14:51:39',
      creator: '周组长',
      description: '高二英语听力训练专项'
    },
    {
      key: '13',
      name: '教辅资料013',
      author: '胡永强',
      publisher: '广东教育出版社',
      subject: '物理',
      grade: '高三',
      version: '粤教版',
      createTime: '2024-01-06 15:29:04',
      updateTime: '2024-01-16 10:43:58',
      creator: '吴主席',
      description: '高三物理电磁学综合'
    },
    {
      key: '14',
      name: '教辅资料014',
      author: '林雪梅',
      publisher: '福建教育出版社',
      subject: '化学',
      grade: '高一',
      version: '人教版',
      createTime: '2024-01-04 13:17:25',
      updateTime: '2024-01-14 17:32:41',
      creator: '郑秘书',
      description: '高一化学元素周期表应用'
    },
    {
      key: '15',
      name: '教辅资料015',
      author: '黄志刚',
      publisher: '河南教育出版社',
      subject: '生物',
      grade: '高二',
      version: '人教版',
      createTime: '2024-01-02 10:54:37',
      updateTime: '2024-01-12 12:18:23',
      creator: '何部长',
      description: '高二生物细胞结构与功能'
    },
    {
      key: '16',
      name: '教辅资料016',
      author: '徐国庆',
      publisher: '安徽教育出版社',
      subject: '历史',
      grade: '高三',
      version: '统编版',
      createTime: '2024-01-01 09:12:46',
      updateTime: '2024-01-11 14:37:19',
      creator: '钱院长',
      description: '高三历史近现代史重点'
    },
    {
      key: '17',
      name: '教辅资料017',
      author: '高丽萍',
      publisher: '辽宁教育出版社',
      subject: '地理',
      grade: '高一',
      version: '人教版',
      createTime: '2024-01-25 11:48:32',
      updateTime: '2024-01-30 16:25:14',
      creator: '田经理',
      description: '高一地理人文地理基础'
    },
    {
      key: '18',
      name: '教辅资料018',
      author: '何俊杰',
      publisher: '云南教育出版社',
      subject: '政治',
      grade: '高二',
      version: '统编版',
      createTime: '2024-01-23 14:35:28',
      updateTime: '2024-01-29 09:52:45',
      creator: '刘助理',
      description: '高二政治经济生活专题'
    },
    {
      key: '19',
      name: '教辅资料019',
      author: '罗文斌',
      publisher: '贵州教育出版社',
      subject: '数学',
      grade: '高三',
      version: '人教版A',
      createTime: '2024-01-21 08:41:16',
      updateTime: '2024-01-27 13:29:52',
      creator: '杨专员',
      description: '高三数学函数与导数综合'
    },
    {
      key: '20',
      name: '教辅资料020',
      author: '宋美华',
      publisher: '西藏教育出版社',
      subject: '语文',
      grade: '高三',
      version: '统编版',
      createTime: '2024-01-19 12:26:39',
      updateTime: '2024-01-26 15:48:21',
      creator: '韩顾问',
      description: '高三语文作文写作技巧'
    }
  ]

  // 初始化筛选数据
  useEffect(() => {
    setFilteredData(mockData)
  }, [])

  // 教辅筛选：输入与下拉选择联动过滤，支持名称模糊匹配与时间范围
  useEffect(() => {
    let filtered = [...mockData]
    // 按名称模糊匹配
    if (searchText) {
      const q = String(searchText).trim().toLowerCase()
      filtered = filtered.filter(item => String(item.name).toLowerCase().includes(q))
    }
    // 按学科筛选
    if (selectedSubject) {
      filtered = filtered.filter(item => item.subject === selectedSubject)
    }
    // 按年级筛选
    if (selectedGrade) {
      filtered = filtered.filter(item => item.grade === selectedGrade)
    }
    // 按版本筛选
    if (selectedVersion) {
      filtered = filtered.filter(item => item.version === selectedVersion)
    }
    // 按更新时间筛选（包含边界）
    if (updateTimeRange && Array.isArray(updateTimeRange) && updateTimeRange.length === 2) {
      const [startDate, endDate] = updateTimeRange
      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.updateTime)
        const afterStart = itemDate.isAfter(startDate.startOf('day')) || itemDate.isSame(startDate.startOf('day'))
        const beforeEnd = itemDate.isBefore(endDate.endOf('day')) || itemDate.isSame(endDate.endOf('day'))
        return afterStart && beforeEnd
      })
    }
    setFilteredData(filtered)
  }, [searchText, selectedSubject, selectedGrade, selectedVersion, updateTimeRange])

  // 搜索功能
  const handleSearch = () => {
    setLoading(true)
    
    setTimeout(() => {
      let filtered = [...mockData]
      
      // 按名称搜索
      if (searchText) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchText.toLowerCase())
        )
      }
      
      // 按学科筛选
      if (selectedSubject) {
        filtered = filtered.filter(item => item.subject === selectedSubject)
      }
      
      // 按年级筛选
      if (selectedGrade) {
        filtered = filtered.filter(item => item.grade === selectedGrade)
      }
      
      // 按版本筛选
      if (selectedVersion) {
        filtered = filtered.filter(item => item.version === selectedVersion)
      }
      
      // 按更新时间筛选
      if (updateTimeRange && updateTimeRange.length === 2) {
        const [startDate, endDate] = updateTimeRange
        filtered = filtered.filter(item => {
          const itemDate = dayjs(item.updateTime)
          return itemDate.isAfter(startDate.startOf('day')) || itemDate.isSame(startDate.startOf('day')) &&
                 itemDate.isBefore(endDate.endOf('day')) || itemDate.isSame(endDate.endOf('day'))
        })
      }
      
      setFilteredData(filtered)
      setLoading(false)
  messageApi.success(`搜索完成，找到 ${filtered.length} 条记录`)
    }, 500)
  }

  // 重置功能
  const handleReset = () => {
    setSearchText('')
    setSelectedSubject(undefined)
    setSelectedGrade(undefined)
    setSelectedVersion(undefined)
    setUpdateTimeRange(null)
    setFilteredData(mockData)
  messageApi.success('已重置所有筛选条件')
  }

  const columns = [
    { title: '序号', dataIndex: 'key', width: 80, align: 'center' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180, ellipsis: true },
    { title: '作者', dataIndex: 'author', width: 120 },
    { title: '出版社', dataIndex: 'publisher', width: 180 },
    { title: '学科', dataIndex: 'subject', width: 120 },
    { title: '年级', dataIndex: 'grade', width: 100 },
    { title: '版本', dataIndex: 'version', width: 140 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    { title: '更新时间', dataIndex: 'updateTime', width: 160 },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '简介', dataIndex: 'description', width: 200, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<SafetyOutlined />} 
            onClick={() => handleAuthorize(record)}
          >
            授权
          </Button>
        </Space>
      )
    }
  ]

  // 数据集管理列表列定义
  const datasetColumns = [
    { title: 'ID', dataIndex: 'id', width: 220 },
    { title: '名称', dataIndex: 'input', width: 280, ellipsis: true },
    { title: '原题', dataIndex: 'question', width: 280, ellipsis: true, render: (text, record) => text || '-' },
    { title: '正确答案', dataIndex: 'correctAnswer', width: 240, ellipsis: true, render: (text) => text || '-' },
    { title: '满分分数', dataIndex: 'fullScore', width: 160, render: (text) => (text ?? '-') },
    { title: '标签', dataIndex: 'tag', width: 160, ellipsis: true, render: (text, record) => {
      if (Array.isArray(record.tags) && record.tags.length) return record.tags.join('、')
      return text || '-'
    } },
    { title: '核查状态', dataIndex: 'checkStatus', width: 120, render: (text) => (
      <span style={{ color: text === '未核查' ? '#cf1322' : undefined }}>{text || '-'}</span>
    ) },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    { title: '创建人', dataIndex: 'creator', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleDatasetView(record)}>查看</Button>
          <Button type="link" size="small" onClick={() => handleDatasetEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDatasetDelete(record)}>删除</Button>
        </Space>
      )
    }
  ]

  // 文本列表总列宽，用于按需水平滚动（容器较窄时出现滚动条）
  const datasetTextTotalWidth = (datasetColumns?.reduce?.((sum, col) => sum + (col.width || 0), 0) || 0) + (datasetBatchSelectMode ? 60 : 0)

  // 图片数据集列表列定义
  const datasetImageColumns = [
    { title: 'ID', dataIndex: 'id', width: 220 },
    { title: '名称', dataIndex: 'input', width: 260, ellipsis: true, render: (text) => getImageNameFromInput(text) },
    { 
      title: '原图', 
      dataIndex: 'imageUrl', 
      width: 180, 
      render: (src, record) => (
        <div 
          onClick={() => openImageViewer(record)} 
          style={{ display: 'inline-block', cursor: 'pointer' }}
          title="点击查看原图"
        >
          <img 
            src={src || svgPlaceholder(getImageNameFromInput(record.input) || '图片占位')} 
            alt={getImageNameFromInput(record.input)} 
            style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, background: '#f5f5f5' }} 
          />
        </div>
      )
    },
    { title: '识别结果', dataIndex: 'recognition', width: 240, ellipsis: true, render: (text, record) => text || getImageNameFromInput(record.input) || '-' },
    { title: '标签', dataIndex: 'tag', width: 160, ellipsis: true, render: (text, record) => {
      if (Array.isArray(record.tags) && record.tags.length) return record.tags.join('、')
      return text || '-'
    } },
    { title: '核查状态', dataIndex: 'checkStatus', width: 120, render: (text) => (
      <span style={{ color: text === '未核查' ? '#cf1322' : undefined }}>{text || '-'}</span>
    ) },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    { title: '创建人', dataIndex: 'creator', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleDatasetView(record)}>查看</Button>
          <Button type="link" size="small" onClick={() => handleDatasetEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDatasetDelete(record)}>删除</Button>
        </Space>
      )
    }
  ]

  // 图片列表总列宽，用于按需水平滚动（容器较窄时出现滚动条）
  const datasetImageTotalWidth = (datasetImageColumns?.reduce?.((sum, col) => sum + (col.width || 0), 0) || 0) + (datasetBatchSelectMode ? 60 : 0)

  const handleAdd = () => {
    setWfCreateSide(pgCompareMode ? 'right' : 'normal')
    setWfCreateModalVisible(true)
  }

  const handleWfCreateCancel = () => {
    setWfCreateModalVisible(false)
  }

  const handleWfCreateConfirm = () => {
    // 新样式：校验队列与主要筛选
    if (!wfQueue) { messageApi.error('请选择工作流队列'); return }
    if (!wfPrimarySubject) { messageApi.error('请选择学科'); return }
    if (!wfPrimaryType) { messageApi.error('请选择题型'); return }

    // 队列推断类别（评分 -> 批改工作流），否则使用原值或默认多模态
    const inferredType = (wfQueue || '').includes('评分') ? '批改工作流' : (wfType || '多模态工作流')

    // 生成下一个工作流ID（按类别前缀递增）
    const prefix = wfPrefixMap[inferredType] || 'WF'
    const nums = workflowList
      .filter(wf => typeof wf.id === 'string' && wf.id.startsWith(prefix))
      .map(wf => { const n = parseInt(wf.id.replace(prefix, ''), 10); return isNaN(n) ? 0 : n })
    const max = nums.length ? Math.max(...nums) : 0
    const nextId = `${prefix}${String(max + 1).padStart(4, '0')}`

    // 默认模型配置
    let modelConfig = ['基础检测模型']
    if (inferredType === 'OCR工作流') { modelConfig = ['基础检测模型', 'OCR模型'] }
    else if (inferredType === '批改工作流') { modelConfig = ['基础检测模型', '批改模型'] }
    else if (inferredType === '多模态工作流') { modelConfig = ['基础检测模型', '特定检测模型', 'OCR模型'] }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const newItem = {
      key: `${Date.now()}`,
      id: nextId,
      name: (wfName && wfName.trim()) ? wfName.trim() : `[${wfPrimarySubject}-${wfPrimaryType}] ${wfQueue}`,
      type: inferredType,
      modelConfig,
      createTime: now,
      subjects: [wfPrimarySubject, wfPrimaryType],
      grade: wfGrade,
      org: wfOrg,
      prompt: wfPrompt
    }

    // 加到列表首位，并提示成功
    setWorkflowList(prev => [newItem, ...prev])
    // 创建后自动选中当前侧，并显示对应侧“收藏”按钮
    if (pgCompareMode) {
      if (wfCreateSide === 'right') {
        setSelectedWorkflowKeyRight(newItem.key)
        setPromptTextRight(newItem.prompt)
        setFavoriteBtnVisibleRight(true)
        // 创建但未启动 -> 待处理
        setTestStatusRight('pending')
      } else { // 默认左侧
        setSelectedWorkflowKeyLeft(newItem.key)
        setPromptTextLeft(newItem.prompt)
        setFavoriteBtnVisibleLeft(true)
      }
    } else {
      setSelectedWorkflowKey(newItem.key)
      setPromptText(newItem.prompt)
      setFavoriteBtnVisibleNormal(true)
      // 创建但未启动 -> 待处理（普通模式右侧预览区）
      setTestStatusRight('pending')
    }
    messageApi.success('已创建工作流配置')

    // 关闭弹窗并重置相关状态
    setWfCreateModalVisible(false)
    setWfName(''); setWfType(undefined); setWfId('')
    setChineseSubjects([]); setMathSubjects([]); setEnglishSubjects([]); setWfSubjects([])
    setWfQueue('评分默认队列 (wf.correction.default)')
    setWfPrimarySubject(undefined); setWfPrimaryType(undefined)
    setWfGrade('所有年级'); setWfOrg('所有教育机构'); setWfPrompt('')
  }

  const handleImport = () => {
    setImportModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      author: record.author,
      publisher: record.publisher,
      subject: record.subject,
      grade: record.grade,
      version: record.version,
      description: record.description
    })
    setEditModalVisible(true)
  }

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields()
      
      // 更新数据
      const updatedData = filteredData.map(item => {
        if (item.key === editingRecord.key) {
          return {
            ...item,
            ...values,
            updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
          }
        }
        return item
      })
      
      setFilteredData(updatedData)
      setEditModalVisible(false)
      setEditingRecord(null)
      form.resetFields()
    messageApi.success('编辑成功！')
    } catch (error) {
    messageApi.error('请检查表单信息')
    }
  }

  const handleCancelEdit = () => {
    setEditModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }

  // 导入相关处理函数
  const handleImportCancel = () => {
    setImportModalVisible(false)
    setUploadFileList([])
  }

  const handleImportConfirm = () => {
    if (uploadFileList.length === 0) {
      messageApi.error('请先选择要导入的ZIP文件')
      return
    }

    // 模拟导入处理
    messageApi.loading('正在解析ZIP文件...', 2)
    
    setTimeout(() => {
      // 模拟解析成功，添加一些示例数据
      const newData = [
        {
          key: Date.now() + 1,
          name: '高中数学必修一练习册',
          author: '张三',
          publisher: '人民教育出版社',
          subject: '数学',
          grade: '高一',
          version: '人教版',
          description: '从ZIP文件导入的教辅资料',
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        {
          key: Date.now() + 2,
          name: '高中物理实验指导',
          author: '李四',
          publisher: '科学出版社',
          subject: '物理',
          grade: '高二',
          version: '人教版',
          description: '从ZIP文件导入的实验指导书',
          updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      ]
      
      setFilteredData(prev => [...newData, ...prev])
      setImportModalVisible(false)
      setUploadFileList([])
      messageApi.success(`成功导入 ${newData.length} 条教辅资料！`)
    }, 2000)
  }

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList: uploadFileList,
    accept: '.zip',
    beforeUpload: (file) => {
      const isZip = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')
      if (!isZip) {
    messageApi.error('只能上传ZIP格式的文件！')
        return false
      }
      
      const isLt500M = file.size / 1024 / 1024 < 500
      if (!isLt500M) {
    messageApi.error('文件大小不能超过500MB！')
        return false
      }
      
      setUploadFileList([file])
      return false // 阻止自动上传
    },
    onRemove: () => {
      setUploadFileList([])
    }
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>您确定要删除以下教辅资料吗？</p>
          <p><strong>名称：</strong>{record.name}</p>
          <p><strong>作者：</strong>{record.author}</p>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            <strong>注意：删除后无法恢复！</strong>
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 450,
      onOk() {
        // 模拟删除操作
        const newData = filteredData.filter(item => item.key !== record.key)
        setFilteredData(newData)
    messageApi.success(`已删除教辅资料：${record.name}`)
      },
      onCancel() {
    messageApi.info('已取消删除操作')
      }
    })
  }

  const handleAuthorize = (record) => {
    Modal.confirm({
      title: '授权管理',
      content: (
        <div>
          <p>为以下教辅资料设置授权：</p>
          <p><strong>名称：</strong>{record.name}</p>
          <p><strong>作者：</strong>{record.author}</p>
          <p><strong>当前状态：</strong><span style={{ color: '#52c41a' }}>已授权</span></p>
          <p style={{ color: '#666', marginTop: 16 }}>
            您可以修改该资料的访问权限和使用范围。
          </p>
        </div>
      ),
      okText: '修改授权',
      cancelText: '取消',
      width: 450,
      onOk() {
    messageApi.success(`已更新 ${record.name} 的授权设置`)
      },
      onCancel() {
    messageApi.info('已取消授权操作')
      }
    })
  }

  const handleExport = () => {
    messageApi.info('导出功能')
  }

  // 数据集管理交互
  const handleDatasetView = (record) => {
    const isImage = /^图片：/.test(String(record?.input)) || record?.type === 'image'
    if (isImage) {
      openImageViewer(record)
      return
    }
    setDatasetViewRecord(record)
    setDatasetViewModalVisible(true)
  }

  const handleDatasetEdit = (record) => {
    // 图片数据：名称存储在 input 字段中，如 "图片：xxx"
    const isImage = /^图片：/.test(String(record.input)) || record?.type === 'image'
    if (isImage) {
      setDatasetEditingRecord(record)
      datasetEditForm.setFieldsValue({
        name: getImageNameFromInput(record.input),
        tag: Array.isArray(record.tags) ? record.tags : String(record.tag || '').split('、').filter(Boolean),
        description: String(record.description || ''),
        checkStatus: record.checkStatus || '未核查'
      })
      setDatasetEditModalVisible(true)
      return
    }
    // 文本数据编辑
    setDatasetTextEditingRecord(record)
    datasetTextEditForm.setFieldsValue({
      text: String(record.input || ''),
      question: String(record.question || ''),
      correctAnswer: String(record.correctAnswer || ''),
      fullScore: record.fullScore ?? '',
      tag: Array.isArray(record.tags) ? record.tags : String(record.tag || '').split('、').filter(Boolean),
      description: String(record.description || ''),
      checkStatus: record.checkStatus || '未核查'
    })
    setDatasetTextEditModalVisible(true)
  }

  const handleDatasetTextEditSave = async () => {
    try {
      const values = await datasetTextEditForm.validateFields()
      const selectedTags = Array.isArray(values.tag) ? values.tag.filter(Boolean) : (values.tag ? [values.tag] : [])
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const targetKey = datasetTextEditingRecord?.key
      const targetId = datasetTextEditingRecord?.id

      // 更新总数据
      const nextAll = datasetData.map(item => {
        if (item.id === targetId || item.key === targetKey) {
          return { 
            ...item, 
            input: values.text, 
            question: values.question || '',
            correctAnswer: values.correctAnswer || '',
            fullScore: values.fullScore === '' ? '' : values.fullScore,
            tag: selectedTags.join('、'),
            tags: selectedTags,
            description: values.description || '',
            checkStatus: values.checkStatus || '未核查',
            updateTime: now 
          }
        }
        return item
      })
      setDatasetData(nextAll)

      // 更新文本筛选数据（保持当前筛选视图一致）
      setDatasetTextFilteredData(prev => prev.map(item => {
        if (item.id === targetId || item.key === targetKey) {
          return { 
            ...item, 
            input: values.text, 
            question: values.question || '',
            correctAnswer: values.correctAnswer || '',
            fullScore: values.fullScore === '' ? '' : values.fullScore,
            tag: selectedTags.join('、'),
            tags: selectedTags,
            description: values.description || '',
            checkStatus: values.checkStatus || '未核查',
            updateTime: now 
          }
        }
        return item
      }))

      setDatasetTextEditModalVisible(false)
      setDatasetTextEditingRecord(null)
      datasetTextEditForm.resetFields()
      messageApi.success('文本内容已更新')
    } catch (e) {
      // antd 会展示校验错误
    }
  }

  const handleDatasetTextEditCancel = () => {
    setDatasetTextEditModalVisible(false)
    setDatasetTextEditingRecord(null)
    datasetTextEditForm.resetFields()
  }

  const handleDatasetEditSave = async () => {
    try {
      const values = await datasetEditForm.validateFields()
      const selectedTags = Array.isArray(values.tag) ? values.tag.filter(Boolean) : (values.tag ? [values.tag] : [])
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const targetKey = datasetEditingRecord?.key
      const targetId = datasetEditingRecord?.id

      // 更新总数据
      const nextAll = datasetData.map(item => {
        if (item.id === targetId || item.key === targetKey) {
          return { 
            ...item, 
            input: `图片：${values.name}`, 
            recognition: values.name, 
            tag: selectedTags.join('、'),
            tags: selectedTags,
            description: values.description || '',
            checkStatus: values.checkStatus || '未核查',
            updateTime: now 
          }
        }
        return item
      })
      setDatasetData(nextAll)

      // 更新图片筛选数据（保持当前筛选视图一致）
      setDatasetImageFilteredData(prev => prev.map(item => {
        if (item.id === targetId || item.key === targetKey) {
          return { 
            ...item, 
            input: `图片：${values.name}`, 
            recognition: values.name,
            tag: selectedTags.join('、'),
            tags: selectedTags,
            description: values.description || '',
            checkStatus: values.checkStatus || '未核查',
            updateTime: now 
          }
        }
        return item
      }))

      setDatasetEditModalVisible(false)
      setDatasetEditingRecord(null)
      datasetEditForm.resetFields()
      messageApi.success('图片名称已更新')
    } catch (e) {
      // antd 会展示校验错误
    }
  }

  const handleDatasetEditCancel = () => {
    setDatasetEditModalVisible(false)
    setDatasetEditingRecord(null)
    datasetEditForm.resetFields()
  }

  const handleDatasetDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>您确定要删除以下数据集吗？</p>
          <p><strong>ID：</strong>{record.id}</p>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            <strong>注意：删除后无法恢复！</strong>
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 450,
      onOk() {
        setDatasetData(prev => prev.filter(item => item.id !== record.id))
        if (String(datasetTabKey).startsWith('text')) {
          setDatasetTextFilteredData(prev => prev.filter(item => item.id !== record.id))
        } else {
          setDatasetImageFilteredData(prev => prev.filter(item => item.id !== record.id))
        }
      messageApi.success(`已删除数据集：${record.id}`)
      },
      onCancel() {
      messageApi.info('已取消删除操作')
      }
    })
  }

  const handleDatasetBatchDelete = () => {
    const idsToDelete = String(datasetTabKey).startsWith('text') ? datasetSelectedIds : datasetSelectedImageIds
    if (!idsToDelete || idsToDelete.length === 0) {
    messageApi.warning('请先选择要删除的数据项')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: (
        <div>
          <p>您确定要删除选中的数据集吗？</p>
          <p><strong>数量：</strong>{idsToDelete.length} 条</p>
          <p style={{ color: '#ff4d4f', marginTop: 16 }}>
            <strong>注意：删除后无法恢复！</strong>
          </p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 450,
      onOk() {
        setDatasetData(prev => {
          const next = prev.filter(item => !idsToDelete.includes(item.id))
          const nextText = next.filter(d => !/^图片：/.test(String(d.input)))
          const nextImage = next.filter(d => /^图片：/.test(String(d.input)))
          setDatasetTextFilteredData(nextText)
          setDatasetImageFilteredData(nextImage)
          return next
        })
        setDatasetSelectedIds([])
        setDatasetSelectedImageIds([])
    messageApi.success(`已批量删除 ${idsToDelete.length} 条数据集`)
      },
      onCancel() {
    messageApi.info('已取消批量删除操作')
      }
    })
  }

  const handleDatasetImport = () => {
    messageApi.info('导入数据集功能')
  }

  const handleDatasetSearch = () => {
    setDatasetLoading(true)
    setTimeout(() => {
      const query = datasetSearchText.trim().toLowerCase()
      if (String(datasetTabKey).startsWith('text')) {
        const base = datasetData.filter(d => !/^图片：/.test(String(d.input)))
        const result = base.filter(item =>
          String(item.id).toLowerCase().includes(query) ||
          String(item.input).toLowerCase().includes(query)
        )
        setDatasetTextFilteredData(result)
      } else {
        const base = datasetData.filter(d => /^图片：/.test(String(d.input)))
        const result = base.filter(item =>
          String(item.id).toLowerCase().includes(query) ||
          String(item.input).toLowerCase().includes(query)
        )
        setDatasetImageFilteredData(result)
      }
      setDatasetLoading(false)
      messageApi.success('已应用筛选')
    }, 400)
  }

  const handleDatasetAdd = () => {
    datasetForm.resetFields()
    setDatasetUploadList([])
    setDatasetAddModalVisible(true)
  }

  const getNextDatasetId = () => {
    const ts = dayjs().format('YYYYMMDDHHmmss')
    // 查找当前秒已存在的编号，取最大后递增，确保唯一
    const suffixes = (datasetData || [])
      .map(d => {
        const m = /^T(\d{14})(\d{4})$/.exec(String(d.id))
        return (m && m[1] === ts) ? parseInt(m[2], 10) : 0
      })
    const maxSuffix = suffixes.length ? Math.max(...suffixes) : 0
    const next = (isFinite(maxSuffix) ? maxSuffix : 0) + 1
    return `T${ts}${String(next).padStart(4, '0')}`
  }

  const handleDatasetAddCancel = () => {
    setDatasetAddModalVisible(false)
    datasetForm.resetFields()
    setDatasetUploadList([])
    setDatasetTextUploadList([])
    setDatasetTextBatchEntries([])
  }

  const handleDatasetAddConfirm = async () => {
    try {
      const values = await datasetForm.validateFields()
      const { inputType, textInput, textMode, question, correctAnswer, fullScore, tag, description, checkStatus } = values
      const selectedTags = Array.isArray(tag) ? tag.filter(Boolean) : (tag ? [tag] : [])

      let inputValue = ''
      const normalizedType = normalizeInputType(inputType)
      if (normalizedType === 'text') {
        const mode = textMode || 'single'
        if (mode === 'single') {
          if (!textInput || !textInput.trim()) {
            messageApi.error('请输入文本内容')
            return
          }
          inputValue = textInput.trim()
        } else {
          // 批量文本
          if (!datasetTextBatchEntries || datasetTextBatchEntries.length === 0) {
            messageApi.error('请上传包含文本的文件')
            return
          }

          const nums = datasetData
            .map(d => {
              const m = /DS-(\d+)/.exec(d.id)
              return m ? parseInt(m[1], 10) : 0
            })
          const max = Math.max(...nums)
          let nextNum = (isFinite(max) ? max : 0)

          const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
          const ts = dayjs().format('YYYYMMDDHHmmss')
          const suffixes = datasetData.map(d => {
            const m = /^T(\d{14})(\d{4})$/.exec(String(d.id))
            return (m && m[1] === ts) ? parseInt(m[2], 10) : 0
          })
          const start = (suffixes.length ? Math.max(...suffixes) : 0) + 1
          const newRecords = datasetTextBatchEntries.map((entry, idx) => {
            const id = `T${ts}${String(start + idx).padStart(4, '0')}`
            const e = typeof entry === 'string' ? { input: entry } : (entry || {})
            return {
              key: `${Date.now().toString()}-${idx}`,
              id,
              type: 'text',
              input: e.input || '',
              question: e.question || '',
              correctAnswer: e.correctAnswer || '',
              fullScore: e.fullScore === undefined ? '' : e.fullScore,
              imageUrl: undefined,
              tag: selectedTags.join('、'),
              tags: selectedTags,
              description: description || '',
              checkStatus: checkStatus || '未核查',
              updateTime: now,
              createTime: now,
              creator: '管理员'
            }
          })

          setDatasetData(prev => [...newRecords, ...prev])
          setDatasetTextFilteredData(prev => [...newRecords, ...prev])
          setDatasetAddModalVisible(false)
          datasetForm.resetFields()
          setDatasetTextUploadList([])
          setDatasetTextBatchEntries([])
          messageApi.success(`已新增数据项：${newRecords.map(r => r.id).join(', ')}`)
          setDatasetTabKey('text')
          return
        }
      } else if (normalizedType === 'image') {
        if (!datasetUploadList || datasetUploadList.length === 0) {
          messageApi.error('请上传图片文件')
          return
        }
        // 过滤超过 10MB 的文件，并限制最多 60 张
        const files = datasetUploadList.slice(0, 60)
        const validFiles = files.filter(f => {
          const sizeMB = (f.size || (f.originFileObj && f.originFileObj.size) || 0) / 1024 / 1024
          return sizeMB <= 10
        })
        if (files.length > 60) {
          messageApi.warning('最多支持上传 60 张图片，已截取前 60 张')
        }
        if (validFiles.length < files.length) {
          messageApi.warning('部分图片超过 10MB 已忽略')
        }
        if (validFiles.length === 0) {
          messageApi.error('请选择不超过 10MB 的图片文件')
          return
        }

        // 转为 dataURL
        const dataUrls = await Promise.all(validFiles.map(f => {
          const raw = f.originFileObj || f
          return fileToDataURL(raw)
        }))

        // 生成连续 ID，并批量创建记录
        const nums = datasetData
          .map(d => {
            const m = /DS-(\d+)/.exec(d.id)
            return m ? parseInt(m[1], 10) : 0
          })
        const max = Math.max(...nums)
        let nextNum = (isFinite(max) ? max : 0)

        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const ts = dayjs().format('YYYYMMDDHHmmss')
        const suffixes = datasetData.map(d => {
          const m = /^i(\d{14})(\d{4})$/.exec(String(d.id))
          return (m && m[1] === ts) ? parseInt(m[2], 10) : 0
        })
        const start = (suffixes.length ? Math.max(...suffixes) : 0) + 1
        const newRecords = validFiles.map((file, idx) => {
          const id = `i${ts}${String(start + idx).padStart(4, '0')}`
          return {
            key: `${Date.now().toString()}-${idx}`,
            id,
            type: 'image',
            input: `图片：${file.name}`,
            question: '',
            correctAnswer: '',
            fullScore: '',
            imageUrl: dataUrls[idx],
            recognition: file.name,
            tag: selectedTags.join('、'),
            tags: selectedTags,
            description: description || '',
            checkStatus: checkStatus || '未核查',
            updateTime: now,
            createTime: now,
            creator: '管理员'
          }
        })

        setDatasetData(prev => [...newRecords, ...prev])
        setDatasetImageFilteredData(prev => [...newRecords, ...prev])
        setDatasetAddModalVisible(false)
        datasetForm.resetFields()
        setDatasetUploadList([])
        messageApi.success(`已新增数据项：${newRecords.map(r => r.id).join(', ')}`)
        setDatasetTabKey('image')
        return
      } else {
        messageApi.error('请选择数据集类型')
        return
      }

      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const newRecord = {
        key: Date.now().toString(),
        id: getNextDatasetId(),
        type: normalizedType,
        input: inputValue,
        question: normalizedType === 'text' && (textMode || 'single') !== 'batch' ? (question || '') : '',
        correctAnswer: normalizedType === 'text' && (textMode || 'single') !== 'batch' ? (correctAnswer || '') : '',
        fullScore: normalizedType === 'text' && (textMode || 'single') !== 'batch' ? (fullScore === undefined ? '' : fullScore) : '',
        imageUrl: undefined,
        tag: selectedTags.join('、'),
        tags: selectedTags,
        description: description || '',
        checkStatus: checkStatus || '未核查',
        updateTime: now,
        createTime: now,
        creator: '管理员'
      }

      setDatasetData(prev => [newRecord, ...prev])
      if (normalizedType === 'text') {
        setDatasetTextFilteredData(prev => [newRecord, ...prev])
      }
      setDatasetAddModalVisible(false)
      datasetForm.resetFields()
      setDatasetUploadList([])
      setDatasetTextUploadList([])
      setDatasetTextBatchEntries([])
      messageApi.success(`已新增数据项：${newRecord.id}`)
      setDatasetTabKey(normalizedType === 'image' ? 'image' : 'text')
    } catch (e) {
      // 校验错误已由 antd 显示
    }
  }

  const handleDatasetImportConfirm = async () => {
    try {
      const importType = datasetAddImportType
      
      // 根据类型验证必填字段
      let missingFields = []
      
      if (datasetAddImportType === '通用批阅') {
        if (!datasetAddImportFields.studentAnswer?.trim()) missingFields.push('学生作答')
        if (!datasetAddImportFields.originalQuestion?.trim()) missingFields.push('原题')
        if (!datasetAddImportFields.correctAnswer?.trim()) missingFields.push('正确答案')
        if (!datasetAddImportFields.fullScore?.trim()) missingFields.push('满分分数')
      } else if (datasetAddImportType === '作文评分') {
        if (!datasetAddImportFields.studentAnswer?.trim()) missingFields.push('学生作答')
        if (!datasetAddImportFields.gradingStandard?.trim()) missingFields.push('评分标准')
        if (!datasetAddImportFields.originalQuestion?.trim()) missingFields.push('原题')
        if (!datasetAddImportFields.fullScore?.trim()) missingFields.push('满分分数')
      } else if (datasetAddImportType === '手阅登分') {
        if (!datasetAddImportFields.fullScore?.trim()) missingFields.push('满分分数')
      } else if (datasetAddImportType === 'OCR识别') {
        if (!datasetAddImportFields.recognitionResult?.trim()) missingFields.push('识别结果')
      } else if (datasetAddImportType === '图片打分') {
        if (!datasetAddImportFields.originalQuestion?.trim()) missingFields.push('原题')
        if (!datasetAddImportFields.correctAnswer?.trim()) missingFields.push('正确答案')
        if (!datasetAddImportFields.fullScore?.trim()) missingFields.push('满分分数')
      }
      
      // 检查上传文件（对于需要上传的类型）
      if (['手阅登分', 'OCR识别', '图片打分'].includes(datasetAddImportType)) {
        if (!datasetUploadList || datasetUploadList.length === 0) {
          missingFields.push('上传文件')
        }
      }
      
      if (missingFields.length > 0) {
        messageApi.error(`请填写以下必填字段：${missingFields.join('、')}`)
        return
      }

      // 生成数据集记录
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const nums = datasetData
        .map(d => {
          const m = /DS-(\d+)/.exec(d.id)
          return m ? parseInt(m[1], 10) : 0
        })
      const max = Math.max(...nums)
      let nextNum = (isFinite(max) ? max : 0)

      const ts = dayjs().format('YYYYMMDDHHmmss')
      const suffixes = datasetData.map(d => {
        const m = /^DS-(\d{14})(\d{4})$/.exec(String(d.id))
        return (m && m[1] === ts) ? parseInt(m[2], 10) : 0
      })
      const start = (suffixes.length ? Math.max(...suffixes) : 0) + 1

      const isImage = ['手阅登分', 'OCR识别', '图片打分'].includes(importType)
      let inputValue = ''
      let recognitionValue = ''
      if (!isImage) {
        inputValue = (datasetAddImportFields.studentAnswer || '').trim() || `${importType}导入`
      } else {
        const firstFileName = datasetUploadList?.[0]?.name || '导入图片'
        inputValue = `图片：${firstFileName}`
        recognitionValue = (datasetAddImportFields.recognitionResult || '').trim() || firstFileName
      }

      const selectedTags = Array.isArray(datasetAddImportFields.tags) ? datasetAddImportFields.tags.filter(Boolean) : (datasetAddImportFields.tags ? [datasetAddImportFields.tags] : [importType])

              const newRecord = {
                key: Date.now().toString(),
                id: `DS-${ts}${String(start).padStart(4, '0')}`,
                type: isImage ? 'image' : 'text',
                input: inputValue,
                question: datasetAddImportFields.originalQuestion || '',
                correctAnswer: datasetAddImportFields.correctAnswer || '',
                fullScore: datasetAddImportFields.fullScore || '',
                recognition: recognitionValue,
                gradingStandard: datasetAddImportFields.gradingStandard || '',
                groundTruth: datasetAddImportFields.groundTruth || '',
                tag: selectedTags.join('、'),
                tags: selectedTags,
                description: datasetAddImportDescription || '',
                checkStatus: '未核查',
                updateTime: now,
        createTime: now,
        creator: '管理员'
      }

      // 添加到数据集
      setDatasetData(prev => [newRecord, ...prev])
      
      // 根据类型添加到相应的过滤数据
      if (['通用批阅', '作文评分'].includes(datasetAddImportType)) {
        setDatasetTextFilteredData(prev => [newRecord, ...prev])
      } else if (['手阅登分', 'OCR识别', '图片打分'].includes(datasetAddImportType)) {
        setDatasetImageFilteredData(prev => [newRecord, ...prev])
      }

      // 关闭模态框并重置状态
      setDatasetAddImportVisible(false)
      setDatasetAddImportName('')
      setDatasetAddImportDescription('')
      setDatasetAddImportFields({})
      setDatasetUploadList([])
      
      // 显示成功消息
      messageApi.success(`已成功导入${importType}数据集`)
      
      // 设置相应的标签页
      if (isImage) {
        setDatasetTabKey('image')
      } else {
        setDatasetTabKey('text')
      }

      setDatasetSearchText('')
      setDatasetIdFilter('')
      setDatasetCreatorFilter('')
      setDatasetTagsFilter([])
      setDatasetTagKeyword('')
      setDatasetFilterStatus(undefined)
      setDatasetTimeRange(null)

      // 触发卡片生成
      setDatasetAddCardsReady(true)

    } catch (e) {
      console.error('导入数据集时出错:', e)
      messageApi.error('导入数据集时发生错误')
    }
  }

  const handleDatasetReset = () => {
    setDatasetSearchText('')
    setDatasetIdFilter('')
    setDatasetCreatorFilter('')
    setDatasetTagsFilter([])
    setDatasetTagKeyword('')
    setDatasetTimeRange(null)
    const textData = datasetData.filter(d => !/^图片：/.test(String(d.input)))
    const imageData = datasetData.filter(d => /^图片：/.test(String(d.input)))
    if (String(datasetTabKey).startsWith('text')) {
      setDatasetTextFilteredData(textData)
    } else {
      setDatasetImageFilteredData(imageData)
    }
    messageApi.success('已重置数据集筛选条件')
  }

  const getImageNameFromInput = (input) => {
    const m = /^图片：(.+)$/.exec(String(input || ''))
    return m ? m[1] : String(input || '')
  }

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    } catch (e) {
      reject(e)
    }
  })

  const normalizeInputType = (t) => {
    const v = String(t || '')
    if (v === 'image' || v === '图片打分') return 'image'
    return 'text'
  }

  const isTextType = (t) => normalizeInputType(t) === 'text'

  const getMenuTitle = (key) => {
    const menuTitles = {
      'dashboard': '数据看板',
      'teaching-materials': '教辅管理',
      'paper-management': '组卷管理',
      'exam-creation': '测评中心',
      

      'dataset2': '数据集',
      'dataset-simple': '数据集',
      'dataset': '数据集管理',
      'shu-ji': '数据集',
      'playground': 'Playground',
      'logs': '日志',
      'evaluation': '工作流日志',
      'test-management': '测试管理',
      'question-card-management': '题卡管理',
      'grading-management': '批阅管理',
      'learning-report': '学情报告',
      // 教务管理父子
      'academic-management': '教务管理',
      'edu-phase-info': '学段信息',
      'subject-info': '学科信息',
      'subject-group-info': '学科组信息',
      'teaching-class-info': '教学班信息',
      'administrative-class-info': '行政班信息',
      'teacher-info': '教师信息',
      'student-info': '学生信息',
      // 系统管理父子
      'system-management': '系统管理',
      'menu-management': '菜单管理',
      'role-management': '角色管理',
      'strategy-management': '策略管理',
      'workflow-management': '工作流管理'
    }
    return menuTitles[key] || '教辅管理'
  }

  const isDatasetPage =
    (selectedMenu === 'workflow-management' && workflowTab === 'dataset') ||
    selectedMenu === 'dataset' ||
    selectedMenu === 'dataset2' ||
    selectedMenu === 'dataset-simple' ||
    selectedMenu === '00'
  const isPlaygroundPage =
    (selectedMenu === 'workflow-management' && workflowTab === 'playground') ||
    selectedMenu === 'playground'
  const isShuJiPage = selectedMenu === 'shu-ji'
  const isLogsPage =
    (selectedMenu === 'workflow-management' && workflowTab === 'logs') ||
    selectedMenu === 'logs'

  // 数据集（ShuJi）页面外部搜索框状态
  const [shuJiSearchText, setShuJiSearchText] = useState('')

  // 日志页面状态
  const [logsData, setLogsData] = useState(generateLogItems(48))
  const [logsFilteredData, setLogsFilteredData] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsNameFilter, setLogsNameFilter] = useState('')
  const [logsTargetFilter, setLogsTargetFilter] = useState('')
  const [logsSubjectTypeFilter, setLogsSubjectTypeFilter] = useState('')
  const [logsQueueFilter, setLogsQueueFilter] = useState('')
  const [logsWorkflowQueueFilter, setLogsWorkflowQueueFilter] = useState('')
  const [logsAgentIdFilter, setLogsAgentIdFilter] = useState('')
  const [logsAgentNameFilter, setLogsAgentNameFilter] = useState('')
  const [logsTenantNameFilter, setLogsTenantNameFilter] = useState('')
  const [logsStatusFilter, setLogsStatusFilter] = useState(undefined)
  const [logsCheckStatusFilter, setLogsCheckStatusFilter] = useState(undefined)
  const [logsDateRange, setLogsDateRange] = useState(null)
  const [logsSelectedRowKeys, setLogsSelectedRowKeys] = useState([])
  const [logsSelectedRows, setLogsSelectedRows] = useState([])
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false)
  const compareGridRef = useRef(null)
  const [logsViewModalOpen, setLogsViewModalOpen] = useState(false)
  const [logsViewRecord, setLogsViewRecord] = useState(null)

  const handleLogView = (record) => {
    setLogsViewRecord(record)
    setLogsViewModalOpen(true)
  }

  const handleLogDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除该日志记录（${record?.key || ''}）？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setLogsData((prev) => (prev || []).filter((item) => item.key !== record.key))
        setLogsSelectedRowKeys((prev) => (prev || []).filter((k) => k !== record.key))
        setLogsSelectedRows((prev) => (prev || []).filter((r) => r.key !== record.key))
        messageApi.success('已删除')
      }
    })
  }

  const handleLogsBatchDelete = () => {
    const keys = logsSelectedRowKeys || []
    if (!keys.length) return
    Modal.confirm({
      title: '批量删除确认',
      content: `将删除选中的 ${keys.length} 条日志记录，是否继续？`,
      okText: '批量删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        setLogsData((prev) => (prev || []).filter((item) => !keys.includes(item.key)))
        setLogsSelectedRowKeys([])
        setLogsSelectedRows([])
        messageApi.success('已批量删除')
      }
    })
  }
  const [compareDrawerWidth, setCompareDrawerWidth] = useState(520)

  useEffect(() => {
    if (!compareDrawerOpen) return
    const scroller = compareGridRef.current
    if (!scroller) return
    const measure = () => {
      const inner = scroller.firstElementChild
      const contentWidth = inner ? inner.scrollWidth : scroller.scrollWidth
      const maxW = Math.floor(window.innerWidth * 0.75)
      const desired = Math.max(420, contentWidth + 24)
      setCompareDrawerWidth(Math.min(desired, maxW))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
    }
  }, [compareDrawerOpen, logsSelectedRows])

  const ResizableTitle = (props) => {
    const { onResize, width, ...restProps } = props;

    if (!width) {
      return <th {...restProps} />;
    }

    return (
      <Resizable
        width={width}
        height={0}
        handle={<span className="react-resizable-handle" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: '-5px', bottom: '0', zIndex: '1', width: '10px', height: '100%', cursor: 'col-resize', opacity: 0 }} />}
        onResize={onResize}
        draggableOpts={{ enableUserSelectHack: false }}
      >
        <th {...restProps} />
      </Resizable>
    );
  };

  // 从“执行名称”中解析科目与题型，示例：
  // 【语文作文题】OCR识别 -> ["语文","作文题"]
  const getSubjectTypeListFromName = (rawName) => {
    const name = String(rawName || '')
    const match = name.match(/【([^】]+)】/)
    const inside = match ? match[1] : name
    const subjectsFound = (TAG_SUBJECTS || []).filter(s => inside.includes(s))
    let remainder = inside
    subjectsFound.forEach(s => { remainder = remainder.split(s).join('') })
    const tokens = remainder.split(/[\s、，,]+/).filter(Boolean)
    const list = Array.from(new Set([...(subjectsFound || []), ...(tokens || [])])).filter(Boolean)
    return list
  }

  const LOG_COLUMNS_BASE = [
    { title: '创建日志时间', dataIndex: 'createTime', key: 'createTime', width: 160 },
    { title: '执行状态', dataIndex: 'status', key: 'status', width: 100, render: (_, record) => {
      // 仅显示两种：完成 或 失败
      return record?.status === '成功' ? '完成' : '失败'
    } },
    { title: '消息队列', dataIndex: 'workflowQueue', key: 'queue', width: 160, ellipsis: true },
    { title: '执行端ID', dataIndex: 'agentId', key: 'agentId', width: 140, ellipsis: true, render: (value) => {
      const idStr = String(value || '')
      const suffix = idStr.includes('-') ? idStr.split('-').pop() : idStr
      return `执行端ID-${suffix || '未知'}`
    } },
    { title: '执行端名称', dataIndex: 'agentName', key: 'agentName', width: 140, ellipsis: true },
    { title: '误差率', dataIndex: 'accuracy', key: 'accuracy', width: 100, render: (_, record) => {
      const success = Number(record.successCount) || 0
      const error = Number(record.errorCount) || 0
      const total = success + error
      if (!total) return '-'
      const err = Math.round((error / total) * 100)
      return `${err}%`
    } },
    { title: '工作流队列', dataIndex: 'queue', key: 'workflowQueue', width: 160, ellipsis: true },
    { title: '模型描述', dataIndex: 'target', key: 'target', width: 160, ellipsis: true },
    { title: '适用科目和题型', dataIndex: 'subjectTypes', key: 'subjectTypes', width: 200, ellipsis: true, render: (_, record) => {
      const list = getSubjectTypeListFromName(record?.name)
      return (list && list.length) ? list.join('、') : '-'
    } },
    { title: '提示词', dataIndex: 'prompt', key: 'prompt', width: 200, ellipsis: true, render: (_, record) => `${record.name}的提示词` },
    { title: '核查状态', dataIndex: 'checkStatus', key: 'checkStatus', width: 120 },
    { title: '教育机构名称', dataIndex: 'tenantName', key: 'tenantName', width: 160, ellipsis: true },
  ]

  const [logColumns, setLogColumns] = useState(LOG_COLUMNS_BASE)
  const handleLogResize = (index) => (_, { size }) => {
    setLogColumns((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        width: size.width,
      };
      return next;
    });
  };
  const logHeaderComponents = { header: { cell: ResizableTitle } }
  const computedLogColumns = logColumns.map((col, index) => ({
    ...col,
    onHeaderCell: (column) => ({
      width: column.width,
      onResize: handleLogResize(index),
    }),
  }));
  const logsScrollX = (logColumns || []).reduce((sum, c) => sum + (Number(c.width) || 100), 0) + 200

  useEffect(() => {
    if (!isLogsPage) return
    const nameQuery = (logsNameFilter || '').trim().toLowerCase()
    const targetQuery = (logsTargetFilter || '').trim().toLowerCase()
    const subjectTypeQuery = (logsSubjectTypeFilter || '').trim().toLowerCase()
    const queueQuery = (logsQueueFilter || '').trim().toLowerCase()
    const workflowQueueQuery = (logsWorkflowQueueFilter || '').trim().toLowerCase()
    const agentIdQuery = (logsAgentIdFilter || '').trim().toLowerCase()
    const agentNameQuery = (logsAgentNameFilter || '').trim().toLowerCase()
    const tenantNameQuery = (logsTenantNameFilter || '').trim().toLowerCase()
    const [start, end] = logsDateRange || []
    const startTs = start ? dayjs(start).valueOf() : null
    const endTs = end ? dayjs(end).valueOf() : null
    const next = (logsData || []).filter(item => {
      // 状态筛选
      if (logsStatusFilter) {
        // “执行状态”显示为：完成 或 失败
        // 完成 -> 原始状态为 成功；失败 -> 原始状态非 成功
        const isSuccess = item.status === '成功'
        if (logsStatusFilter === '完成' && !isSuccess) return false
        if (logsStatusFilter === '失败' && isSuccess) return false
      }
      // 核查状态筛选
      if (logsCheckStatusFilter && item.checkStatus !== logsCheckStatusFilter) return false
      // 时间段筛选
      if (startTs || endTs) {
        const t = dayjs(item.createTime).valueOf()
        if (startTs && t < startTs) return false
        if (endTs && t > endTs) return false
      }
      // 已移除综合文本搜索（改用独立输入条件）
      // 独立输入筛选（名称/对象/科目和题型/消息队列/工作流队列/执行端ID/执行端名称/教育机构名称）
      const subjectTypesText = (getSubjectTypeListFromName(item?.name || '') || []).join(' ')
      const matchName = !nameQuery || String(item.name || '').toLowerCase().includes(nameQuery)
      const matchTarget = !targetQuery || String(item.target || '').toLowerCase().includes(targetQuery)
      const matchSubjectType = !subjectTypeQuery || String(subjectTypesText || '').toLowerCase().includes(subjectTypeQuery)
      const matchQueue = !queueQuery || String(item.queue || '').toLowerCase().includes(queueQuery)
      const matchWorkflowQueue = !workflowQueueQuery || String(item.workflowQueue || '').toLowerCase().includes(workflowQueueQuery)
      const matchAgentId = !agentIdQuery || String(item.agentId || '').toLowerCase().includes(agentIdQuery)
      const matchAgentName = !agentNameQuery || String(item.agentName || '').toLowerCase().includes(agentNameQuery)
      const matchTenantName = !tenantNameQuery || String(item.tenantName || '').toLowerCase().includes(tenantNameQuery)
      if (!(matchName && matchTarget && matchSubjectType && matchQueue && matchWorkflowQueue && matchAgentId && matchAgentName && matchTenantName)) return false
      return true
    })
    setLogsFilteredData(next)
  }, [isLogsPage, logsData, logsNameFilter, logsTargetFilter, logsSubjectTypeFilter, logsQueueFilter, logsWorkflowQueueFilter, logsAgentIdFilter, logsAgentNameFilter, logsTenantNameFilter, logsStatusFilter, logsCheckStatusFilter, logsDateRange])

  // Playground 页面状态
  
  const [pgConfigCollapsed, setPgConfigCollapsed] = useState(false)
  const [pgDatasetCollapsed, setPgDatasetCollapsed] = useState(false)
  const [pgPreviewCollapsed, setPgPreviewCollapsed] = useState(false)

  // 比较模式：左侧上下栈行高与拖拽调整
  const pgContainerRef = useRef(null)
  const [pgTopHeightPx, setPgTopHeightPx] = useState(null)
  const [pgIsResizing, setPgIsResizing] = useState(false)
  const configCardLeftRef = useRef(null)
  const configCardRightRef = useRef(null)

  // 自由对比模式：左右列容器与独立拖拽状态
  const pgLeftColRef = useRef(null)
  const pgRightColRef = useRef(null)
  const [pgTopLeftHeightPx, setPgTopLeftHeightPx] = useState(45)
  const [pgTopRightHeightPx, setPgTopRightHeightPx] = useState(null)
  const [pgIsResizingLeft, setPgIsResizingLeft] = useState(false)
  const [pgIsResizingRight, setPgIsResizingRight] = useState(false)
  // 工作流配置区卡片内部上下分区（左列）
  const innerSplitContainerLeftRef = useRef(null)
const [innerTopHeightLeft, setInnerTopHeightLeft] = useState(48) // 将左上分区高度调整为当前大小的一半
  const [innerIsResizingLeft, setInnerIsResizingLeft] = useState(false)

  useEffect(() => {
    if (pgCompareMode && pgContainerRef.current && pgTopHeightPx == null) {
      const h = pgContainerRef.current.clientHeight || window.innerHeight
      const initTop = Math.floor(h / 2)
      const min = 30
      const max = h - 120
      setPgTopHeightPx(Math.max(min, Math.min(max, initTop)))
    }
  }, [pgCompareMode, pgTopHeightPx])

  // 进入自由对比模式后初始化左右列的顶部高度
  useEffect(() => {
    if (!pgCompareMode) return
    const initCol = (ref, setter, currentVal) => {
      if (currentVal != null) return
      const h = (ref.current?.clientHeight) || (pgContainerRef.current?.clientHeight) || window.innerHeight
      const initTop = Math.floor(h / 2)
      const min = 30
      const max = h - 120
      setter(Math.max(min, Math.min(max, initTop)))
    }
    // initCol(pgLeftColRef, setPgTopLeftHeightPx, pgTopLeftHeightPx)
    initCol(pgRightColRef, setPgTopRightHeightPx, pgTopRightHeightPx)
  }, [pgCompareMode, pgTopLeftHeightPx, pgTopRightHeightPx])

  useEffect(() => {
    const handleMove = (e) => {
      if (!pgIsResizing || !pgContainerRef.current) return
      const rect = pgContainerRef.current.getBoundingClientRect()
      let next = e.clientY - rect.top
      const min = 30
      const max = rect.height - 120
      if (next < min) next = min
      if (next > max) next = max
      setPgTopHeightPx(next)
    }
    const handleUp = () => setPgIsResizing(false)
    if (pgIsResizing) {
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [pgIsResizing])

  // 左列拖拽事件
  // useEffect(() => {
  //   if (!pgIsResizingLeft) return
  //   const handleMove = (e) => {
  //     if (!pgLeftColRef.current) return
  //     const rect = pgLeftColRef.current.getBoundingClientRect()
  //     let next = e.clientY - rect.top
  //     const min = 30
  //     const max = rect.height - 120
  //     if (next < min) next = min
  //     if (next > max) next = max
  //     setPgTopLeftHeightPx(next)
  //   }
  //   const handleUp = () => setPgIsResizingLeft(false)
  //   document.addEventListener('mousemove', handleMove)
  //   document.addEventListener('mouseup', handleUp)
  //   return () => {
  //     document.removeEventListener('mousemove', handleMove)
  //     document.removeEventListener('mouseup', handleUp)
  //   }
  // }, [pgIsResizingLeft])

  // 左列卡片内部拖拽事件（上下分区）
  // useEffect(() => {
  //   if (!innerIsResizingLeft) return
  //   const handleMove = (e) => {
  //     if (!innerSplitContainerLeftRef.current) return
  //     const rect = innerSplitContainerLeftRef.current.getBoundingClientRect()
  //     let next = e.clientY - rect.top
  //     const min = 30
  //     const max = rect.height - 120
  //     if (next < min) next = min
  //     if (next > max) next = max
  //     setInnerTopHeightLeft(next)
  //   }
  //   const handleUp = () => setInnerIsResizingLeft(false)
  //   document.addEventListener('mousemove', handleMove)
  //   document.addEventListener('mouseup', handleUp)
  //   return () => {
  //     document.removeEventListener('mousemove', handleMove)
  //     document.removeEventListener('mouseup', handleUp)
  //   }
  // }, [innerIsResizingLeft])

  // 右列拖拽事件
  useEffect(() => {
    if (!pgIsResizingRight) return
    const handleMove = (e) => {
      if (!pgRightColRef.current) return
      const rect = pgRightColRef.current.getBoundingClientRect()
      let next = e.clientY - rect.top
      const min = 30
      const max = rect.height - 120
      if (next < min) next = min
      if (next > max) next = max
      setPgTopRightHeightPx(next)
    }
    const handleUp = () => setPgIsResizingRight(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [pgIsResizingRight])

  // 进入自由对比模式后，默认将配置区滚动到底部（左右两侧）
  useEffect(() => {
    if (!pgCompareMode || pgConfigCollapsed) return;

    const createScrollLogic = (ref) => {
      const scrollableElement = ref?.current?.querySelector?.('.ant-card-body');
      if (!scrollableElement) {
        return { cleanup: () => {} };
      }

      const scrollToBottom = () => {
        try {
          scrollableElement.scrollTop = scrollableElement.scrollHeight;
        } catch {}
      };

      const timeoutId1 = setTimeout(scrollToBottom, 0);
      const timeoutId2 = setTimeout(scrollToBottom, 100);

      return { 
        cleanup: () => {
          clearTimeout(timeoutId1);
          clearTimeout(timeoutId2);
        }
      };
    };

    const { cleanup: cleanupLeft } = createScrollLogic(configCardLeftRef);
    const { cleanup: cleanupRight } = createScrollLogic(configCardRightRef);

    return () => {
      cleanupLeft();
      cleanupRight();
    };
  }, [pgCompareMode, pgTopLeftHeightPx, pgTopRightHeightPx, pgConfigCollapsed]);

  

  // 选中工作流与提示词文本
  const [selectedWorkflowKey, setSelectedWorkflowKey] = useState(null)
  const [promptText, setPromptText] = useState('')

  // 自由对比模式：左右独立选中与提示词
  const [selectedWorkflowKeyLeft, setSelectedWorkflowKeyLeft] = useState(null)
  const [selectedWorkflowKeyRight, setSelectedWorkflowKeyRight] = useState(null)
  const [promptTextLeft, setPromptTextLeft] = useState('')
  const [promptTextRight, setPromptTextRight] = useState('')

  const generatePromptForWorkflow = (wf) => {
    const subjects = wf?.subjects?.join(', ') || '-'
    const base = `请根据以下工作流参数生成评测提示词：\n- 工作流名称：${wf?.name} \n- 工作流类别：${wf?.type} \n- 科目和题型：${subjects} \n- 工作流ID：${wf?.id}`
    let extra = ''
    if (wf?.type === 'OCR工作流') {
      extra = '\n要求：识别题干与答案文本，保留段落结构，提取关键信息并输出结构化结果（题号、文本、关键信息）。'
    } else if (wf?.type === '批改工作流') {
      extra = '\n要求：依据评分标准批改，给出分点与总分，并提供简要反馈与改进建议。'
    } else if (wf?.type === '多模态工作流') {
      extra = '\n要求：结合图像/文本进行分析，明确识别目标与回答要点，输出结构化结论。'
    }
    return `${base}${extra}`
  }

  const handleWorkflowRowClick = (record) => {
    setSelectedWorkflowKey(record?.key)
    setPromptText(record?.prompt ?? generatePromptForWorkflow(record))
  }

  // 左右独立点击处理（自由模式）
  const handleWorkflowRowClickLeft = (record) => {
    setSelectedWorkflowKeyLeft(record?.key)
    setPromptTextLeft(record?.prompt ?? generatePromptForWorkflow(record))
  }
  const handleWorkflowRowClickRight = (record) => {
    setSelectedWorkflowKeyRight(record?.key)
    setPromptTextRight(record?.prompt ?? generatePromptForWorkflow(record))
  }

  // Tooltip 受控状态：点击对应按钮后立即关闭悬浮提示
  const [tipConfigAddOpen, setTipConfigAddOpen] = useState(false)
  const [tipConfigAddOpenLeft, setTipConfigAddOpenLeft] = useState(false)
  const [tipConfigAddOpenRight, setTipConfigAddOpenRight] = useState(false)
  const [tipConfigToggleOpen, setTipConfigToggleOpen] = useState(false)
  const [tipDatasetToggleOpen, setTipDatasetToggleOpen] = useState(false)
  const [tipPreviewToggleOpen, setTipPreviewToggleOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [previewHistory, setPreviewHistory] = useState([])
  // 历史明细弹窗状态
  const [historyDetailModalOpen, setHistoryDetailModalOpen] = useState(false)
  const [historyDetailRecord, setHistoryDetailRecord] = useState(null)
  // 历史记录对比与选择状态
  const [historyCompareModalOpen, setHistoryCompareModalOpen] = useState(false)
  const [selectedHistoryRowKeys, setSelectedHistoryRowKeys] = useState([])
  const [historyCompareSortKey, setHistoryCompareSortKey] = useState('accuracy_desc')
  // 历史测试记录筛选状态
  const [historyFilterQueue, setHistoryFilterQueue] = useState('')
  const [historyFilterTester, setHistoryFilterTester] = useState('')
  const [historyFilterRange, setHistoryFilterRange] = useState(null)

  // 过滤后的历史记录（按 工作流队列、测试人员、创建日志时间）
  const filteredHistory = useMemo(() => {
    let list = Array.isArray(previewHistory) ? previewHistory : []
    const q = String(historyFilterQueue || '').trim().toLowerCase()
    const t = String(historyFilterTester || '').trim().toLowerCase()
    if (q) list = list.filter(r => String(r.queue || '').toLowerCase().includes(q))
    if (t) list = list.filter(r => String(r.tester || '').toLowerCase().includes(t))
    if (Array.isArray(historyFilterRange) && historyFilterRange.length === 2 && historyFilterRange[0] && historyFilterRange[1]) {
      const [start, end] = historyFilterRange
      list = list.filter(r => {
        const m = dayjs(r.logTime, 'YYYY-MM-DD HH:mm:ss')
        return (m.isSame(start, 'second') || m.isAfter(start)) && (m.isSame(end, 'second') || m.isBefore(end))
      })
    }
    return list
  }, [previewHistory, historyFilterQueue, historyFilterTester, historyFilterRange])

  // 当前登录用户（用于“测试人员”字段），可从本地存储读取
  const currentUserName = typeof window !== 'undefined' ? (localStorage.getItem('currentUserName') || '管理员') : '管理员'

  // 历史测试记录表头（顺序与需求一致）
  const openHistoryDetail = (record) => { setHistoryDetailRecord(record); setHistoryDetailModalOpen(true) }
  const historyColumns = [
    { title: '创建日志时间', dataIndex: 'logTime', key: 'logTime', width: 160 },
    { title: '工作流队列', dataIndex: 'queue', key: 'queue', width: 220, ellipsis: true },
    { title: '提示词', dataIndex: 'prompt', key: 'prompt', width: 240, ellipsis: true },
    { title: '总耗时', dataIndex: 'totalTime', key: 'totalTime', width: 100 },
    { title: '平均耗时', dataIndex: 'avgTime', key: 'avgTime', width: 100 },
    { title: '准确率', dataIndex: 'accuracy', key: 'accuracy', width: 100 },
    { title: '失败数量', dataIndex: 'failCount', key: 'failCount', width: 100 },
    { title: '准确数量', dataIndex: 'successCount', key: 'successCount', width: 100 },
    { title: '错误数量', dataIndex: 'errorCount', key: 'errorCount', width: 100 },
    { title: '数据集描述', dataIndex: 'datasetDesc', key: 'datasetDesc', width: 320, ellipsis: true },
    { title: '适用科目和题型', dataIndex: 'subjectType', key: 'subjectType', width: 180, ellipsis: true },
    { title: '测试开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
    { title: '测试结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
    { title: '测试人员', dataIndex: 'tester', key: 'tester', width: 120 }
  ]

  // 从运行输出计算历史记录的度量信息
  const buildHistoryFromRun = (wf, output, startTime, endTime, extras = {}) => {
    const datasets = (output?.datasets || [])
    const count = datasets.length || 0
    const times = datasets.map(ds => parseFloat(String(ds.elapsed || '0').replace('s', '')) || 0)
    const total = times.reduce((a, b) => a + b, 0)
    const avg = count ? total / count : 0
    const failCount = datasets.filter(ds => {
      const stage1 = (ds?.models || [])[1]?.output || ''
      return String(stage1).includes('失败')
    }).length
    const successCount = Math.max(0, count - failCount)
    const accuracy = count ? Math.round((successCount / count) * 100) : 0
    // 数据集概览描述：与测试结果总览中的“数据集描述”一致
    const textCount = datasets.filter(ds => ds.type === 'text').length
    const imageCount = datasets.filter(ds => ds.type === 'image').length
    const dtKey = extras.datasetTabKey || datasetTabKey
    const labelMap = { text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }
    let datasetDesc = '-'
    if (textCount > 0 && imageCount > 0) {
      datasetDesc = `本次测试选取了${textCount + imageCount}条文本和图片数据集`
    } else if (textCount > 0 && imageCount === 0) {
      datasetDesc = `本次测试选取了${textCount}条${labelMap[dtKey] || '通用批阅'}数据集`
    } else if (textCount === 0 && imageCount > 0) {
      datasetDesc = `本次测试选取了${imageCount}条${labelMap[dtKey] || '图片'}数据集`
    }
    const subjectTypeText = [wfPrimarySubject, wfPrimaryType].filter(Boolean).join('-') || '-'
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      logTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      queue: wfQueue || wf?.id || wf?.name || '默认队列',
      prompt: extras.promptText || '-',
      totalTime: `${total.toFixed(2)}s`,
      avgTime: `${avg.toFixed(2)}s`,
      accuracy: `${accuracy}%`,
      failCount,
      successCount,
      errorCount: 0,
      datasetDesc,
      subjectType: subjectTypeText,
      startTime: dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
      endTime: dayjs(endTime).format('YYYY-MM-DD HH:mm:ss'),
      tester: currentUserName,
      rawOutput: output,
      datasetTabKey: dtKey
    }
  }

  // 默认生成5条历史记录
  useEffect(() => {
    if ((previewHistory || []).length === 0) {
      const seed = Array.from({ length: 5 }).map((_, i) => ({
        id: `seed-${i}-${Date.now()}`,
        logTime: dayjs().subtract(i, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        queue: '通用默认队列 (wf.general.default)',
        prompt: `示例提示词 ${i + 1}`,
        totalTime: `${(Math.random()*6+2).toFixed(2)}s`,
        avgTime: `${(Math.random()*2+0.5).toFixed(2)}s`,
        accuracy: `${Math.round(Math.random()*20 + 80)}%`,
        failCount: Math.round(Math.random()*2),
        successCount: Math.round(Math.random()*5 + 10),
        errorCount: 0,
        datasetDesc: `本次测试选取了${Math.round(Math.random()*5 + 10)}条通用批阅数据集`,
        subjectType: '生物-填空题',
        startTime: dayjs().subtract(i, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        endTime: dayjs().subtract(i, 'minute').add(1, 'second').format('YYYY-MM-DD HH:mm:ss'),
        tester: currentUserName,
        rawOutput: null,
        datasetTabKey: 'text'
      }))
      setPreviewHistory(seed)
    }
  }, [])

  // 运行输出（普通模式或自由模式左右两侧）
  const [runOutput, setRunOutput] = useState(null)
  const [runOutputLeft, setRunOutputLeft] = useState(null)
  const [runOutputRight, setRunOutputRight] = useState(null)

  const getWorkflowByKey = (key) => (workflowList || []).find(w => String(w.key) === String(key))

  // 判定是否为 td 工作流：
  // 约定规则：类型为“批改工作流”或名称/ID/模型配置中包含“td”（不区分大小写）即视为 td；
  // 后续若有更明确的字段（如 wf.kind === 'td'），可替换此逻辑。
  const isTdWorkflow = (wf) => {
    if (!wf) return false
    if (wf.type === '批改工作流') return true
    const s = `${wf.id || ''} ${wf.name || ''} ${wf.type || ''} ${(wf.modelConfig || []).join(' ')}`.toLowerCase()
    return s.includes('td')
  }

  // 当仅选择了“工作流队列”但未选择具体工作流时，基于队列构建一个临时工作流用于运行
  const inferWorkflowTypeFromQueue = (queue) => {
    const q = queue || ''
    if (q.includes('评分')) return '批改工作流'
    if (q.toUpperCase().includes('OCR')) return 'OCR工作流'
    return '多模态工作流'
  }

  const buildTempWorkflowFromQueue = (queue) => {
    const type = inferWorkflowTypeFromQueue(queue)
    const nowKey = `temp-${Date.now()}`
    const baseConfig = type === '批改工作流'
      ? ['评分模型', '评分策略']
      : (type === 'OCR工作流' ? ['OCR识别', '文本后处理'] : ['多模态推理', '知识库检索'])
    return {
      id: nowKey,
      key: nowKey,
      name: queue || '临时工作流',
      type,
      subjects: [wfPrimarySubject, wfPrimaryType].filter(Boolean),
      modelConfig: baseConfig,
      org: wfOrg,
      grade: wfGrade,
      prompt: wfPrompt || buildDefaultPrompt(queue, wfPrimarySubject, wfPrimaryType)
    }
  }

  const buildWorkflowDesc = (wf) => {
    const seq = (wf?.modelConfig || []).map(x => String(x)).join('→')
    return seq ? `【${seq}】` : '【未配置模型】'
  }

  const makeRunOutput = (wf, ids = [], imageIds = []) => {
    const all = (datasetData || [])
    const pick = (arr) => arr
      .map(id => all.find(item => String(item.id) === String(id)))
      .filter(Boolean)

    const textItems = pick(ids).map((item, idx) => ({
      id: item.id,
      name: String(item.input || `文本${idx+1}`),
      type: 'text',
      models: (wf?.modelConfig || []).map((m, i) => ({
        model: String(m),
        output: i === 0 ? '基础检查通过' : (i === 1 ? (item.recognition || (Math.random() > 0.3 ? '识别到题干与答案文本' : '识别失败：无法解析文本内容')) : '批改完成：得分 85/100'),
        score: i === 0 ? undefined : (i === 1 ? undefined : 0.85),
      })),
      elapsed: `${(Math.random()*2+0.8).toFixed(2)}s`
    }))

    const imageItems = pick(imageIds).map((item, idx) => ({
      id: item.id,
      name: getImageNameFromInput(item.input) || `图片${idx+1}`,
      type: 'image',
      models: (wf?.modelConfig || []).map((m, i) => ({
        model: String(m),
        output: i === 0 ? '' : (i === 1 ? (item.recognition || (Math.random() > 0.4 ? 'OCR识别到若干文本段落' : 'OCR识别失败：图像质量不佳')) : 'Q&A生成：总结与批改结果'),
        score: i === 0 ? undefined : (i === 1 ? undefined : 0.92),
      })),
      elapsed: `${(Math.random()*8+1.2).toFixed(2)}s`
    }))

    return {
      workflow: {
        id: wf?.id,
        name: wf?.name,
        type: wf?.type,
        subjects: wf?.subjects || [],
        list: wf?.modelConfig || [],
        description: buildWorkflowDesc(wf)
      },
      datasets: [...textItems, ...imageItems]
    }
  }

  const handleRunNormal = () => {
    let wf = getWorkflowByKey(selectedWorkflowKey)
    // 若未选择具体工作流但选择了队列，则使用基于队列的临时工作流运行
    if (!wf) {
      if (!wfQueue) return
      wf = buildTempWorkflowFromQueue(wfQueue)
    }
    // 仅根据是否选择了队列控制“添加进到现有工作流队列”按钮启用，不弹出提示
    setAddQueueEnabled(Boolean(wfQueue))
    // 记录测试开始时间
    const startTime = new Date().toISOString()
    // 运行中
    setTestStatusRight('running')
    const output = makeRunOutput(wf, previewDatasetIds, previewDatasetImageIds)
    // 记录测试结束时间
    const endTime = new Date().toISOString()
    setRunOutput(output)
    // 已完成
    setTestStatusRight('completed')
    // 将本次运行记录到历史测试记录表
    const record = buildHistoryFromRun(wf, output, startTime, endTime, { promptText, datasetTabKey })
    setPreviewHistory((prev) => [record, ...prev].slice(0, 50))
    messageApi.success('运行完成，已在预览区展示结果')
  }

  const handleRunLeft = () => {
    let wf = getWorkflowByKey(selectedWorkflowKeyLeft)
    if (!wf) {
      if (!wfQueue) return
      wf = buildTempWorkflowFromQueue(wfQueue)
    }
    // 左侧同样仅更新按钮启用状态，不弹提示
    setAddQueueEnabled(Boolean(wfQueue))
    // 记录测试开始时间
    const startTime = new Date().toISOString()
    const output = makeRunOutput(wf, previewDatasetIdsLeft, previewDatasetImageIdsLeft)
    // 记录测试结束时间
    const endTime = new Date().toISOString()
    setRunOutputLeft(output)
    // 将左侧运行记录到历史测试记录表
    const record = buildHistoryFromRun(wf, output, startTime, endTime, { promptText: (promptTextLeft || promptText), datasetTabKey })
    setPreviewHistory((prev) => [record, ...prev].slice(0, 50))
    messageApi.success('基准组运行完成，已在左侧预览区展示结果')
  }

  const handleRunRight = () => {
    let wf = getWorkflowByKey(selectedWorkflowKeyRight)
    if (!wf) {
      if (!wfQueue) return
      wf = buildTempWorkflowFromQueue(wfQueue)
    }
    // 记录测试开始时间
    const startTime = new Date().toISOString()
    // 运行中
    setTestStatusRight('running')
    const output = makeRunOutput(wf, previewDatasetIdsRight, previewDatasetImageIdsRight)
    // 记录测试结束时间
    const endTime = new Date().toISOString()
    setRunOutputRight(output)
    // 已完成
    setTestStatusRight('completed')
    // 将右侧运行记录到历史测试记录表
    const record = buildHistoryFromRun(wf, output, startTime, endTime, { promptText: (promptTextRight || promptText), datasetTabKey })
    setPreviewHistory((prev) => [record, ...prev].slice(0, 50))
    messageApi.success('对照组运行完成，已在右侧预览区展示结果')
  }

  // 将当前选择的“工作流队列”加入到现有工作流队列抽屉列表
  const handleAddQueueToExisting = () => {
    if (!addQueueEnabled) {
      messageApi.warning('请先选择工作流队列并点击运行')
      return
    }
    if (!wfQueue) {
      messageApi.warning('请先选择工作流队列')
      return
    }
    // 当前提示词（取运行区域的提示词：左侧优先，否则使用公共）
    const currentPrompt = pgCompareMode ? (promptTextLeft || promptText) : promptText
    // 当前数据集选择（按模式取左侧或公共）
    const dsTextIds = pgCompareMode ? (previewDatasetIdsLeft || []) : (previewDatasetIds || [])
    const dsImageIds = pgCompareMode ? (previewDatasetImageIdsLeft || []) : (previewDatasetImageIds || [])
    const datasetSignature = `${[...dsTextIds].sort().join(',')}|${[...dsImageIds].sort().join(',')}`

    // 去重：若队列、提示词、数据集均与已存在记录一致，则不再添加
    const exists = generalWorkflowList.some(item => (
      item?.name === wfQueue &&
      item?.prompt === (currentPrompt || '') &&
      item?.datasetSignature === datasetSignature
    ))
    if (exists) {
      messageApi.info('现有工作流队列已存在该工作流队列')
      return
    }
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const newItem = {
      key: `Q-${Date.now()}`,
      id: `QUEUE-${dayjs().format('YYYYMMDDHHmmss')}`,
      name: wfQueue,
      type: undefined,
      modelConfig: [],
      createTime: now,
      subjects: [wfPrimarySubject || '-', wfPrimaryType || '-'],
      grade: wfGrade || '所有年级',
      org: wfOrg || '所有教育机构',
      prompt: currentPrompt || '',
      datasetSignature
    }
    setGeneralWorkflowList(prev => [newItem, ...prev])
    messageApi.success('已添加到现有工作流队列')
  }

  const renderPreview = (output, datasetInfo = {}) => {
    if (!output) return (
      <div style={{ flex: 1, background: '#f7f9fc', border: '1px dashed #e5e7eb', padding: 12, color: '#666', ...(pgCompareMode ? { borderRadius: 8 } : { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }) }}>
        预览：在此展示工作流输出结果
      </div>
    )

    const { workflow, datasets } = output
    const { textCount = 0, imageCount = 0, datasetTabKey, startTime, endTime, hideSummary = false, hideDetailHeader = false, detailPlain = false } = datasetInfo
    
    // 计算时间信息
    const totalElapsed = datasets?.reduce((sum, ds) => {
      const elapsed = parseFloat(ds.elapsed) || 0
      return sum + elapsed
    }, 0) || 0
    
    const datasetCount = datasets?.length || 0
    const meanElapsedNum = datasetCount > 0 ? (totalElapsed / datasetCount) : 0
    const avgElapsed = datasetCount > 0 ? meanElapsedNum.toFixed(3) : 0
    const elapsedNums = (datasets || []).map(ds => parseFloat(ds.elapsed) || 0)
    const variance = datasetCount > 0 ? (elapsedNums.reduce((sum, t) => sum + Math.pow(t - meanElapsedNum, 2), 0) / datasetCount) : 0
    const stdElapsed = Math.sqrt(variance).toFixed(3)
    
    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    const METRIC_THRESHOLD = 0.85
    const summary = (() => {
      let correct = 0, wrong = 0, failed = 0
      
      // 本次选择的数据集汇总数 = textCount + imageCount
      const totalSelectedItems = textCount + imageCount
      
      // 随机生成错误数量（小于5个）
      wrong = Math.floor(Math.random() * 5)
      
      // 统计识别失败的数量（output包含"失败"或"识别失败"等关键词）
      ;(datasets || []).forEach(ds => {
        ;(ds.models || []).forEach(m => {
          if (m.output && (m.output.includes('失败') || m.output.includes('识别失败') || m.output.includes('未识别'))) {
            failed++
          }
        })
      })
      
      // 准确数量 = 本次选择的数据集汇总数 - 错误数量 - 失败数量
      correct = totalSelectedItems - wrong - failed
      
      // 准确率 = 准确数量 / (准确数量 + 失败数量)
      const accuracy = (correct + failed) ? (correct / (correct + failed)) : 0
      
      return { correct, wrong, failed, accuracy }
    })()
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!hideSummary && (
          <div style={{ background: '#f7f9fc', border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>测试结果总览</div>
            <div>工作流队列：{workflow?.name || '-'}</div>
            {textCount > 0 && imageCount > 0 && (
              <div>数据集描述：本次测试选取了{textCount + imageCount}条文本和图片数据集</div>
            )}
            {textCount > 0 && imageCount === 0 && (
              <div>数据集描述：本次测试选取了{textCount}条{({ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey] || '通用批阅')}数据集</div>
            )}
            {textCount === 0 && imageCount > 0 && (
              <div>数据集描述：本次测试选取了{imageCount}条{({ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey] || '图片')}数据集</div>
            )}
            <div>适用科目和题型：{(workflow?.subjects || []).join(', ') || '-'}</div>
            <div>测试开始时间：{formatTime(startTime)}</div>
            <div>测试结束时间：{startTime ? formatTime(new Date(new Date(startTime).getTime() + totalElapsed * 1000).toISOString()) : '-'}</div>
            <div>总耗时：{totalElapsed.toFixed(3)}秒</div>
            <div>平均耗时：{avgElapsed}秒</div>
            <div>失败数量：{summary.failed}</div>
            <div>准确数量：{summary.correct}</div>
            <div>错误数量：{summary.wrong}</div>
            <div>准确率：{(summary.accuracy * 100).toFixed(1)}%</div>
          </div>
          
          
          
        )}
          
        <div style={{ background: detailPlain ? 'transparent' : '#f7f9fc', border: detailPlain ? 'none' : '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
          {!hideDetailHeader && (<div style={{ fontWeight: 'bold' }}>测试明细(按选择的数据集逐条展示)</div>)}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(datasets || []).map((ds, i) => (
            <div key={`${ds.id}-${i}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, position: 'relative', minHeight: 120, paddingBottom: 44 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>测试结果XXXXX</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#999' }}>
                  <div>标准差：XX</div>
                  <div>耗时：{ds.elapsed}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 8 }}>
                {(ds.models || []).filter(m => m.model === '基础检测模型').map((m, idx) => (
                  <div key={idx} style={{ padding: 0 }}>
                    <div style={{ fontWeight: 'bold' }}>
                      测试结果XXXXX
                    </div>
                    {m.score != null && (
                      <div style={{ marginTop: 6, color: '#888' }}>评分：{(m.score*100).toFixed(1)}%</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 20 }}>
                <Tooltip title="放大查看">
                  <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openResultPreview(ds)} />
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
        </div>
        <Modal
          title={null}
          open={resultPreviewVisible}
          onCancel={closeResultPreview}
          footer={null}
          width={800}
        >
          <div style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 12 }}>测试结果XXXXX</div>
        </Modal>

        <Modal
          open={datasetImportPreviewVisible}
          title={datasetImportPreviewTitle || '预览'}
          onCancel={() => setDatasetImportPreviewVisible(false)}
          footer={<Button onClick={() => setDatasetImportPreviewVisible(false)}>关闭</Button>}
          width={720}
        >
          <Input.TextArea value={String(datasetImportPreviewContent || '')} readOnly rows={8} />
        </Modal>

        <Modal
          open={datasetImportImagePreviewVisible}
          title={'图片预览'}
          onCancel={() => setDatasetImportImagePreviewVisible(false)}
          footer={null}
          width={900}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {datasetImportImagePreviewSrc ? (
              <img src={datasetImportImagePreviewSrc} alt="预览图片" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            ) : (
              <div>暂无图片</div>
            )}
          </div>
        </Modal>

      </div>
    )
  }

  // 工作流筛选项状态（Playground页）
  const [wfType, setWfType] = useState(undefined)
  const [wfId, setWfId] = useState('')
  const [wfName, setWfName] = useState('')
  const [wfSubjects, setWfSubjects] = useState([])
  
  // 科目和题型复选框状态
  const [chineseSubjects, setChineseSubjects] = useState([])
  const [mathSubjects, setMathSubjects] = useState([])
  const [englishSubjects, setEnglishSubjects] = useState([])
  
  // 科目折叠/展开状态
  const [chineseExpanded, setChineseExpanded] = useState(false)
  const [mathExpanded, setMathExpanded] = useState(false)
  const [englishExpanded, setEnglishExpanded] = useState(false)

  // 新增工作流配置弹窗可见性
  const [wfCreateModalVisible, setWfCreateModalVisible] = useState(false)

  // 新增工作流配置（新样式）字段状态
  const [wfQueue, setWfQueue] = useState(undefined)
  const [wfPrimarySubject, setWfPrimarySubject] = useState(undefined)
  const [wfPrimaryType, setWfPrimaryType] = useState(undefined)
  const [wfGrade, setWfGrade] = useState('所有年级')
  const [wfOrg, setWfOrg] = useState('所有教育机构')
  const [wfPrompt, setWfPrompt] = useState('')
  const [wfGeneratedName, setWfGeneratedName] = useState('')
  // 运行后启用“添加进到现有工作流队列”按钮的标记
  const [addQueueEnabled, setAddQueueEnabled] = useState(false)

  // 结果预览放大查看弹窗
  const [resultPreviewVisible, setResultPreviewVisible] = useState(false)
  const [resultPreviewTitle, setResultPreviewTitle] = useState('查看测试结果')

  const openResultPreview = (ds) => {
    setResultPreviewTitle(ds?.type === 'image' ? `图片 ${ds?.name}` : ds?.name || '查看测试结果')
    setResultPreviewVisible(true)
  }
  const closeResultPreview = () => setResultPreviewVisible(false)

  // 根据选择生成默认提示词
  const buildDefaultPrompt = (queue, subject, type) => {
    const s = subject || '学科'
    const t = type || '题型'
    const q = queue || '默认队列'
    if ((q || '').includes('评分')) {
      return `你是智能批改助手（队列：${q}）。请对${s}${t}进行评分并给出详细反馈。要求：
1) 严格依据题目答案和评分标准；
2) 指出错误点并提供改进建议；
3) 输出JSON：{"score":0-100,"feedback":"..."}`
    }
    if ((q || '').includes('OCR')) {
      return `你是OCR识别助手（队列：${q}）。请针对${s}${t}进行文本识别并返回结构化结果。输出JSON：{"text":"...","confidence":0-1}`
    }
    return `你是通用处理助手（队列：${q}）。请对${s}${t}进行处理并返回结构化结果，包含步骤说明与最终结论。`
  }

  // 当队列/学科/题型变化时，自动填充提示词
  useEffect(() => {
    const auto = buildDefaultPrompt(wfQueue, wfPrimarySubject, wfPrimaryType)
    setWfPrompt(auto)
  }, [wfQueue, wfPrimarySubject, wfPrimaryType])

  // 将自动生成的提示词同步到三个区域的文本框
  useEffect(() => {
    const text = wfPrompt || ''
    setPromptText(text)
    setPromptTextLeft(text)
    setPromptTextRight(text)
  }, [wfPrompt])

  // 根据选择自动生成工作流名称
  useEffect(() => {
    const subject = wfPrimarySubject || ''
    const type = wfPrimaryType || ''
    const queueText = wfQueue || ''
    const name = (wfPrimarySubject && wfPrimaryType && wfQueue)
      ? `[${subject}-${type}] ${queueText}`
      : queueText
    setWfGeneratedName(name)
    setWfName(name)
  }, [wfPrimarySubject, wfPrimaryType, wfQueue])

  // 编辑工作流配置弹窗状态
  const [wfEditModalVisible, setWfEditModalVisible] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState(null)

  // 工作流列表数据（重置为按弹窗规则重新生成的5条示例）
  const [workflowList, setWorkflowList] = useState([
    {
      key: '1',
      id: 'PGGZL0001',
      name: '[语文-作文题] 评分默认队列 (wf.correction.default)',
      type: '批改工作流',
      modelConfig: ['基础检测模型', '批改模型'],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      subjects: ['语文', '作文题'],
      grade: '所有年级',
      org: '所有教育机构',
      prompt: '你是智能批改助手（队列：评分默认队列 (wf.correction.default)）。请对语文作文题进行评分并给出详细反馈。要求：\n1) 严格依据题目答案和评分标准；\n2) 指出错误点并提供改进建议；\n3) 输出JSON：{"score":0-100,"feedback":"..."}'
    },
    {
      key: '2',
      id: 'OCRGZL0001',
      name: '[数学-填空题] OCR识别默认队列 (wf.ocr.default)',
      type: 'OCR工作流',
      modelConfig: ['基础检测模型', 'OCR模型'],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      subjects: ['数学', '填空题'],
      grade: '所有年级',
      org: '所有教育机构',
      prompt: '你是OCR识别助手（队列：OCR识别默认队列 (wf.ocr.default)）。请针对数学填空题进行文本识别并返回结构化结果。输出JSON：{"text":"...","confidence":0-1}'
    },
    {
      key: '3',
      id: 'PGGZL0002',
      name: '[英语-阅读题] 评分默认队列 (wf.correction.default)',
      type: '批改工作流',
      modelConfig: ['基础检测模型', '批改模型'],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      subjects: ['英语', '阅读题'],
      grade: '所有年级',
      org: '所有教育机构',
      prompt: '你是智能批改助手（队列：评分默认队列 (wf.correction.default)）。请对英语阅读题进行评分并给出详细反馈。要求：\n1) 严格依据题目答案和评分标准；\n2) 指出错误点并提供改进建议；\n3) 输出JSON：{"score":0-100,"feedback":"..."}'
    },
    {
      key: '4',
      id: 'OCRGZL0002',
      name: '[语文-阅读题] OCR手写体队列 (wf.ocr.handwriting)',
      type: 'OCR工作流',
      modelConfig: ['基础检测模型', 'OCR模型'],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      subjects: ['语文', '阅读题'],
      grade: '所有年级',
      org: '所有教育机构',
      prompt: '你是OCR识别助手（队列：OCR手写体队列 (wf.ocr.handwriting)）。请针对语文阅读题进行文本识别并返回结构化结果。输出JSON：{"text":"...","confidence":0-1}'
    },
    {
      key: '5',
      id: 'DMTGZL0001',
      name: '[物理-选择题] 通用处理默认队列 (wf.general.default)',
      type: '多模态工作流',
      modelConfig: ['基础检测模型', '特定检测模型', 'OCR模型'],
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      subjects: ['物理', '选择题'],
      grade: '所有年级',
      org: '所有教育机构',
      prompt: '你是通用处理助手（队列：通用处理默认队列 (wf.general.default)）。请对物理选择题进行处理并返回结构化结果，包含步骤说明与最终结论。'
    }
  ])
  // 通用工作流抽屉列表（可收藏加入），初始为示例工作流
  const [generalWorkflowList, setGeneralWorkflowList] = useState(() => [...workflowList])

  // 工作流筛选状态
  const [workflowSearchText, setWorkflowSearchText] = useState('')
  const [workflowTypeFilter, setWorkflowTypeFilter] = useState(undefined)
  // 新增：按学科与题型筛选（联动抽屉列表）
  const [workflowSubjectFilter, setWorkflowSubjectFilter] = useState(undefined)
  const [workflowQuestionTypeFilter, setWorkflowQuestionTypeFilter] = useState(undefined)
  const [filteredWorkflowList, setFilteredWorkflowList] = useState([])

  // 自由对比模式：左右独立筛选
  const [workflowSearchTextLeft, setWorkflowSearchTextLeft] = useState('')
  const [workflowTypeFilterLeft, setWorkflowTypeFilterLeft] = useState(undefined)
  const [workflowSubjectFilterLeft, setWorkflowSubjectFilterLeft] = useState(undefined)
  const [workflowQuestionTypeFilterLeft, setWorkflowQuestionTypeFilterLeft] = useState(undefined)
  const [filteredWorkflowListLeft, setFilteredWorkflowListLeft] = useState([])
  const [workflowSearchTextRight, setWorkflowSearchTextRight] = useState('')
  const [workflowTypeFilterRight, setWorkflowTypeFilterRight] = useState(undefined)
  const [workflowSubjectFilterRight, setWorkflowSubjectFilterRight] = useState(undefined)
  const [workflowQuestionTypeFilterRight, setWorkflowQuestionTypeFilterRight] = useState(undefined)
  const [filteredWorkflowListRight, setFilteredWorkflowListRight] = useState([])

  // “收藏”按钮显示控制：默认不显示，创建成功后对应侧显示
  const [favoriteBtnVisibleNormal, setFavoriteBtnVisibleNormal] = useState(false)
  const [favoriteBtnVisibleLeft, setFavoriteBtnVisibleLeft] = useState(false)
  const [favoriteBtnVisibleRight, setFavoriteBtnVisibleRight] = useState(false)
  // 右侧测试状态：null | 'pending' | 'running' | 'completed'
  const [testStatusRight, setTestStatusRight] = useState(null)
  // 记录创建弹窗来源侧（normal/left/right）
  const [wfCreateSide, setWfCreateSide] = useState('normal')

  // 工作流列表筛选逻辑
  useEffect(() => {
    let filtered = [...generalWorkflowList]

    // 按搜索文本筛选（仅名称）
    if (workflowSearchText) {
      const searchText = workflowSearchText.trim().toLowerCase()
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchText))
    }

    // 按学科筛选
    if (workflowSubjectFilter) {
      filtered = filtered.filter(item => (item.subjects || []).includes(workflowSubjectFilter))
    }

    // 按题型筛选
    if (workflowQuestionTypeFilter) {
      filtered = filtered.filter(item => (item.subjects || []).includes(workflowQuestionTypeFilter))
    }

    setFilteredWorkflowList(filtered)
  }, [generalWorkflowList, workflowSearchText, workflowSubjectFilter, workflowQuestionTypeFilter])

  // 左右独立筛选逻辑（自由模式）
  useEffect(() => {
    if (!pgCompareMode) return
    const applyFilter = (search, subject, qtype) => {
      let filtered = [...generalWorkflowList]
      if (search) {
        const s = search.trim().toLowerCase()
        filtered = filtered.filter(item => item.name.toLowerCase().includes(s))
      }
      if (subject) filtered = filtered.filter(item => (item.subjects || []).includes(subject))
      if (qtype) filtered = filtered.filter(item => (item.subjects || []).includes(qtype))
      return filtered
    }
    setFilteredWorkflowListLeft(applyFilter(workflowSearchTextLeft, workflowSubjectFilterLeft, workflowQuestionTypeFilterLeft))
    setFilteredWorkflowListRight(applyFilter(workflowSearchTextRight, workflowSubjectFilterRight, workflowQuestionTypeFilterRight))
  }, [pgCompareMode, generalWorkflowList, workflowSearchTextLeft, workflowSubjectFilterLeft, workflowQuestionTypeFilterLeft, workflowSearchTextRight, workflowSubjectFilterRight, workflowQuestionTypeFilterRight])

  // 数据集计数左右独立（自由模式）
  const [selectedDatasetCountLeft, setSelectedDatasetCountLeft] = useState(0)
  const [selectedDatasetCountRight, setSelectedDatasetCountRight] = useState(0)
  const [datasetSelectSide, setDatasetSelectSide] = useState(null)
  const [selectedDatasetModalVisible, setSelectedDatasetModalVisible] = useState(false)

  // 运行预览所用的已确认选择ID（抽屉点击“添加”时固化）
  const [previewDatasetIds, setPreviewDatasetIds] = useState([])
  const [previewDatasetImageIds, setPreviewDatasetImageIds] = useState([])
  const [previewDatasetIdsLeft, setPreviewDatasetIdsLeft] = useState([])
  const [previewDatasetImageIdsLeft, setPreviewDatasetImageIdsLeft] = useState([])
  const [previewDatasetIdsRight, setPreviewDatasetIdsRight] = useState([])
  const [previewDatasetImageIdsRight, setPreviewDatasetImageIdsRight] = useState([])

  // 判断是否满足“td工作流+至少1条数据集”的启用条件
  // 现阶段以“已选择工作流”且“已选择至少1条数据集”为启用条件；若后续引入 td 标识可在此增强判断
  const wfNormal = getWorkflowByKey(selectedWorkflowKey)
  const wfLeft = getWorkflowByKey(selectedWorkflowKeyLeft)
  const wfRight = getWorkflowByKey(selectedWorkflowKeyRight)
  const canRunNormal = Boolean(wfNormal || wfQueue) && ((previewDatasetIds.length + previewDatasetImageIds.length) >= 1)
  const canRunLeft = Boolean(wfLeft || wfQueue) && ((previewDatasetIdsLeft.length + previewDatasetImageIdsLeft.length) >= 1)
  const canRunRight = Boolean(wfRight || wfQueue) && ((previewDatasetIdsRight.length + previewDatasetImageIdsRight.length) >= 1)

  // 计算全选状态
  const allSubjectsSelected = chineseSubjects.length === 5 && 
                            mathSubjects.length === 2 && 
                            englishSubjects.length === 3

  // 收藏当前选中的工作流到通用工作流抽屉列表
  const handleFavoriteWorkflow = (side) => {
    const key = side === 'left' ? selectedWorkflowKeyLeft : (side === 'right' ? selectedWorkflowKeyRight : selectedWorkflowKey)
    const wf = getWorkflowByKey(key)
    if (!wf) { messageApi.error('请先选择工作流'); return }
    const exists = generalWorkflowList.some(item => item.id === wf.id)
    if (exists) { messageApi.info('已在通用工作流中'); return }
    setGeneralWorkflowList(prev => [wf, ...prev])
    messageApi.success('收藏成功，已加入通用工作流')
  }

  // 计算部分选择状态
  const isSomeSubjectsSelected = (chineseSubjects.length > 0 || 
                                mathSubjects.length > 0 || 
                                englishSubjects.length > 0) && 
                               !allSubjectsSelected

  // 工作流类型前缀映射（全称拼音首字母）
  const wfPrefixMap = {
    'OCR工作流': 'OCRGZL',
    '批改工作流': 'PGGZL',
    '多模态工作流': 'DMTGZL'
  }

  // 根据类型生成工作流ID，默认从 0001 开始，可手动编辑
  useEffect(() => {
    if (isPlaygroundPage) {
      if (wfType) {
        const prefix = wfPrefixMap[wfType] || ''
        setWfId(prefix + '0001')
      } else {
        setWfId('')
      }
    }
  }, [wfType, isPlaygroundPage])

  // 批量选择模式切换：关闭时清空选中项
  useEffect(() => {
    if (!datasetBatchSelectMode) {
      setDatasetSelectedIds([])
      setDatasetSelectedImageIds([])
    }
  }, [datasetBatchSelectMode])

  // 切换标签页时清空选中项，避免跨标签误计数
  useEffect(() => {
    setDatasetSelectedIds([])
    setDatasetSelectedImageIds([])
  }, [datasetTabKey])

  // 进入数据集页时，强制恢复卡片为默认状态（关闭批量选择）
  useEffect(() => {
    if (isDatasetPage) {
      setDatasetBatchSelectMode(false)
    }
  }, [isDatasetPage])

  // ===== 批量选择：全选 / 反选 / 全不选（仅作用于当前可见项） =====
  const getCurrentVisibleIds = () => (
    String(datasetTabKey).startsWith('text')
      ? datasetTextFilteredData.map(d => d.id)
      : datasetImageFilteredData.map(d => d.id)
  )

  const handleSelectAllVisible = () => {
    const allVisible = getCurrentVisibleIds()
    if (String(datasetTabKey).startsWith('text')) {
      setDatasetSelectedIds(prev => {
        const nonVisibleSelected = prev.filter(id => !allVisible.includes(id))
        return [...nonVisibleSelected, ...allVisible]
      })
    } else {
      setDatasetSelectedImageIds(prev => {
        const nonVisibleSelected = prev.filter(id => !allVisible.includes(id))
        return [...nonVisibleSelected, ...allVisible]
      })
    }
  }

  // 点击已选数据集计数显示弹窗
  const handleSelectedDatasetClick = () => {
    const count = pgCompareMode ? selectedDatasetCountLeft : selectedDatasetCount
    if (count > 0) {
      setSelectedDatasetModalVisible(true)
    }
  }

  // 编辑工作流
  const handleEditWorkflow = (record) => {
    setEditingWorkflow(record)
    setWfEditModalVisible(true)
  }

  // 删除工作流
  const handleDeleteWorkflow = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除工作流"${record.name}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        setWorkflowList(prev => prev.filter(item => item.key !== record.key))
        message.success('工作流删除成功')
      }
    })
  }

  // 保存编辑的工作流
  const handleWfEditConfirm = () => {
    if (!editingWorkflow?.name?.trim()) {
      message.error('请输入工作流名称')
      return
    }
    if (!editingWorkflow?.type) {
      message.error('请选择工作流类别')
      return
    }

    setWorkflowList(prev => 
      prev.map(item => 
        item.key === editingWorkflow.key 
          ? { ...editingWorkflow, name: editingWorkflow.name.trim() }
          : item
      )
    )
    
    setWfEditModalVisible(false)
    setEditingWorkflow(null)
    message.success('工作流更新成功')
  }

  // 取消编辑
  const handleWfEditCancel = () => {
    setWfEditModalVisible(false)
    setEditingWorkflow(null)
  }


  return (
    <div ref={contentRef} style={{ 
      padding: '24px 24px 0 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 64px)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {messageContextHolder}
      <div ref={topRef}>
        {/* 面包屑导航和导入按钮 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <Breadcrumb 
            items={(Array.isArray(breadcrumbKeys) && breadcrumbKeys.length > 0)
              ? [
                  { title: <span style={{ cursor: 'pointer' }} onClick={() => onBreadcrumbNavigate && onBreadcrumbNavigate('dashboard')}>首页</span> },
                  ...breadcrumbKeys.map(k => ({ 
                    title: <span style={{ cursor: 'pointer' }} onClick={() => onBreadcrumbNavigate && onBreadcrumbNavigate(k)}>{getMenuTitle(k)}</span>
                  }))
                ]
              : [
                  { title: <span style={{ cursor: 'pointer' }} onClick={() => onBreadcrumbNavigate && onBreadcrumbNavigate('dashboard')}>首页</span> },
                  { title: <span style={{ cursor: 'pointer' }} onClick={() => onBreadcrumbNavigate && onBreadcrumbNavigate(selectedMenu)}>{getMenuTitle(selectedMenu)}</span> }
                ]}
          />
          <Space>
            {selectedMenu === 'playground' && (
              <></>
            )}
            {!isDatasetPage && !isShuJiPage && (
              <></>
            )}
          </Space>
        </div>

        {/* 筛选条件区域 */}
        {isDatasetPage ? (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
              <Col flex="auto" />
              <Col>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#666' }}>
                    已选择{String(datasetTabKey).startsWith('text') ? datasetSelectedIds.length : datasetSelectedImageIds.length}条数据
                  </span>
                  <Button onClick={() => { setDatasetSelectedIds([]); setDatasetSelectedImageIds([]); }}>取消选择</Button>
                  <Button onClick={handleSelectAllVisible}>全选</Button>
                  <Button type="primary" danger disabled={(String(datasetTabKey).startsWith('text') ? datasetSelectedIds.length : datasetSelectedImageIds.length) === 0} onClick={handleDatasetBatchDelete}>删除</Button>
                  <Select
                    mode="multiple"
                  placeholder="批量打标签"
                    style={{ width: 240 }}
                    allowClear
                    value={datasetBatchSelectedTags}
                    onChange={(v) => { setDatasetBatchSelectedTags(v); setDatasetBatchTagsTouched(true) }}
                    dropdownRender={(menu) => (
                      <div>
                        {menu}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                          <Input
                            placeholder="输入新标签并回车"
                            value={datasetBatchTagInput}
                            onChange={(e) => setDatasetBatchTagInput(e.target.value)}
                            onPressEnter={addDatasetBatchTagOption}
                          />
                          <Button type="link" onClick={addDatasetBatchTagOption}>添加标签</Button>
                        </div>
                      </div>
                    )}
                  >
                    {(datasetTagOptions || []).filter(isTagAllowed).map(t => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<TagOutlined />}
                    onClick={() => {
                      const idsToUpdate = String(datasetTabKey).startsWith('text') ? datasetSelectedIds : datasetSelectedImageIds
                      if (!idsToUpdate || idsToUpdate.length === 0) {
                        messageApi.warning('请先选择要更新的数据项')
                        return
                      }
                      const now = new Date().toLocaleString()
                      setDatasetData(prev => {
                        const next = prev.map(item => {
                          const shouldUpdate = idsToUpdate.includes(item.id)
                          if (!shouldUpdate) return item
                          const updated = { ...item, updateTime: now }
                          if (datasetBatchCheckStatus !== undefined) {
                            updated.checkStatus = datasetBatchCheckStatus
                          }
                          if (datasetBatchTagsTouched && datasetBatchSelectedTags !== undefined) {
                            updated.tags = datasetBatchSelectedTags || []
                            updated.tag = (datasetBatchSelectedTags || []).join('、')
                          }
                          return updated
                        })
                        const nextText = next.filter(d => !/^图片：/.test(String(d.input)))
                        const nextImage = next.filter(d => /^图片：/.test(String(d.input)))
                        setDatasetTextFilteredData(nextText)
                        setDatasetImageFilteredData(nextImage)
                        return next
                      })
                      setDatasetBatchTagsTouched(false)
                      messageApi.success(`已批量更新 ${idsToUpdate.length} 条数据`)
                    }}
                  >
                    打标签
                  </Button>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleDatasetAdd}
                  >
                    新增
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        ) : isShuJiPage ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Input
                placeholder="输入ID或名称搜索"
                value={shuJiSearchText}
                onChange={(e) => setShuJiSearchText(e.target.value)}
                allowClear
                style={{ width: 240 }}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShuJiAddTrigger(t => t + 1)}>
                新增
              </Button>
            </div>
          </div>
        ) : isLogsPage ? (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              {/* 已移除：搜索执行名称、搜索执行对象 */}
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索消息队列"
                  value={logsWorkflowQueueFilter}
                  onChange={(e) => setLogsWorkflowQueueFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索执行端ID"
                  value={logsAgentIdFilter}
                  onChange={(e) => setLogsAgentIdFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索执行端名称"
                  value={logsAgentNameFilter}
                  onChange={(e) => setLogsAgentNameFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索教育机构名称"
                  value={logsTenantNameFilter}
                  onChange={(e) => setLogsTenantNameFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              {/* 将“搜索消息队列”置于此位置 */}
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索工作流队列"
                  value={logsQueueFilter}
                  onChange={(e) => setLogsQueueFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              {/* 将“搜索适用科目和题型”移动到“搜索教育机构名称”后面 */}
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Input
                  placeholder="搜索适用科目和题型"
                  value={logsSubjectTypeFilter}
                  onChange={(e) => setLogsSubjectTypeFilter(e.target.value)}
                  allowClear
                  size="middle"
                  style={{ width: '100%' }}
                />
              </Col>
              {/* 综合搜索输入已移除，改为上方六个独立筛选 */}
              <Col xs={24} sm={24} md={8} lg={8} xl={4}>
                <Select
                  placeholder="执行状态"
                  value={logsStatusFilter}
                  onChange={setLogsStatusFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="完成">完成</Option>
                  <Option value="失败">失败</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8} lg={8} xl={4}>
                <Select
                  placeholder="搜索核查状态"
                  value={logsCheckStatusFilter}
                  onChange={setLogsCheckStatusFilter}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="已核查">已核查</Option>
                  <Option value="未核查">未核查</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={8} lg={8} xl={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <RangePicker
                    value={logsDateRange}
                    onChange={setLogsDateRange}
                    allowClear
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
              <Col flex="auto" />
              {/* 对比按钮已移除 */}
            </Row>
          </div>
        ) : isPlaygroundPage ? null : (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={12} md={6} lg={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, minWidth: '50px', textAlign: 'right' }}>名称</span>
                  <Input
                    placeholder="请输入名称搜索"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                    allowClear
                    style={{ flex: 1 }}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, minWidth: '50px', textAlign: 'right' }}>学科</span>
                  <Select placeholder="请选择学科" value={selectedSubject} onChange={setSelectedSubject} style={{ flex: 1 }} allowClear>
                    <Option value="数学">数学</Option>
                    <Option value="语文">语文</Option>
                    <Option value="英语">英语</Option>
                    <Option value="物理">物理</Option>
                    <Option value="化学">化学</Option>
                    <Option value="生物">生物</Option>
                    <Option value="历史">历史</Option>
                    <Option value="地理">地理</Option>
                    <Option value="政治">政治</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, minWidth: '50px', textAlign: 'right' }}>年级</span>
                  <Select placeholder="请选择年级" value={selectedGrade} onChange={setSelectedGrade} style={{ flex: 1 }} allowClear>
                    <Option value="高一">高一</Option>
                    <Option value="高二">高二</Option>
                    <Option value="高三">高三</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6} lg={4}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, minWidth: '50px', textAlign: 'right' }}>版本</span>
                  <Select placeholder="请选择版本" value={selectedVersion} onChange={setSelectedVersion} style={{ flex: 1 }} allowClear>
                    <Option value="人教版">人教版</Option>
                    <Option value="人教版A">人教版A</Option>
                    <Option value="人教版B">人教版B</Option>
                    <Option value="统编版">统编版</Option>
                    <Option value="统编版B">统编版B</Option>
                    <Option value="外研版C">外研版C</Option>
                    <Option value="苏教版">苏教版</Option>
                    <Option value="粤教版">粤教版</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6} lg={8}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#333', fontWeight: 500, minWidth: '70px', textAlign: 'right' }}>更新时间</span>
                  <RangePicker value={updateTimeRange} onChange={setUpdateTimeRange} style={{ width: 320 }} />
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>

      {/* 列表区域 */}
      <Card ref={listCardRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, marginBottom: 0 }}>
        {isDatasetPage ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, justifyContent: 'flex-end', width: '100%' }}>
              <Input
                value={datasetIdFilter}
                onChange={(e) => setDatasetIdFilter(e.target.value)}
                allowClear
                placeholder="搜索ID"
                size="middle"
                style={{ width: 120 }}
              />
              <Input
                value={datasetCreatorFilter}
                onChange={(e) => setDatasetCreatorFilter(e.target.value)}
                allowClear
                placeholder="搜索创建人"
                size="middle"
                style={{ width: 140 }}
              />
              <Select
                mode="multiple"
                showSearch
                value={datasetTagsFilter}
                onChange={setDatasetTagsFilter}
                onSearch={(v) => setDatasetTagKeyword(v)}
                allowClear
                placeholder="筛选标签"
                style={{ width: 220 }}
                options={datasetFilterTagOptions}
              />
              <Select
                value={datasetFilterStatus}
                placeholder="搜索核查状态"
                size="middle"
                style={{ width: 120 }}
                allowClear
                onChange={setDatasetFilterStatus}
                options={[
                  { value: '已核查', label: '已核查' },
                  { value: '未核查', label: '未核查' }
                ]}
              />
              <RangePicker
                value={datasetTimeRange}
                onChange={setDatasetTimeRange}
                allowClear
                style={{ width: 280 }}
              />
            </div>
          <Tabs
            activeKey={datasetTabKey}
            onChange={setDatasetTabKey}
            tabBarExtraContent={null}
            items={[
              {
                key: 'text',
                label: '通用批阅',
                children: (
                  <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <List
                      grid={{ gutter: 12, column: 4 }}
                      loading={datasetLoading}
                      dataSource={datasetTextFilteredData}
                      pagination={{
                        total: datasetTextFilteredData.length,
                        pageSize: 9,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                      }}
                      renderItem={(item) => {
                      const isSelected = datasetSelectedIds.includes(item.id)
                      const tagsArray = normalizeTagList(item.tags)
                        const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                        return (
                          <List.Item key={item.id}>
                            <Card
                              hoverable
                              size="small"
                              style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                              bodyStyle={{ padding: '28px 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                              {/* 右上角斜角核查状态标 */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 5,
                                  right: -28,
                                  width: 90,
                                  background: statusColor,
                                  color: '#fff',
                                  textAlign: 'center',
                                  padding: '1px 0',
                                  fontSize: 10,
                                  transform: 'rotate(45deg)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                  pointerEvents: 'none',
                                  zIndex: 3
                                }}
                              >
                                {item.checkStatus || '-'}
                              </div>

                              {/* 选择复选框（始终显示） */}
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setDatasetSelectedIds((prev) => {
                                      const set = new Set(prev)
                                      if (checked) set.add(item.id); else set.delete(item.id)
                                      return Array.from(set)
                                    })
                                  }}
                                />
                              </div>

                              {/* 学生作答 */}
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                <Input
                                  value={String(item.input || '-')}
                                  readOnly
                                  placeholder="学生作答"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', item.input || '-')} />}
                                />
                              </div>

                              {/* 原题与正确答案 */}
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                                <Input
                                  value={String(item.question || '-')}
                                  readOnly
                                  placeholder="原题"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', item.question || '-')} />}
                                />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                                <Input
                                  value={String(item.correctAnswer || '-')}
                                  readOnly
                                  placeholder="正确答案"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', item.correctAnswer || '-')} />}
                                />
                              </div>

                              {/* 满分分数 */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                                <Input
                                  value={String(item.fullScore ?? '-')}
                                  readOnly
                                  placeholder="满分分数"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', item.fullScore ?? '-')} />}
                                />
                              </div>

                              {/* 标签与 Ground Truth */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                                <Input
                                  value={String(item.groundTruth || '')}
                                  readOnly
                                  placeholder="Ground Truth"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', item.groundTruth || '')} />}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                  {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                    <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                  ))}
                                </div>
                              </div>

                              {/* 底部辅助信息 */}
                              <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>创建人：{item.creator || '-'}</div>
                                <div>ID：{item.displayId || item.id || '-'}</div>
                                <div>更新时间：{item.updateTime || '-'}</div>
                                <div>创建时间：{item.createTime || '-'}</div>
                              </div>

                              {/* 操作区 - 三个垂直点菜单 */}
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看',
                                        onClick: () => handleDatasetView(item)
                                      },
                                      {
                                        key: 'edit',
                                        label: '编辑',
                                        onClick: () => handleDatasetEdit(item)
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        danger: true,
                                        onClick: () => handleDatasetDelete(item)
                                      }
                                    ]
                                  }}
                                  placement="bottomRight"
                                  trigger={['click']}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: '#6b7280' }} />
                                </Dropdown>
                              </div>
                            </Card>
                          </List.Item>
                        )
                      }}
                    />
                  </div>
                )
              },
              {
                key: 'text2',
                label: '作文评分',
                children: (
                  <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <List
                      grid={{ gutter: 12, column: 4 }}
                      loading={datasetLoading}
                      dataSource={datasetTextFilteredData}
                      pagination={{
                        total: datasetTextFilteredData.length,
                        pageSize: 9,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                      }}
                      renderItem={(item) => {
                      const isSelected = datasetSelectedIds.includes(item.id)
                      const tagsArray = normalizeTagList(item.tags)
                        const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                        const displayTags = ['语文作文']
                        return (
                          <List.Item key={item.id}>
                            <Card
                              hoverable
                              size="small"
                              style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                              bodyStyle={{ padding: '28px 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: 8 }}
                            >
                              {/* 右上角斜角核查状态标 */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: 5,
                                  right: -28,
                                  width: 90,
                                  background: statusColor,
                                  color: '#fff',
                                  textAlign: 'center',
                                  padding: '1px 0',
                                  fontSize: 10,
                                  transform: 'rotate(45deg)',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                  pointerEvents: 'none',
                                  zIndex: 3
                                }}
                              >
                                {item.checkStatus || '-'}
                              </div>

                              {/* 选择复选框（始终显示） */}
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setDatasetSelectedIds((prev) => {
                                      const set = new Set(prev)
                                      if (checked) set.add(item.id); else set.delete(item.id)
                                      return Array.from(set)
                                    })
                                  }}
                                />
                              </div>

                              {/* 学生作答 */}
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                <Input
                                  value={String(item.input || '-')}
                                  readOnly
                                  placeholder="学生作答"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', item.input || '-')} />}
                                />
                              </div>

                              {/* 原题与正确答案 */}
                              {/* 评分标准与评分 */}
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>评分标准</div>
                                <Input
                                  value={String(item.gradingStandard || '评分标准XXXXXXXXX.')}
                                  readOnly
                                  placeholder="评分标准"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('评分标准', item.gradingStandard || '评分标准XXXXXXXXX.')} />}
                                />
                              </div>
                              {/* 原题 */}
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                                <Input
                                  value={String(item.question || '-')}
                                  readOnly
                                  placeholder="原题"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', item.question || '-')} />}
                                />
                              </div>

                              {/* 满分分数 */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                                <Input
                                  value={String(item.fullScore ?? '20分')}
                                  readOnly
                                  placeholder="满分分数"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', item.fullScore ?? '20分')} />}
                                />
                              </div>

                              {/* Ground Truth 与标签 */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                                <Input
                                  value={String(item.groundTruth || '')}
                                  readOnly
                                  placeholder="Ground Truth"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', item.groundTruth || '')} />}
                                />
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                {displayTags.map((t, idx) => (
                                  <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                ))}
                              </div>

                              {/* 底部辅助信息 */}
                              <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>创建人：{item.creator || '-'}</div>
                                <div>ID：{item.displayId || item.id || '-'}</div>
                                <div>更新时间：{item.updateTime || '-'}</div>
                                <div>创建时间：{item.createTime || '-'}</div>
                              </div>

                              {/* 操作区 - 三个垂直点菜单 */}
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看',
                                        onClick: () => handleDatasetView(item)
                                      },
                                      {
                                        key: 'edit',
                                        label: '编辑',
                                        onClick: () => handleDatasetEdit(item)
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        danger: true,
                                        onClick: () => handleDatasetDelete(item)
                                      }
                                    ]
                                  }}
                                  placement="bottomRight"
                                  trigger={['click']}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: '#6b7280' }} />
                                </Dropdown>
                              </div>
                            </Card>
                          </List.Item>
                        )
                      }}
                    />
                  </div>
                )
              },
              {
                key: 'image',
                label: '手阅登分',
                children: (
                  <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <List
                    grid={{ gutter: 12, column: 4 }}
                    loading={datasetLoading}
                    dataSource={datasetImageFilteredData}
                    pagination={{
                      total: datasetImageFilteredData.length,
                      pageSize: 9,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                    }}
                    renderItem={(item) => {
                      const isSelected = datasetSelectedImageIds.includes(item.id)
                      const tagsArray = normalizeTagList(item.tags)
                      const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                      return (
                        <List.Item key={item.id}>
                          <Card
                            hoverable
                            size="small"
                            style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                            bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                          >
                            {/* 右上角斜角核查状态标 */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 5,
                                right: -28,
                                width: 90,
                                background: statusColor,
                                color: '#fff',
                                textAlign: 'center',
                                padding: '1px 0',
                                fontSize: 10,
                                transform: 'rotate(45deg)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                                zIndex: 3
                              }}
                            >
                              {item.checkStatus || '-'}
                            </div>
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setDatasetSelectedImageIds((prev) => {
                                      const set = new Set(prev)
                                      if (checked) set.add(item.id); else set.delete(item.id)
                                      return Array.from(set)
                                    })
                                  }}
                                />
                              </div>
                                <img
                                  src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                  alt={getImageNameFromInput(item.input)}
                                  style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                  onClick={() => openImageViewer(item)}
                                />
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openImageViewer(item)} />
                              </div>
                              </div>
                              <div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                                  <Input
                                    value={String(item.fullScore || '-')}
                                    readOnly
                                    placeholder="满分分数"
                                    suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', item.fullScore || '-')} />}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                                <Input
                                  value={String(item.groundTruth || '')}
                                  readOnly
                                  placeholder="Ground Truth"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', item.groundTruth || '')} />}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                  {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                    <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                  ))}
                                </div>
                              </div>
                              <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                <div>创建人：{item.creator || '-'}</div>
                                <div>ID：{item.displayId || item.id || '-'}</div>
                                <div>更新时间：{item.updateTime || '-'}</div>
                                <div>创建时间：{item.createTime || '-'}</div>
                              </div>
                              {/* 操作区 - 三个垂直点菜单 */}
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看',
                                        onClick: () => handleDatasetView(item)
                                      },
                                      {
                                        key: 'edit',
                                        label: '编辑',
                                        onClick: () => handleDatasetEdit(item)
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        danger: true,
                                        onClick: () => handleDatasetDelete(item)
                                      }
                                    ]
                                  }}
                                  placement="bottomRight"
                                  trigger={['click']}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: '#6b7280' }} />
                                </Dropdown>
                              </div>
                          </Card>
                        </List.Item>
                      )
                    }}
                    />
                  </div>
                )
              },
              {
                key: 'image2',
                label: 'OCR识别',
                children: (
                  <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <List
                    grid={{ gutter: 12, column: 4 }}
                    loading={datasetLoading}
                    dataSource={datasetImageFilteredData}
                    pagination={{
                      total: datasetImageFilteredData.length,
                      pageSize: 9,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                    }}
                    renderItem={(item) => {
                      const isSelected = datasetSelectedImageIds.includes(item.id)
                      const tagsArray = normalizeTagList(item.tags)
                      const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                      return (
                        <List.Item key={item.id}>
                          <Card
                            hoverable
                            size="small"
                            style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                            bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                          >
                            {/* 右上角斜角核查状态标 */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 5,
                                right: -28,
                                width: 90,
                                background: statusColor,
                                color: '#fff',
                                textAlign: 'center',
                                padding: '1px 0',
                                fontSize: 10,
                                transform: 'rotate(45deg)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                                zIndex: 3
                              }}
                            >
                              {item.checkStatus || '-'}
                            </div>
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setDatasetSelectedImageIds((prev) => {
                                      const set = new Set(prev)
                                      if (checked) set.add(item.id); else set.delete(item.id)
                                      return Array.from(set)
                                    })
                                  }}
                                />
                              </div>
                                <img
                                  src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                  alt={getImageNameFromInput(item.input)}
                                  style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                  onClick={() => openImageViewer(item)}
                                />
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openImageViewer(item)} />
                              </div>
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                <Input
                                  value={String(item.recognition || getImageNameFromInput(item.input) || '-')}
                                  readOnly
                                  placeholder="识别结果"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('识别结果', item.recognition || getImageNameFromInput(item.input) || '-')} />}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                                <Input
                                  value={String(item.groundTruth || '')}
                                  readOnly
                                  placeholder="Ground Truth"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', item.groundTruth || '')} />}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                  {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                    <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                  ))}
                                </div>
                              </div>
                              <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                <div>创建人：{item.creator || '-'}</div>
                                <div>ID：{item.displayId || item.id || '-'}</div>
                                <div>更新时间：{item.updateTime || '-'}</div>
                                <div>创建时间：{item.createTime || '-'}</div>
                              </div>
                              {/* 操作区 - 三个垂直点菜单 */}
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看',
                                        onClick: () => handleDatasetView(item)
                                      },
                                      {
                                        key: 'edit',
                                        label: '编辑',
                                        onClick: () => handleDatasetEdit(item)
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        danger: true,
                                        onClick: () => handleDatasetDelete(item)
                                      }
                                    ]
                                  }}
                                  placement="bottomRight"
                                  trigger={['click']}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: '#6b7280' }} />
                                </Dropdown>
                              </div>
                          </Card>
                        </List.Item>
                      )
                    }}
                    />
                  </div>
                )
              },
              {
                key: 'image1',
                label: '图片打分',
                children: (
                  <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                    <List
                    grid={{ gutter: 12, column: 4 }}
                    loading={datasetLoading}
                    dataSource={datasetImageFilteredData}
                    pagination={{
                      total: datasetImageFilteredData.length,
                      pageSize: 9,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                    }}
                    renderItem={(item) => {
                      const isSelected = datasetSelectedImageIds.includes(item.id)
                      const tagsArray = normalizeTagList(item.tags)
                      const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                      return (
                        <List.Item key={item.id}>
                          <Card
                            hoverable
                            size="small"
                            style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                            bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                          >
                            {/* 右上角斜角核查状态标 */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 5,
                                right: -28,
                                width: 90,
                                background: statusColor,
                                color: '#fff',
                                textAlign: 'center',
                                padding: '1px 0',
                                fontSize: 10,
                                transform: 'rotate(45deg)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                                zIndex: 3
                              }}
                            >
                              {item.checkStatus || '-'}
                            </div>
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setDatasetSelectedImageIds((prev) => {
                                      const set = new Set(prev)
                                      if (checked) set.add(item.id); else set.delete(item.id)
                                      return Array.from(set)
                                    })
                                  }}
                                />
                              </div>
                                <img
                                  src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                  alt={getImageNameFromInput(item.input)}
                                  style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                  onClick={() => openImageViewer(item)}
                                />
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openImageViewer(item)} />
                              </div>
                              </div>
                              {/* 重要字段（仅图片打分Tab生效） */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>原题</span>
                                <Input
                                  value={String(item.question || '-')}
                                  readOnly
                                  placeholder="原题"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', item.question || '-')} />}
                                />
                                <span style={{ fontWeight: 600, color: '#111827' }}>正确答案</span>
                                <Input
                                  value={String(item.correctAnswer || '-')}
                                  readOnly
                                  placeholder="正确答案"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', item.correctAnswer || '-')} />}
                                />
                                <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                                <Input
                                  value={String(item.fullScore || '-')}
                                  readOnly
                                  placeholder="满分分数"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', item.fullScore || '-')} />}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                                <Input
                                  value={String(item.groundTruth || '')}
                                  readOnly
                                  placeholder="Ground Truth"
                                  suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', item.groundTruth || '')} />}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                  {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                    <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                  ))}
                                </div>
                              </div>
                              <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                <div>创建人：{item.creator || '-'}</div>
                                <div>ID：{item.displayId || item.id || '-'}</div>
                                <div>更新时间：{item.updateTime || '-'}</div>
                                <div>创建时间：{item.createTime || '-'}</div>
                              </div>
                              {/* 操作区 - 三个垂直点菜单 */}
                              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2 }}>
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'view',
                                        label: '查看',
                                        onClick: () => handleDatasetView(item)
                                      },
                                      {
                                        key: 'edit',
                                        label: '编辑',
                                        onClick: () => handleDatasetEdit(item)
                                      },
                                      {
                                        key: 'delete',
                                        label: '删除',
                                        danger: true,
                                        onClick: () => handleDatasetDelete(item)
                                      }
                                    ]
                                  }}
                                  placement="bottomRight"
                                  trigger={['click']}
                                >
                                  <Button type="text" size="small" icon={<MoreOutlined />} style={{ color: '#6b7280' }} />
                                </Dropdown>
                              </div>
                          </Card>
                        </List.Item>
                      )
                    }}
                    />
                  </div>
                )
              },
            ]}
          />
          </div>
        ) : isShuJiPage ? (
          <ShuJiList searchText={shuJiSearchText} addTrigger={shuJiAddTrigger} />
        ) : isLogsPage ? (
          <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflow: 'hidden' }}>
            <Table
              rowSelection={{
                type: 'checkbox',
                selectedRowKeys: logsSelectedRowKeys,
                onChange: (selectedRowKeys, selectedRows) => {
                  setLogsSelectedRowKeys(selectedRowKeys)
                  setLogsSelectedRows(selectedRows)
                }
              }}
              size="small"
              sticky
              loading={logsLoading}
              dataSource={logsFilteredData || []}
              rowKey="key"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
              }}
              components={logHeaderComponents}
              columns={computedLogColumns}
              scroll={{ x: logsScrollX }}
            />
            <Modal
              title="查看日志"
              open={logsViewModalOpen}
              onCancel={() => setLogsViewModalOpen(false)}
              footer={<Button type="primary" onClick={() => setLogsViewModalOpen(false)}>关闭</Button>}
              width={720}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 8, columnGap: 12 }}>
                {(logColumns || [])
                  .filter((col) => String(col.key || col.dataIndex) !== 'actions')
                  .map((col) => (
                    <React.Fragment key={String(col.key || col.dataIndex)}>
                      <span style={{ color: '#666' }}>{col.title}</span>
                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {(() => {
                          const raw = logsViewRecord?.[col.dataIndex]
                          if (typeof col.render === 'function') {
                            try {
                              return col.render(raw, logsViewRecord || {})
                            } catch (e) {
                              return (raw ?? '-')
                            }
                          }
                          return (raw ?? '-')
                        })()}
                      </span>
                    </React.Fragment>
                ))}
              </div>
            </Modal>
            <Modal
              title="日志对比"
              open={compareDrawerOpen}
              onCancel={() => setCompareDrawerOpen(false)}
              footer={null}
              width={1200}
              bodyStyle={{ padding: 0 }}
            >
              <div ref={compareGridRef} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                <div style={{ padding: 16 }}>
                  {(() => {
                    const getErrorRate = (r) => {
                      const s = Number(r?.successCount) || 0
                      const e = Number(r?.errorCount) || 0
                      const t = s + e
                      return t ? (e / t) : 0
                    }
                    // 仍按误差率降序，左→右为从高到低
                    const items = [...(logsSelectedRows || [])].sort((a, b) => getErrorRate(b) - getErrorRate(a))
                    const compareCols = (logColumns || []).filter((col) => String(col.key || col.dataIndex) !== 'actions')

                    const columns = [
                      {
                        title: '字段',
                        dataIndex: 'label',
                        key: 'label',
                        fixed: 'left',
                        width: 160,
                        render: (text) => {
                          const nonBold = [
                            '工作流队列',
                            '模型描述',
                            '适用科目和题型',
                            '使用科目和题型',
                            '提示词',
                            '核查状态',
                            '教育机构名称'
                          ]
                          const isNonBold = nonBold.includes(String(text))
                          return (
                            <span style={{ fontWeight: isNonBold ? 'normal' : 600 }}>{text}</span>
                          )
                        }
                      },
                      ...items.map((_, idx) => ({
                        title: `记录${idx + 1}`,
                        dataIndex: `col_${idx}`,
                        key: `col_${idx}`,
                        width: 280,
                        ellipsis: true
                      }))
                    ]

                    const dataRows = compareCols.map((col) => {
                      const row = { key: String(col.key || col.dataIndex), label: String(col.title || '-') }
                      items.forEach((item, idx) => {
                        const raw = item?.[col.dataIndex]
                        let cell = (raw === null || raw === undefined || raw === '') ? '-' : raw
                        if (typeof col.render === 'function') {
                          try {
                            cell = col.render(raw, item)
                          } catch (e) {
                            cell = (raw ?? '-')
                          }
                        }
                        row[`col_${idx}`] = cell
                      })
                      return row
                    })

                    return (
                      <Table
                        size="small"
                        tableLayout="fixed"
                        columns={columns}
                        dataSource={dataRows}
                        pagination={false}
                        scroll={{ x: 220 + items.length * 280 }}
                      />
                    )
                  })()}
                </div>
              </div>
            </Modal>
            
          </div>
        ) : isPlaygroundPage ? (
          <div ref={pgContainerRef} className="playground-container" style={{
            display: pgCompareMode ? 'grid' : 'flex',
            height: '100vh',
            margin: 0,
            padding: 0,
            marginLeft: 0,
            marginTop: 0,
            minWidth: 0, // 允许容器收缩
            position: 'relative',
            ...(pgCompareMode ? { 
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr'
            } : {})
          }}>

            {/* 左列容器：比较模式下启用列内flex，非比较模式不改变布局 */}
            <div
              ref={pgLeftColRef}
              style={{
                display: pgCompareMode ? 'flex' : 'contents',
                flexDirection: 'column',
                height: pgCompareMode ? '100vh' : undefined,
                position: pgCompareMode ? 'relative' : undefined,
                minWidth: 0,
                ...(pgCompareMode ? { gridColumn: '1 / 2', gridRow: '1 / 3' } : {})
              }}
            >
            {/* 工作流配置区 */}
            <Card
              ref={configCardLeftRef}
              size="small"
              title={pgConfigCollapsed ? null : <span>{pgCompareMode ? '配置区(基准组)' : '配置区'}</span>}
              className={pgCompareMode ? 'pg-config-no-scrollbar' : undefined}
              extra={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>


                  {!pgCompareMode && (
                    <Tooltip 
                      title={pgConfigCollapsed ? '展开工作流配置区' : '收起工作流配置区'} 
                      trigger="hover"
                      open={tipConfigToggleOpen}
                      onOpenChange={setTipConfigToggleOpen}
                      mouseEnterDelay={0}
                      mouseLeaveDelay={0}
                      destroyTooltipOnHide
                    >
                      <Button
                        type="default"
                        icon={pgConfigCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => { setPgConfigCollapsed(v => !v); setTipConfigToggleOpen(false) }}
                        style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                      />
                    </Tooltip>
                  )}
                </div>
              }
              styles={{
                body: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'auto', padding: 0, position: 'relative', paddingBottom: pgCompareMode ? '226px' : undefined }
              }}
              style={{ 
                // 同时展开时与预览区各占一半；比较模式改为列内flex并使用明确高度
                flex: pgCompareMode ? '0 0 auto' : (pgConfigCollapsed ? '0 0 60px' : (!pgConfigCollapsed && !pgPreviewCollapsed ? '1 1 50%' : '2 1 auto')),
                display: 'flex', 
                flexDirection: 'column', 
                transition: 'flex 0.3s ease', 
                // 分屏时允许更小的最小宽度以适配 50%
                minWidth: pgCompareMode ? 0 : (pgConfigCollapsed ? 60 : (!pgConfigCollapsed && !pgPreviewCollapsed ? 0 : 700)),
                borderTopRightRadius: 0,
                ...(pgCompareMode ? { borderTopLeftRadius: 8, borderRadius: 0 } : { borderRadius: undefined }),
                minHeight: 0,
              height: pgCompareMode ? pgTopLeftHeightPx || undefined : undefined
              }}
            >
              {!pgConfigCollapsed && (
                <div ref={innerSplitContainerLeftRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, position: 'relative' }}>
                  <div style={{ height: innerTopHeightLeft, minHeight: innerTopHeightLeft, overflow: 'hidden', padding: '8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
                        <span 
                          style={{ cursor: (pgCompareMode ? selectedDatasetCountLeft : selectedDatasetCount) > 0 ? 'pointer' : 'default' }}
                          onClick={() => handleSelectedDatasetClick()}
                        >
                          已选<span style={{ color: '#ff4d4f' }}>{(pgCompareMode ? selectedDatasetCountLeft : selectedDatasetCount) || 0}</span>条
                        </span>
                        <div>{({ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey]) || '通用批阅'}</div>
                        <div>数据集</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Tooltip title="选择数据集">
                          <Button icon={<FolderOpenOutlined />} onClick={() => { if (pgCompareMode) setDatasetSelectSide('left'); setDatasetBatchSelectMode(true); setDatasetDrawerOpen(true) }} />
                        </Tooltip>
                      </div>
                    </div>
                    {/* 已选数据集卡片展示（按需水平/垂直滚动） */}
                    {false && <div style={{ width: '100%', minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}>
                      {/* 通用批阅（文本）已选 */}
                      {(() => {
                        const ids = pgCompareMode ? previewDatasetIdsLeft : previewDatasetIds
                        const items = (datasetTextFilteredData || []).filter(d => (ids || []).includes(d.id))
                        if (!items.length) return null
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 320px)', gap: 12, width: 'max-content' }}>
                            {items.map((item) => {
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <Card
                                  key={item.id}
                                  hoverable
                                  size="small"
                                  style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                  bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                >
                                  {/* 右上角斜角核查状态标 */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      right: -28,
                                      width: 90,
                                      background: statusColor,
                                      color: '#fff',
                                      textAlign: 'center',
                                      padding: '1px 0',
                                      fontSize: 10,
                                      transform: 'rotate(45deg)',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                      pointerEvents: 'none',
                                      zIndex: 3
                                    }}
                                  >
                                    {item.checkStatus || '-'}
                                  </div>

                                  {/* 学生作答 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                                  </div>

                                  {/* 原题与正确答案 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.question || '-'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.correctAnswer || '-'}</div>
                                  </div>

                                  {/* 满分分数 */}
                                  <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>

                                  {/* 标签 */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                    {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                      <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                    ))}
                                  </div>

                                  {/* 底部辅助信息 */}
                                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div>创建人：{item.creator || '-'}</div>
                                    <div>ID：{item.displayId || item.id || '-'}</div>
                                    <div>更新时间：{item.updateTime || '-'}</div>
                                    <div>创建时间：{item.createTime || '-'}</div>
                                  </div>

                                  {/* 操作区 */}
                                  <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                                    <Button type="link" size="small" onClick={() => handleDatasetView(item)}>查看</Button>
                                    <Button type="link" size="small" onClick={() => handleDatasetEdit(item)}>编辑</Button>
                                    <Button type="link" size="small" danger onClick={() => handleDatasetDelete(item)}>删除</Button>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* OCR识别（图片）已选 */}
                      {(() => {
                        const ids = pgCompareMode ? previewDatasetImageIdsLeft : previewDatasetImageIds
                        const items = (datasetImageFilteredData || []).filter(d => (ids || []).includes(d.id))
                        if (!items.length) return null
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 320px)', gap: 12, width: 'max-content', marginTop: 8 }}>
                            {items.map((item) => {
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <Card
                                  key={item.id}
                                  hoverable
                                  size="small"
                                  style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                  bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                >
                                  {/* 右上角斜角核查状态标 */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      right: -28,
                                      width: 90,
                                      background: statusColor,
                                      color: '#fff',
                                      textAlign: 'center',
                                      padding: '1px 0',
                                      fontSize: 10,
                                      transform: 'rotate(45deg)',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                      pointerEvents: 'none',
                                      zIndex: 3
                                    }}
                                  >
                                    {item.checkStatus || '-'}
                                  </div>

                                  <div style={{ position: 'relative' }}>
                                    <img
                                      src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                      alt={getImageNameFromInput(item.input)}
                                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }}
                                    />
                                  </div>

                                  {/* 识别结果 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                    <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                                  </div>

                                  {/* 标签 */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                    {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                      <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                    ))}
                                  </div>

                                  {/* 底部辅助信息 */}
                                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                    <div>创建人：{item.creator || '-'}</div>
                                    <div>ID：{item.displayId || item.id || '-'}</div>
                                    <div>更新时间：{item.updateTime || '-'}</div>
                                    <div>创建时间：{item.createTime || '-'}</div>
                                  </div>

                                  {/* 操作区 */}
                                  <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                                    <Button type="link" size="small" onClick={() => handleDatasetView(item)}>查看</Button>
                                    <Button type="link" size="small" onClick={() => handleDatasetEdit(item)}>编辑</Button>
                                    <Button type="link" size="small" danger onClick={() => handleDatasetDelete(item)}>删除</Button>
                                  </div>
                                </Card>
                              )}
                            )}
                          </div>
                        )
                      })()}
                    </div>}
                  </div>

                  <div
                    // onMouseDown={() => setInnerIsResizingLeft(true)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: innerTopHeightLeft - 2,
                      height: '5px',
                      cursor: 'row-resize',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{width: '100%', height: '1px', background: innerIsResizingLeft ? '#1677ff' : '#f0f0f0'}} />
                  </div>
                  <div style={{ flex: 1, minHeight: 120, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* 标签：已选工作流 + 选择图标 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 600, color: '#1f2937' }}>
                        已选工作流：{(pgCompareMode ? (wfLeft?.name || '') : (wfNormal?.name || ''))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tooltip title="添加进到现有工作流队列">
                          <Button
                            icon={<PlusOutlined />}
                            type="default"
                            onClick={handleAddQueueToExisting}
                            disabled={!addQueueEnabled}
                          />
                        </Tooltip>
                        {(pgCompareMode ? favoriteBtnVisibleLeft : favoriteBtnVisibleNormal) && (
                          <Tooltip title="收藏进通用工作流">
                            <Button
                              type="default"
                              icon={<StarOutlined />}
                              onClick={() => handleFavoriteWorkflow(pgCompareMode ? 'left' : 'normal')}
                            />
                          </Tooltip>
                        )}
                        <Tooltip title="选择现有工作流队列">
                          <Button
                            type="default"
                            icon={<BranchesOutlined />}
                            onClick={() => { setWfQueue(undefined); setWorkflowDrawerOpen(true) }}
                          />
                        </Tooltip>
                      </div>
                    </div>
                    {/* 复制的顶部字段：仅保留工作流队列（置于提示词上方） */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 0 }}>
                      {/* 标签行：仅工作流队列 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f' }}>*</span> 工作流队列</span>
                      </div>
                      {/* 选择行：仅工作流队列选择 */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                        <div>
                          <Select
                            placeholder="请选择工作流队列"
                            style={{ width: '100%' }}
                            value={wfQueue}
                            onChange={setWfQueue}
                            allowClear
                          >
                            <Option value="评分默认队列 (wf.correction.default)">评分默认队列 (wf.correction.default)</Option>
                            <Option value="OCR默认队列 (wf.ocr.default)">OCR默认队列 (wf.ocr.default)</Option>
                            <Option value="通用默认队列 (wf.general.default)">通用默认队列 (wf.general.default)</Option>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {/* 提示词 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 0 }}>
                      <div style={{ fontWeight: 'bold' }}>提示词</div>
                      <Input.TextArea
                        placeholder="请输入提示词"
                        autoSize={{ minRows: 6, maxRows: 8 }}
                        allowClear
                        value={pgCompareMode ? promptTextLeft : promptText}
                        onChange={(e) => pgCompareMode ? setPromptTextLeft(e.target.value) : setPromptText(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    {/* 左下部分左上：已选数据集工具栏 */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Button icon={<AIRunIcon />} type="primary" style={{ width: 100 }} disabled={pgCompareMode ? !canRunLeft : !canRunNormal} onClick={pgCompareMode ? handleRunLeft : handleRunNormal}>运行</Button>
                      </div>
                    </div>

                    {/* 左下卡片展示：按需水平/垂直滚动 */}
                    <div style={{ width: '100%', minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}>
                      {false && (
                        <>
                      {/* 通用批阅（文本）已选 */}
                      {(() => {
                        const ids = pgCompareMode ? previewDatasetIdsLeft : previewDatasetIds
                        const items = (datasetTextFilteredData || []).filter(d => (ids || []).includes(d.id))
                        if (!items.length) return null
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 320px)', gap: 12, width: 'max-content' }}>
                            {items.map((item) => {
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <Card
                                  key={item.id}
                                  hoverable
                                  size="small"
                                  style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                  bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                >
                                  {/* 右上角斜角核查状态标 */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      right: -28,
                                      width: 90,
                                      background: statusColor,
                                      color: '#fff',
                                      textAlign: 'center',
                                      padding: '1px 0',
                                      fontSize: 10,
                                      transform: 'rotate(45deg)',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                      pointerEvents: 'none',
                                      zIndex: 3
                                    }}
                                  >
                                    {item.checkStatus || '-'}
                                  </div>

                                  {/* 学生作答 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                                  </div>

                                  {/* 原题与正确答案 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.question || '-'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                                    <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.correctAnswer || '-'}</div>
                                  </div>

                                  {/* 满分分数 */}
                                  <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>

                                  {/* 标签 */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                    {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                      <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                    ))}
                                  </div>

                                  {/* 底部辅助信息 */}
                                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div>创建人：{item.creator || '-'}</div>
                                    <div>ID：{item.displayId || item.id || '-'}</div>
                                    <div>更新时间：{item.updateTime || '-'}</div>
                                    <div>创建时间：{item.createTime || '-'}</div>
                                  </div>

                                  {/* 操作区 */}
                                  <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                                    <Button type="link" size="small" onClick={() => handleDatasetView(item)}>查看</Button>
                                    <Button type="link" size="small" onClick={() => handleDatasetEdit(item)}>编辑</Button>
                                    <Button type="link" size="small" danger onClick={() => handleDatasetDelete(item)}>删除</Button>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* OCR识别（图片）已选 */}
                      {(() => {
                        const ids = pgCompareMode ? previewDatasetImageIdsLeft : previewDatasetImageIds
                        const items = (datasetImageFilteredData || []).filter(d => (ids || []).includes(d.id))
                        if (!items.length) return null
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 320px)', gap: 12, width: 'max-content', marginTop: 8 }}>
                            {items.map((item) => {
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <Card
                                  key={item.id}
                                  hoverable
                                  size="small"
                                  style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                  bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                >
                                  {/* 右上角斜角核查状态标 */}
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: 5,
                                      right: -28,
                                      width: 90,
                                      background: statusColor,
                                      color: '#fff',
                                      textAlign: 'center',
                                      padding: '1px 0',
                                      fontSize: 10,
                                      transform: 'rotate(45deg)',
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                      pointerEvents: 'none',
                                      zIndex: 3
                                    }}
                                  >
                                    {item.checkStatus || '-'}
                                  </div>

                                  <div style={{ position: 'relative' }}>
                                    <img
                                      src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                      alt={getImageNameFromInput(item.input)}
                                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }}
                                    />
                                  </div>

                                  {/* 识别结果 */}
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                    <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                                  </div>

                                  {/* 标签 */}
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                    {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                      <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                    ))}
                                  </div>

                                  {/* 底部辅助信息 */}
                                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                    <div>创建人：{item.creator || '-'}</div>
                                    <div>ID：{item.displayId || item.id || '-'}</div>
                                    <div>更新时间：{item.updateTime || '-'}</div>
                                    <div>创建时间：{item.createTime || '-'}</div>
                                  </div>

                                  {/* 操作区 */}
                                  <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                                    <Button type="link" size="small" onClick={() => handleDatasetView(item)}>查看</Button>
                                    <Button type="link" size="small" onClick={() => handleDatasetEdit(item)}>编辑</Button>
                                    <Button type="link" size="small" danger onClick={() => handleDatasetDelete(item)}>删除</Button>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        )
                      })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {false && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12, 
                  flex: 1, 
                  minHeight: 0
                }}>
                  {/* 上半部分：筛选 + 列表 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 12,
                    flex: '0 0 auto'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: 12, 
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #add8e6',
                      marginBottom: 8
                    }}>
                      <Input
                        allowClear
                        placeholder="搜索工作流名称"
                        value={pgCompareMode ? workflowSearchTextLeft : workflowSearchText}
                        onChange={(e) => pgCompareMode ? setWorkflowSearchTextLeft(e.target.value) : setWorkflowSearchText(e.target.value)}
                        style={{ width: 200 }}
                      />
                      <Select
                        placeholder="选择学科"
                        value={pgCompareMode ? workflowSubjectFilterLeft : workflowSubjectFilter}
                        onChange={pgCompareMode ? setWorkflowSubjectFilterLeft : setWorkflowSubjectFilter}
                        style={{ width: 200 }}
                        allowClear
                      >
                        {TAG_SUBJECTS.map(sub => (
                          <Option key={sub} value={sub}>{sub}</Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="选择题型"
                        value={pgCompareMode ? workflowQuestionTypeFilterLeft : workflowQuestionTypeFilter}
                        onChange={pgCompareMode ? setWorkflowQuestionTypeFilterLeft : setWorkflowQuestionTypeFilter}
                        style={{ width: 200 }}
                        allowClear
                      >
                        {TAG_TYPES.map(t => (
                          <Option key={t} value={t}>{t}</Option>
                        ))}
                      </Select>
                    </div>

                    <Table
                      size="small"
                      tableLayout="fixed"
                      columns={[
                        {
                          title: '工作流队列',
                          dataIndex: 'name',
                          key: 'name',
                          width: 150,
                          ellipsis: true
                        },
                        {
                          title: '工作流类别',
                          dataIndex: 'type',
                          key: 'type',
                          width: 120,
                          ellipsis: true
                        },
                        {
                          title: '科目和题型',
                          dataIndex: 'subjects',
                          key: 'subjects',
                          width: 120,
                          ellipsis: true,
                          render: (subjects) => subjects ? subjects.join(', ') : '-'
                        },
                        {
                          title: '工作流ID',
                          dataIndex: 'id',
                          key: 'id',
                          width: 100,
                          ellipsis: true
                        },
                        {
                          title: '模型配置',
                          dataIndex: 'modelConfig',
                          key: 'modelConfig',
                          width: 180,
                          ellipsis: true,
                          render: (config) => config ? config.join(', ') : '-'
                        },
                        {
                          title: '创建时间',
                          dataIndex: 'createTime',
                          key: 'createTime',
                          width: 120,
                          ellipsis: true
                        },
                        {
                          title: '操作',
                          key: 'action',
                          width: 100,
                          fixed: 'right',
                          render: (_, record) => (
                            <Space size="small">
                              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditWorkflow(record)} />
                              <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteWorkflow(record)} />
                            </Space>
                          )
                        }
                      ]}
                      dataSource={pgCompareMode ? filteredWorkflowListLeft : filteredWorkflowList}
                      pagination={false}
                      scroll={{ x: 790 }}
                      style={{
                        width: '100%'
                      }}
                      onRow={(record) => ({
                        onClick: () => pgCompareMode ? handleWorkflowRowClickLeft(record) : handleWorkflowRowClick(record),
                        style: { cursor: 'pointer' }
                      })}
                      rowClassName={(record) => (pgCompareMode ? record.key === selectedWorkflowKeyLeft : record.key === selectedWorkflowKey) ? 'workflow-row-selected' : ''}
                      locale={{ emptyText: '暂无工作流配置，点击上方"+"按钮新增' }}
                    />
                  </div>

                  {/* 下半部分：测评配置区 */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #add8e6',
                    flex: '0 0 auto'
                  }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>测评配置区</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* 复制的顶部字段：工作流队列与主要筛选（置于提示词上方） */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f' }}>*</span> 工作流队列</span>
                          <span style={{ fontWeight: 600 }}>科目</span>
                          <span style={{ fontWeight: 600 }}>题型</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div>
                          <Select
                              placeholder="请选择工作流队列"
                              style={{ width: '100%' }}
                              value={wfQueue}
                              onChange={setWfQueue}
                              allowClear
                            >
                              <Option value="评分默认队列 (wf.correction.default)">评分默认队列 (wf.correction.default)</Option>
                              <Option value="OCR默认队列 (wf.ocr.default)">OCR默认队列 (wf.ocr.default)</Option>
                              <Option value="通用默认队列 (wf.general.default)">通用默认队列 (wf.general.default)</Option>
                            </Select>
                          </div>
                          <div>
                            <Select
                              placeholder="请选择科目"
                              style={{ width: '100%' }}
                              value={wfPrimarySubject}
                              onChange={setWfPrimarySubject}
                              allowClear
                            >
                            {TAG_SUBJECTS.map(s => (<Option key={s} value={s}>{s}</Option>))}
                            </Select>
                          </div>
                          <div>
                            <Select
                              placeholder="请选择题型"
                              style={{ width: '100%' }}
                              value={wfPrimaryType}
                              onChange={setWfPrimaryType}
                              allowClear
                            >
                              {TAG_TYPES.map(t => (<Option key={t} value={t}>{t}</Option>))}
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 'bold' }}>提示词</div>
                      <Input.TextArea 
                        placeholder="请输入提示词" 
                        autoSize={{ minRows: 6, maxRows: 16 }} 
                        allowClear
                        value={pgCompareMode ? promptTextLeft : promptText}
                        onChange={(e) => pgCompareMode ? setPromptTextLeft(e.target.value) : setPromptText(e.target.value)}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
                          <span>已选<span style={{ color: '#ff4d4f' }}>{(pgCompareMode ? selectedDatasetCountLeft : selectedDatasetCount) || 0}</span>条</span>
                          <div>{({ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey]) || '通用批阅'}</div>
                          <div>数据集</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Tooltip title="选择数据集">
                          <Button icon={<FolderOpenOutlined />} onClick={() => { if (pgCompareMode) setDatasetSelectSide('left'); setDatasetBatchSelectMode(true); setDatasetDrawerOpen(true) }} />
                        </Tooltip>
                <Button icon={<AIRunIcon />} type="primary" style={{ width: 100 }} disabled={pgCompareMode ? !canRunLeft : !canRunNormal} onClick={pgCompareMode ? handleRunLeft : handleRunNormal}>运行</Button>
              </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 左列拖拽分隔条（比较模式） */}
            {pgCompareMode && pgTopLeftHeightPx != null && (
              <div
                // onMouseDown={() => setPgIsResizingLeft(true)}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (pgTopLeftHeightPx - 2),
                  height: 4,
                  cursor: 'row-resize',
                  background: '#e6f2ff',
                  zIndex: 2
                }}
              />
            )}


            <Drawer
              title={(
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>选择数据集</span>
                  <Tooltip title="关闭">
                    <Button type="text" icon={<CloseOutlined />} onClick={() => setDatasetDrawerOpen(false)} />
                  </Tooltip>
                </div>
              )}
              placement="right"
              width={'75vw'}
              open={datasetDrawerOpen}
              onClose={() => setDatasetDrawerOpen(false)}
              closable={false}
              maskClosable
              styles={{ body: { overflow: 'hidden' } }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Input
                    allowClear
                    placeholder="搜索ID"
                    size="middle"
                    style={{ width: 150 }}
                    value={datasetIdFilter}
                    onChange={(e) => setDatasetIdFilter(e.target.value)}
                  />
                  <Input
                    allowClear
                    placeholder="搜索创建人"
                    size="middle"
                    style={{ width: 150 }}
                    value={datasetCreatorFilter}
                    onChange={(e) => setDatasetCreatorFilter(e.target.value)}
                  />
                  <Select
                    mode="multiple"
                    showSearch
                    value={datasetTagsFilter}
                    onChange={setDatasetTagsFilter}
                    onSearch={(v) => setDatasetTagKeyword(v)}
                    allowClear
                    placeholder="筛选标签"
                    style={{ width: 200 }}
                    options={datasetFilterTagOptions}
                  />
                  {/* 核查状态筛选 */}
                  <Select
                    value={datasetFilterStatus}
                    placeholder="搜索核查状态"
                    size="middle"
                    style={{ width: 150 }}
                    allowClear
                    onChange={setDatasetFilterStatus}
                  options={[
                    { value: '已核查', label: '已核查' },
                    { value: '未核查', label: '未核查' }
                  ]}
                  />
                  {/* 创建人筛选已移除 */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button
                      size="small"
                      onClick={() => {
                        if (String(datasetTabKey).startsWith('text')) {
                          setDatasetSelectedIds([])
                        } else {
                          setDatasetSelectedImageIds([])
                        }
                        if (pgCompareMode) {
                          setSelectedDatasetCountLeft(0)
                        } else {
                          setSelectedDatasetCount(0)
                        }
                        messageApi.success('已取消选择')
                      }}
                    >
                      取消选择
                    </Button>
                    <Button
                      size="small"
                      onClick={() => { handleSelectAllVisible() }}
                    >
                      全选
                    </Button>
                    <Button size="small" type="primary" onClick={() => {
                      const count = (datasetSelectedIds?.length || 0) + (datasetSelectedImageIds?.length || 0)
                      if (pgCompareMode && datasetSelectSide === 'left') {
                        setSelectedDatasetCountLeft(count)
                        setPreviewDatasetIdsLeft(datasetSelectedIds || [])
                        setPreviewDatasetImageIdsLeft(datasetSelectedImageIds || [])
                      } else if (pgCompareMode && datasetSelectSide === 'right') {
                        setSelectedDatasetCountRight(count)
                        setPreviewDatasetIdsRight(datasetSelectedIds || [])
                        setPreviewDatasetImageIdsRight(datasetSelectedImageIds || [])
                      } else {
                        setSelectedDatasetCount(count)
                        setPreviewDatasetIds(datasetSelectedIds || [])
                        setPreviewDatasetImageIds(datasetSelectedImageIds || [])
                      }
                      setDatasetSelectSide(null)
                      messageApi.success(`已添加 ${count} 条数据集`)
                    }}>
                      添加
                    </Button>
                  </div>
                </div>

                <Tabs
                  activeKey={datasetTabKey}
                  onChange={setDatasetTabKey}
                  items={[
                    {
                      key: 'text',
                      label: '通用批阅',
                      children: (
                        <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                          <List
                            grid={{ gutter: 12, column: 4 }}
                            loading={datasetLoading}
                            dataSource={datasetTextFilteredData}
                            pagination={{
                              total: datasetTextFilteredData.length,
                              pageSize: 9,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                            }}
                            renderItem={(item) => {
                              const isSelected = datasetSelectedIds.includes(item.id)
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <List.Item key={item.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                    bodyStyle={{ padding: '28px 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: 8 }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: -28,
                                        width: 90,
                                        background: statusColor,
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '1px 0',
                                        fontSize: 10,
                                        transform: 'rotate(45deg)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 3
                                      }}
                                    >
                                      {item.checkStatus || '-'}
                                    </div>
                                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setDatasetSelectedIds((prev) => {
                                            const set = new Set(prev)
                                            if (checked) set.add(item.id); else set.delete(item.id)
                                            return Array.from(set)
                                          })
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                      <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                                      <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.question || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                                      <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.correctAnswer || '-'}</div>
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>
                                    <div style={{ fontWeight: 600, color: '#111827' }}>{item.checkStatus === '已核查' ? 'Ground Truth: XXX' : 'Ground Truth:'}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                      {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                      ))}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div>创建人：{item.creator || '-'}</div>
                                      <div>ID：{item.displayId || item.id || '-'}</div>
                                      <div>更新时间：{item.updateTime || '-'}</div>
                                      <div>创建时间：{item.createTime || '-'}</div>
                                    </div>
                                  </Card>
                                </List.Item>
                              )
                            }}
                          />
                        </div>
                      )
                    },
                    {
                      key: 'text2',
                      label: '作文评分',
                      children: (
                        <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                          <List
                            grid={{ gutter: 12, column: 4 }}
                            loading={datasetLoading}
                            dataSource={datasetTextFilteredData}
                            pagination={{
                              total: datasetTextFilteredData.length,
                              pageSize: 9,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                            }}
                            renderItem={(item) => {
                              const isSelected = datasetSelectedIds.includes(item.id)
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <List.Item key={item.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                    bodyStyle={{ padding: '28px 12px 12px 36px', display: 'flex', flexDirection: 'column', gap: 8 }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: -28,
                                        width: 90,
                                        background: statusColor,
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '1px 0',
                                        fontSize: 10,
                                        transform: 'rotate(45deg)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 3
                                      }}
                                    >
                                      {item.checkStatus || '-'}
                                    </div>
                                    <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                      <Checkbox
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          setDatasetSelectedIds((prev) => {
                                            const set = new Set(prev)
                                            if (checked) set.add(item.id); else set.delete(item.id)
                                            return Array.from(set)
                                          })
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                                      <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                                    </div>
                                    
                                    <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                      {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                      ))}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div>创建人：{item.creator || '-'}</div>
                                      <div>ID：{item.displayId || item.id || '-'}</div>
                                      <div>更新时间：{item.updateTime || '-'}</div>
                                      <div>创建时间：{item.createTime || '-'}</div>
                                    </div>
                                  </Card>
                                </List.Item>
                              )
                            }}
                          />
                        </div>
                      )
                    },
                    {
                      key: 'image',
                      label: '手阅登分',
                      children: (
                        <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                          <List
                            grid={{ gutter: 12, column: 4 }}
                            loading={datasetLoading}
                            dataSource={datasetImageFilteredData}
                            pagination={{
                              total: datasetImageFilteredData.length,
                              pageSize: 9,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                            }}
                            renderItem={(item) => {
                              const isSelected = datasetSelectedImageIds.includes(item.id)
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <List.Item key={item.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                    bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: -28,
                                        width: 90,
                                        background: statusColor,
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '1px 0',
                                        fontSize: 10,
                                        transform: 'rotate(45deg)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 3
                                      }}
                                    >
                                      {item.checkStatus || '-'}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const checked = e.target.checked
                                            setDatasetSelectedImageIds((prev) => {
                                              const set = new Set(prev)
                                              if (checked) set.add(item.id); else set.delete(item.id)
                                              return Array.from(set)
                                            })
                                          }}
                                        />
                                      </div>
                                      <img
                                        src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                        alt={getImageNameFromInput(item.input)}
                                        style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                        onClick={() => openImageViewer(item)}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                      <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                      {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                      ))}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                      <div>创建人：{item.creator || '-'}</div>
                                      <div>ID：{item.displayId || item.id || '-'}</div>
                                      <div>更新时间：{item.updateTime || '-'}</div>
                                      <div>创建时间：{item.createTime || '-'}</div>
                                    </div>
                                  </Card>
                                </List.Item>
                              )
                            }}
                          />
                        </div>
                      )
                    },
                    {
                      key: 'image2',
                      label: 'OCR识别',
                      children: (
                        <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                          <List
                            grid={{ gutter: 12, column: 4 }}
                            loading={datasetLoading}
                            dataSource={datasetImageFilteredData}
                            pagination={{
                              total: datasetImageFilteredData.length,
                              pageSize: 9,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                            }}
                            renderItem={(item) => {
                              const isSelected = datasetSelectedImageIds.includes(item.id)
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <List.Item key={item.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                    bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: -28,
                                        width: 90,
                                        background: statusColor,
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '1px 0',
                                        fontSize: 10,
                                        transform: 'rotate(45deg)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 3
                                      }}
                                    >
                                      {item.checkStatus || '-'}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const checked = e.target.checked
                                            setDatasetSelectedImageIds((prev) => {
                                              const set = new Set(prev)
                                              if (checked) set.add(item.id); else set.delete(item.id)
                                              return Array.from(set)
                                            })
                                          }}
                                        />
                                      </div>
                                      <img
                                        src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                        alt={getImageNameFromInput(item.input)}
                                        style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                        onClick={() => openImageViewer(item)}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                      <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                      {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                      ))}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                      <div>创建人：{item.creator || '-'}</div>
                                      <div>ID：{item.displayId || item.id || '-'}</div>
                                      <div>更新时间：{item.updateTime || '-'}</div>
                                      <div>创建时间：{item.createTime || '-'}</div>
                                    </div>
                                  </Card>
                                </List.Item>
                              )
                            }}
                          />
                        </div>
                      )
                    },
                    {
                      key: 'image1',
                      label: '图片打分',
                      children: (
                        <div style={{ width: '100%', minHeight: 0, maxHeight: 'calc(100vh - 260px)', overflowX: 'auto', overflowY: 'auto' }}>
                          <List
                            grid={{ gutter: 12, column: 4 }}
                            loading={datasetLoading}
                            dataSource={datasetImageFilteredData}
                            pagination={{
                              total: datasetImageFilteredData.length,
                              pageSize: 9,
                              showSizeChanger: true,
                              showQuickJumper: true,
                              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
                            }}
                            renderItem={(item) => {
                              const isSelected = datasetSelectedImageIds.includes(item.id)
                              const tagsArray = normalizeTagList(item.tags)
                              const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                              return (
                                <List.Item key={item.id}>
                                  <Card
                                    hoverable
                                    size="small"
                                    style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                                    bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                                  >
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: 5,
                                        right: -28,
                                        width: 90,
                                        background: statusColor,
                                        color: '#fff',
                                        textAlign: 'center',
                                        padding: '1px 0',
                                        fontSize: 10,
                                        transform: 'rotate(45deg)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                                        pointerEvents: 'none',
                                        zIndex: 3
                                      }}
                                    >
                                      {item.checkStatus || '-'}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                        <Checkbox
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const checked = e.target.checked
                                            setDatasetSelectedImageIds((prev) => {
                                              const set = new Set(prev)
                                              if (checked) set.add(item.id); else set.delete(item.id)
                                              return Array.from(set)
                                            })
                                          }}
                                        />
                                      </div>
                                      <img
                                        src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                                        alt={getImageNameFromInput(item.input)}
                                        style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                                        onClick={() => openImageViewer(item)}
                                      />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                                      <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                                      {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                                        <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                                      ))}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                                      <div>创建人：{item.creator || '-'}</div>
                                      <div>ID：{item.displayId || item.id || '-'}</div>
                                      <div>更新时间：{item.updateTime || '-'}</div>
                                      <div>创建时间：{item.createTime || '-'}</div>
                                    </div>
                                  </Card>
                                </List.Item>
                              )
                            }}
                          />
                        </div>
                      )
                    }
                  ]}
                />
              </div>
            </Drawer>

            {/* 工作流选择抽屉 */}
            <Drawer
              title={<span>现有工作流队列</span>}
              placement="right"
              width={'60vw'}
              open={workflowDrawerOpen}
              onClose={() => setWorkflowDrawerOpen(false)}
              maskClosable
              rootClassName="wf-drawer"
              styles={{ body: { overflow: 'hidden' } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #add8e6',
                  marginBottom: 8
                }}>
                  <Input
                    allowClear
                    placeholder="搜索工作流名称"
                    value={pgCompareMode ? workflowSearchTextLeft : workflowSearchText}
                    onChange={(e) => pgCompareMode ? setWorkflowSearchTextLeft(e.target.value) : setWorkflowSearchText(e.target.value)}
                    style={{ width: 200 }}
                  />
                  <Select
                    placeholder="选择学科"
                    value={pgCompareMode ? workflowSubjectFilterLeft : workflowSubjectFilter}
                    onChange={pgCompareMode ? setWorkflowSubjectFilterLeft : setWorkflowSubjectFilter}
                    style={{ width: 200 }}
                    allowClear
                  >
                    {TAG_SUBJECTS.map(sub => (
                      <Option key={sub} value={sub}>{sub}</Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="选择题型"
                    value={pgCompareMode ? workflowQuestionTypeFilterLeft : workflowQuestionTypeFilter}
                    onChange={pgCompareMode ? setWorkflowQuestionTypeFilterLeft : setWorkflowQuestionTypeFilter}
                    style={{ width: 200 }}
                    allowClear
                  >
                    {TAG_TYPES.map(t => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Select>
                </div>

                <Table
                  size="small"
                  tableLayout="fixed"
                  columns={[
                    {
                      title: '工作流队列',
                      dataIndex: 'name',
                      key: 'name_dup',
                      width: 150,
                      ellipsis: true
                    },
                    {
                      title: '提示词',
                      dataIndex: 'prompt',
                      key: 'prompt',
                      width: 220,
                      ellipsis: true,
                      render: (prompt) => prompt || '-'
                    },
                    {
                      title: '工作流名称',
                      dataIndex: 'name',
                      key: 'name',
                      width: 150,
                      ellipsis: true
                    },
                    {
                      title: '学科',
                      dataIndex: 'type',
                      key: 'subject',
                      width: 120,
                      ellipsis: true,
                      render: (_, record) => (record?.subjects && record.subjects[0]) ? record.subjects[0] : '-'
                    },
                    {
                      title: '题型',
                      dataIndex: 'subjects',
                      key: 'typeName',
                      width: 120,
                      ellipsis: true,
                      render: (subjects, record) => (record?.subjects && record.subjects[1]) ? record.subjects[1] : (subjects ? (Array.isArray(subjects) ? (subjects[1] || '-') : '-') : '-')
                    },
                    {
                      title: '年级',
                      dataIndex: 'grade',
                      key: 'grade',
                      width: 100,
                      ellipsis: true,
                      render: (grade) => grade || '-'
                    },
                    {
                      title: '教育机构',
                      dataIndex: 'org',
                      key: 'org',
                      width: 150,
                      ellipsis: true,
                      render: (org) => org || '-'
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createTime',
                      key: 'createTime',
                      width: 120,
                      ellipsis: true
                    },
                  ]}
                  dataSource={pgCompareMode ? filteredWorkflowListLeft : filteredWorkflowList}
                  pagination={false}
                  scroll={{ x: 790 }}
                  style={{
                    width: '100%'
                  }}
                  onRow={(record) => ({
                    onClick: () => pgCompareMode ? handleWorkflowRowClickLeft(record) : handleWorkflowRowClick(record),
                    style: { cursor: 'pointer' }
                  })}
                  rowClassName={(record) => (pgCompareMode ? record.key === selectedWorkflowKeyLeft : record.key === selectedWorkflowKey) ? 'workflow-row-selected' : ''}
                  locale={{ emptyText: '暂无工作流配置，点击上方"+"按钮新增' }}
                />
              </div>
            </Drawer>

            {/* 数据集选择区已移除 */}

            {/* 历史测试记录抽屉（表格展示） */}
            <Drawer
              title={(
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setHistoryDrawerOpen(false)} />
                  <span>历史测试记录</span>
                </div>
              )}
              placement="right"
              width="100%"
              open={historyDrawerOpen}
              onClose={() => setHistoryDrawerOpen(false)}
              closable={false}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: 24 }}>
                {/* 筛选区域与右侧“对比”按钮 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Input
                      placeholder="搜索工作队列"
                      allowClear
                      value={historyFilterQueue}
                      onChange={(e) => setHistoryFilterQueue(e.target.value)}
                      style={{ width: 220 }}
                    />
                    <Input
                      placeholder="搜索测试人员"
                      allowClear
                      value={historyFilterTester}
                      onChange={(e) => setHistoryFilterTester(e.target.value)}
                      style={{ width: 200 }}
                    />
                    <RangePicker
                      showTime
                      value={historyFilterRange}
                      onChange={(vals) => setHistoryFilterRange(vals)}
                      style={{ width: 280 }}
                    />
                  </div>
                  <div>
                    <Tooltip title={selectedHistoryRowKeys.length < 2 ? '需至少选择两条记录进行对比' : '对比已选择的历史记录'}>
                      <Button
                        type="primary"
                        icon={<CompareIcon />}
                        disabled={selectedHistoryRowKeys.length < 2}
                        onClick={() => setHistoryCompareModalOpen(true)}
                      >
                        对比
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <Table
                  size="small"
                  columns={historyColumns}
                  dataSource={filteredHistory}
                  rowKey={(r) => r.id}
                  rowSelection={{
                    selectedRowKeys: selectedHistoryRowKeys,
                    onChange: (keys) => setSelectedHistoryRowKeys(keys),
                    preserveSelectedRowKeys: true,
                  }}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: '暂无历史记录' }}
                  scroll={{ x: 1800 }}
                />
              </div>
            </Drawer>

            {/* 历史测试记录明细弹窗 */}
            <Modal
              open={historyDetailModalOpen}
              title="测试明细"
              onCancel={() => setHistoryDetailModalOpen(false)}
              footer={null}
              width={960}
            >
              {historyDetailRecord?.rawOutput ? (
                (() => {
                  const ds = historyDetailRecord.rawOutput?.datasets || []
                  const tCount = ds.filter(d => d.type === 'text').length
                  const iCount = ds.filter(d => d.type === 'image').length
                  return renderPreview(historyDetailRecord.rawOutput, {
                    textCount: tCount,
                    imageCount: iCount,
                    datasetTabKey: historyDetailRecord.datasetTabKey,
                    startTime: historyDetailRecord.startTime,
                    endTime: historyDetailRecord.endTime,
                    hideSummary: true,
                    hideDetailHeader: true,
                    detailPlain: true
                  })
                })()
              ) : (
                <div style={{ color: '#666' }}>暂无明细数据</div>
              )}
            </Modal>

            {/* 历史测试记录对比弹窗 */}
            <Modal
              open={historyCompareModalOpen}
              title="历史测试记录对比"
              width={1200}
              onCancel={() => setHistoryCompareModalOpen(false)}
              footer={null}
              bodyStyle={{ padding: 0 }}
            >
              {(() => {
                const selectedRecords = filteredHistory.filter(r => selectedHistoryRowKeys.includes(r.id))
                if (!selectedRecords.length) return <div style={{ padding: 16 }}>请在表格中选择需要对比的记录。</div>
                return (
                  <div style={{ overflow: 'visible' }}>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
                        <Tabs
                          size="small"
                          activeKey={historyCompareSortKey}
                          onChange={(key) => setHistoryCompareSortKey(key)}
                          items={[
                            { key: 'accuracy_desc', label: '按准确率降序排列' },
                            { key: 'totalTime_asc', label: '按总耗时升序排列' },
                            { key: 'avgTime_asc', label: '按平均耗时升序排列' },
                            { key: 'failCount_asc', label: '按失败数量升序排列' }
                          ]}
                        />
                      </div>
                      {(() => {
                        const compareFields = [
                          { key: 'logTime', label: '创建日志时间', bold: true },
                          { key: 'queue', label: '工作流队列', bold: true },
                          { key: 'prompt', label: '提示词', bold: true },
                          { key: 'totalTime', label: '总耗时', bold: true },
                          { key: 'avgTime', label: '平均耗时', bold: true },
                          { key: 'accuracy', label: '准确率', bold: true },
                          { key: 'failCount', label: '失败数量', bold: true },
                          { key: 'successCount', label: '准确数量', bold: false },
                          { key: 'errorCount', label: '错误数量', bold: false },
                          { key: 'datasetDesc', label: '数据集描述', bold: false },
                          { key: 'subjectType', label: '适用科目和题型', bold: false },
                          { key: 'startTime', label: '测试开始时间', bold: false },
                          { key: 'endTime', label: '测试结束时间', bold: false },
                          { key: 'tester', label: '测试人员', bold: false }
                        ]

                        const toNum = (v) => {
                          const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''))
                          return Number.isFinite(n) ? n : 0
                        }
                        const getAcc = (r) => toNum(r?.accuracy)
                        const getTotal = (r) => toNum(r?.totalTime)
                        const getAvg = (r) => toNum(r?.avgTime)
                        const getFail = (r) => Number(r?.failCount ?? 0)
                        const sortFn = (a, b) => {
                          switch (historyCompareSortKey) {
                            case 'totalTime_asc': return getTotal(a) - getTotal(b)
                            case 'avgTime_asc': return getAvg(a) - getAvg(b)
                            case 'failCount_asc': return getFail(a) - getFail(b)
                            case 'accuracy_desc':
                            default: return getAcc(b) - getAcc(a)
                          }
                        }
                        // 被排序后的顺序用于生成列（左→右）
                        const sortedRecords = [...selectedRecords].sort(sortFn)

                        const columns = [
                          {
                            title: '字段',
                            dataIndex: 'label',
                            key: 'label',
                            fixed: 'left',
                            width: 160,
                            render: (text, row) => (
                              <span style={{ fontWeight: row.bold ? 600 : 'normal' }}>{text}</span>
                            )
                          },
                          ...sortedRecords.map((r, idx) => ({
                            title: `记录${idx + 1}`,
                            dataIndex: `col_${idx}`,
                            key: `col_${idx}`,
                            width: 280,
                            ellipsis: true
                          }))
                        ]

                        const dataRows = compareFields.map((f) => {
                          const row = { key: f.key, label: f.label, bold: f.bold }
                          sortedRecords.forEach((r, idx) => {
                            const v = r?.[f.key]
                            row[`col_${idx}`] = (v === null || v === undefined || v === '') ? '-' : String(v)
                          })
                          return row
                        })

                        return (
                          <Table
                            size="small"
                            tableLayout="fixed"
                            columns={columns}
                            dataSource={dataRows}
                            pagination={false}
                            scroll={{ x: 220 + selectedRecords.length * 280 }}
                          />
                        )
                      })()}
                    </div>
                  </div>
                )
              })()}
            </Modal>

            {/* 结果预览区 */}
            <Card
              size="small"
              title={pgPreviewCollapsed ? null : <span>结果预览区</span>}
              extra={!pgCompareMode ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {testStatusRight && (
                    (() => {
                      const statusMap = {
                        pending: { icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />, text: '待处理' },
                        running: { icon: <Loading3QuartersOutlined style={{ color: '#2563eb' }} className="anticon-spin" />, text: '运行中' },
                        completed: { icon: <CheckCircleOutlined style={{ color: '#10b981' }} />, text: '已完成' }
                      }
                      const s = statusMap[testStatusRight] || null
                      return s ? (
                        <Tag style={{ border: 'none', background: 'transparent', padding: '0 6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {s.icon}
                          <span>{s.text}</span>
                        </Tag>
                      ) : null
                    })()
                  )}
                  <Tooltip title="历史测试记录">
                    <Button
                      type="default"
                      icon={<HistoryOutlined />}
                      onClick={() => setHistoryDrawerOpen(true)}
                      style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                    />
                  </Tooltip>
                  <Tooltip 
                    title={pgPreviewCollapsed ? '展开结果预览区' : '收起结果预览区'} 
                    trigger="hover"
                    open={tipPreviewToggleOpen}
                    onOpenChange={setTipPreviewToggleOpen}
                    mouseEnterDelay={0}
                    mouseLeaveDelay={0}
                    destroyTooltipOnHide
                  >
                    <Button
                      type="default"
                      icon={pgPreviewCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => { setPgPreviewCollapsed(v => !v); setTipPreviewToggleOpen(false) }}
                      style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                    />
                  </Tooltip>
                </div>
              ) : null}
              styles={{
                body: { padding: pgPreviewCollapsed ? 0 : 12 }
              }}
              style={{ 
                // 同时展开时与配置区各占一半；比较模式改为列内flex，预览区占满剩余空间
                flex: pgCompareMode ? '1 1 auto' : (pgPreviewCollapsed ? '0 0 60px' : (!pgConfigCollapsed && !pgPreviewCollapsed ? '1 1 50%' : '1 1 auto')),
                display: 'flex', 
                flexDirection: 'column', 
                transition: 'flex 0.3s ease', 
                // 分屏时允许更小的最小宽度以适配 50%
                minWidth: pgCompareMode ? 0 : (pgPreviewCollapsed ? 60 : (!pgConfigCollapsed && !pgPreviewCollapsed ? 0 : 300)),
                borderTopLeftRadius: pgCompareMode ? undefined : 0,
                borderTopRightRadius: pgCompareMode ? undefined : 0,
                borderRadius: pgCompareMode ? 0 : undefined,
                minHeight: 0
              }}
            >
              {!pgPreviewCollapsed && (
                <div style={{ display: 'flex', gap: 12, height: '100%' }}>
            <div style={{ 
              flex: 1, 
              overflowX: 'auto', 
              overflowY: 'auto', 
              minWidth: 0, 
              maxHeight: '70vh',
              ...(pgCompareMode 
                ? { borderRadius: 0 } 
                : { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }
              )
            }}>
              {renderPreview(pgCompareMode ? runOutputLeft : runOutput, { textCount: previewDatasetIds?.length || 0, imageCount: previewDatasetImageIds?.length || 0, datasetTabKey, startTime: pgCompareMode ? undefined : new Date().toISOString(), endTime: pgCompareMode ? undefined : new Date().toISOString() })}
            </div>
                </div>
              )}
            </Card>

            {/* 左列容器结束 */}
            </div>

            {pgCompareMode && (
              <div
                ref={pgRightColRef}
                style={{
                  gridColumn: '2 / 3',
                  gridRow: '1 / 3',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  position: 'relative',
                  minWidth: 0
                }}
              >
                {/* 右侧工作流配置区 */}
                <Card
                  ref={configCardRightRef}
                  size="small"
                  title={pgConfigCollapsed ? null : <span>{pgCompareMode ? '配置区(对照组)' : '配置区'}</span>}
                  className={pgCompareMode ? 'pg-config-no-scrollbar' : undefined}
                  extra={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Tooltip 
                        title="添加进到现有工作流队列" 
                        trigger="hover" 
                        open={pgCompareMode ? tipConfigAddOpenRight : tipConfigAddOpen}
                        onOpenChange={pgCompareMode ? setTipConfigAddOpenRight : setTipConfigAddOpen}
                        mouseEnterDelay={0}
                        mouseLeaveDelay={0}
                        destroyTooltipOnHide
                      >
                        <Button
                          type="default"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => { 
                            handleAdd(); 
                            if (pgCompareMode) {
                              setPromptTextRight(wfPrompt)
                            } else {
                              setPromptText(wfPrompt)
                            }
                            (pgCompareMode ? setTipConfigAddOpenRight : setTipConfigAddOpen)(false) 
                          }}
                          style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                        />
                      </Tooltip>
                      <Tooltip title="收藏进通用工作流" trigger="hover">
                        {favoriteBtnVisibleRight && (
                          <Button
                            type="default"
                            size="small"
                            icon={<StarOutlined />}
                            onClick={() => handleFavoriteWorkflow('right')}
                            style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                          />
                        )}
                      </Tooltip>
                      {/* 测试状态指示（在展开/收起按钮之前） */}
                      {testStatusRight && (
                        (() => {
                          const statusMap = {
                            pending: { icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />, text: '待处理' },
                            running: { icon: <Loading3QuartersOutlined style={{ color: '#2563eb' }} className="anticon-spin" />, text: '运行中' },
                            completed: { icon: <CheckCircleOutlined style={{ color: '#10b981' }} />, text: '已完成' }
                          }
                          const s = statusMap[testStatusRight] || null
                          return s ? (
                            <Tag style={{ border: 'none', background: 'transparent', padding: '0 6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {s.icon}
                              <span>{s.text}</span>
                            </Tag>
                          ) : null
                        })()
                      )}
                      {!pgCompareMode && (
                        <Tooltip 
                          title={pgConfigCollapsed ? '展开工作流配置区' : '收起工作流配置区'} 
                          trigger="hover"
                          open={tipConfigToggleOpen}
                          onOpenChange={setTipConfigToggleOpen}
                          mouseEnterDelay={0}
                          mouseLeaveDelay={0}
                          destroyTooltipOnHide
                        >
                          <Button
                            type="default"
                            icon={pgConfigCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => { setPgConfigCollapsed(v => !v); setTipConfigToggleOpen(false) }}
                            style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                          />
                        </Tooltip>
                      )}
                    </div>
                  }
                  styles={{
                    body: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, overflow: 'auto', paddingBottom: pgCompareMode ? '226px' : undefined }
                  }}
                  style={{ 
                    flex: '0 0 auto',
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'flex 0.3s ease', 
                    minWidth: 0,
                    ...(pgCompareMode ? { borderTopRightRadius: 8, borderRadius: 0 } : { borderTopRightRadius: 0, borderRadius: undefined }),
                    minHeight: 0,
                    height: pgTopRightHeightPx || undefined
                  }}
                >
                  {!pgConfigCollapsed && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 12, 
                      flex: 1, 
                      minHeight: 0
                    }}>
                      {/* 上半部分：筛选 + 列表 */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: 12,
                        flex: '0 0 auto'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          gap: 12, 
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: '1px solid #add8e6',
                          marginBottom: 8
                        }}>
                          <Input
                            allowClear
                            placeholder="搜索工作流名称"
                            value={pgCompareMode ? workflowSearchTextRight : workflowSearchText}
                            onChange={(e) => pgCompareMode ? setWorkflowSearchTextRight(e.target.value) : setWorkflowSearchText(e.target.value)}
                            style={{ width: 200 }}
                          />
                          <Select
                            placeholder="选择学科"
                            value={pgCompareMode ? workflowSubjectFilterRight : workflowSubjectFilter}
                            onChange={pgCompareMode ? setWorkflowSubjectFilterRight : setWorkflowSubjectFilter}
                            style={{ width: 200 }}
                            allowClear
                          >
                            {TAG_SUBJECTS.map(sub => (
                              <Option key={sub} value={sub}>{sub}</Option>
                            ))}
                          </Select>
                          <Select
                            placeholder="选择题型"
                            value={pgCompareMode ? workflowQuestionTypeFilterRight : workflowQuestionTypeFilter}
                            onChange={pgCompareMode ? setWorkflowQuestionTypeFilterRight : setWorkflowQuestionTypeFilter}
                            style={{ width: 200 }}
                            allowClear
                          >
                            {TAG_TYPES.map(t => (
                              <Option key={t} value={t}>{t}</Option>
                            ))}
                          </Select>
                        </div>

                        <Table
                          size="small"
                          tableLayout="fixed"
                          columns={[
                            {
                              title: '工作流队列',
                              dataIndex: 'name',
                              key: 'name',
                              width: 150,
                              ellipsis: true
                            },
                            {
                              title: '工作流类别',
                              dataIndex: 'type',
                              key: 'type',
                              width: 120,
                              ellipsis: true
                            },
                            {
                              title: '科目和题型',
                              dataIndex: 'subjects',
                              key: 'subjects',
                              width: 120,
                              ellipsis: true,
                              render: (subjects) => subjects ? subjects.join(', ') : '-'
                            },
                            {
                              title: '工作流ID',
                              dataIndex: 'id',
                              key: 'id',
                              width: 100,
                              ellipsis: true
                            },
                            {
                              title: '模型配置',
                              dataIndex: 'modelConfig',
                              key: 'modelConfig',
                              width: 180,
                              ellipsis: true,
                              render: (config) => config ? config.join(', ') : '-'
                            },
                            {
                              title: '创建时间',
                              dataIndex: 'createTime',
                              key: 'createTime',
                              width: 120,
                              ellipsis: true
                            },
                            {
                              title: '操作',
                              key: 'action',
                              width: 100,
                              fixed: 'right',
                              render: (_, record) => (
                                <Space size="small">
                                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditWorkflow(record)} />
                                  <Button type="link" size="small" icon={<DeleteOutlined />} danger onClick={() => handleDeleteWorkflow(record)} />
                                </Space>
                              )
                            }
                          ]}
                          dataSource={pgCompareMode ? filteredWorkflowListRight : filteredWorkflowList}
                          pagination={false}
                          scroll={{ x: 790 }}
                          style={{
                            width: '100%'
                          }}
                          onRow={(record) => ({
                            onClick: () => pgCompareMode ? handleWorkflowRowClickRight(record) : handleWorkflowRowClick(record),
                            style: { cursor: 'pointer' }
                          })}
                          rowClassName={(record) => (pgCompareMode ? record.key === selectedWorkflowKeyRight : record.key === selectedWorkflowKey) ? 'workflow-row-selected' : ''}
                          locale={{ emptyText: '暂无工作流配置，点击上方"+"按钮新增' }}
                        />
                      </div>

                      {/* 下半部分：测评配置区 */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 8,
                        paddingTop: 8,
                        borderTop: '1px solid #add8e6',
                        flex: '0 0 auto'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>测评配置区</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {/* 复制的顶部字段：工作流队列与主要筛选（置于提示词上方） */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 0 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                              <span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f' }}>*</span> 工作流队列</span>
                              <span style={{ fontWeight: 600 }}>科目</span>
                              <span style={{ fontWeight: 600 }}>题型</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                              <div>
                                  <Select
                                  placeholder="请选择工作流队列"
                                  style={{ width: '100%' }}
                                  value={wfQueue}
                                  onChange={setWfQueue}
                                  allowClear
                                >
                                  <Option value="评分默认队列 (wf.correction.default)">评分默认队列 (wf.correction.default)</Option>
                                  <Option value="OCR默认队列 (wf.ocr.default)">OCR默认队列 (wf.ocr.default)</Option>
                                  <Option value="通用默认队列 (wf.general.default)">通用默认队列 (wf.general.default)</Option>
                                </Select>
                              </div>
                              <div>
                                <Select
                                  placeholder="请选择科目"
                                  style={{ width: '100%' }}
                                  value={wfPrimarySubject}
                                  onChange={setWfPrimarySubject}
                                  allowClear
                                >
                                  {TAG_SUBJECTS.map(s => (<Option key={s} value={s}>{s}</Option>))}
                                </Select>
                              </div>
                              <div>
                                <Select
                                  placeholder="请选择题型"
                                  style={{ width: '100%' }}
                                  value={wfPrimaryType}
                                  onChange={setWfPrimaryType}
                                  allowClear
                                >
                                  {TAG_TYPES.map(t => (<Option key={t} value={t}>{t}</Option>))}
                                </Select>
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 'bold' }}>提示词</div>
                          <Input.TextArea 
                            placeholder="请输入提示词" 
                            autoSize={{ minRows: 6, maxRows: 16 }} 
                            allowClear
                            value={pgCompareMode ? promptTextRight : promptText}
                            onChange={(e) => pgCompareMode ? setPromptTextRight(e.target.value) : setPromptText(e.target.value)}
                            style={{ width: '100%' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' }}>
                              <span>已选<span style={{ color: '#ff4d4f' }}>{(pgCompareMode ? selectedDatasetCountRight : selectedDatasetCount) || 0}</span>条</span>
                              <div>{{ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey] || '-'}</div>
                              <div>数据集</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button icon={<AIFolderIcon />} style={{ width: 140 }} onClick={() => { if (pgCompareMode) setDatasetSelectSide('right'); setDatasetBatchSelectMode(true); setDatasetDrawerOpen(true) }}>选择数据集</Button>
                <Button icon={<AIRunIcon />} type="primary" style={{ width: 100 }} disabled={pgCompareMode ? !canRunRight : !canRunNormal} onClick={pgCompareMode ? handleRunRight : handleRunNormal}>运行</Button>
              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* 右列拖拽分隔条（比较模式） */}
                {pgCompareMode && pgTopRightHeightPx != null && (
                  <div
                    onMouseDown={() => setPgIsResizingRight(true)}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: (pgTopRightHeightPx - 2),
                      height: 4,
                      cursor: 'row-resize',
                      background: '#e6f2ff',
                      zIndex: 2
                    }}
                  />
                )}

                {/* 右侧结果预览区 */}
                <Card
                  size="small"
                  title={pgPreviewCollapsed ? null : <span>结果预览区</span>}
                  extra={!pgCompareMode ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Tooltip title="历史测试记录">
                        <Button
                          type="default"
                          icon={<HistoryOutlined />}
                          onClick={() => setHistoryDrawerOpen(true)}
                          style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                        />
                      </Tooltip>
                      <Tooltip 
                        title={pgPreviewCollapsed ? '展开结果预览区' : '收起结果预览区'} 
                        trigger="hover"
                        open={tipPreviewToggleOpen}
                        onOpenChange={setTipPreviewToggleOpen}
                        mouseEnterDelay={0}
                        mouseLeaveDelay={0}
                        destroyTooltipOnHide
                      >
                        <Button
                          type="default"
                          icon={pgPreviewCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                          onClick={() => { setPgPreviewCollapsed(v => !v); setTipPreviewToggleOpen(false) }}
                          style={{ borderRadius: 8, background: 'transparent', borderColor: 'transparent', color: '#1f2937', width: 'auto', minWidth: 'auto' }}
                        />
                      </Tooltip>
                    </div>
                  ) : null}
                  styles={{
                    body: { padding: pgPreviewCollapsed ? 0 : 12 }
                  }}
                  style={{ 
                    flex: '1 1 auto',
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'flex 0.3s ease', 
                    minWidth: 0,
                    borderTopLeftRadius: 0,
                    borderRadius: pgCompareMode ? 0 : undefined,
                    minHeight: 0
                  }}
                >
                  {!pgPreviewCollapsed && (
                    <div style={{ display: 'flex', gap: 12, height: '100%' }}>
            <div style={{ flex: 1, borderRadius: pgCompareMode ? 0 : 8, overflowX: 'auto', overflowY: 'auto', minWidth: 0, maxHeight: '70vh' }}>
              {renderPreview(runOutputRight, { textCount: previewDatasetIdsRight?.length || 0, imageCount: previewDatasetImageIdsRight?.length || 0, datasetTabKey, startTime: new Date().toISOString(), endTime: new Date().toISOString() })}
            </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            tableLayout="fixed"
            scroll={{ x: 'max-content', y: tableHeight }}
            components={{ body: { cell: (props) => (<td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />) } }}
            pagination={{
              total: filteredData.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
            }}
            rowSelection={{
              type: 'checkbox',
              fixed: 'left',
              columnWidth: 60,
              onChange: (selectedRowKeys, selectedRows) => {
                console.log('选中的行:', selectedRowKeys, selectedRows)
              },
            }}
          />
        )}
      </Card>

      {/* 编辑模态框 */}
      <Modal
        title="编辑教辅资料"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="名称"
                name="name"
                rules={[{ required: true, message: '请输入名称' }]}
              >
                <Input placeholder="请输入名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="作者"
                name="author"
                rules={[{ required: true, message: '请输入作者' }]}
              >
                <Input placeholder="请输入作者" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="出版社"
                name="publisher"
                rules={[{ required: true, message: '请输入出版社' }]}
              >
                <Input placeholder="请输入出版社" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="学科"
                name="subject"
                rules={[{ required: true, message: '请选择学科' }]}
              >
                <Select placeholder="请选择学科">
                  <Option value="语文">语文</Option>
                  <Option value="数学">数学</Option>
                  <Option value="英语">英语</Option>
                  <Option value="物理">物理</Option>
                  <Option value="化学">化学</Option>
                  <Option value="生物">生物</Option>
                  <Option value="历史">历史</Option>
                  <Option value="地理">地理</Option>
                  <Option value="政治">政治</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="年级"
                name="grade"
                rules={[{ required: true, message: '请选择年级' }]}
              >
                <Select placeholder="请选择年级">
                  <Option value="一年级">一年级</Option>
                  <Option value="二年级">二年级</Option>
                  <Option value="三年级">三年级</Option>
                  <Option value="四年级">四年级</Option>
                  <Option value="五年级">五年级</Option>
                  <Option value="六年级">六年级</Option>
                  <Option value="七年级">七年级</Option>
                  <Option value="八年级">八年级</Option>
                  <Option value="九年级">九年级</Option>
                  <Option value="高一">高一</Option>
                  <Option value="高二">高二</Option>
                  <Option value="高三">高三</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="版本"
                name="version"
                rules={[{ required: true, message: '请选择版本' }]}
              >
                <Select placeholder="请选择版本">
                  <Option value="人教版">人教版</Option>
                  <Option value="苏教版">苏教版</Option>
                  <Option value="北师大版">北师大版</Option>
                  <Option value="沪教版">沪教版</Option>
                  <Option value="鲁教版">鲁教版</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="简介"
            name="description"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="请输入简介" 
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
          open={false}
          title="从作业中选择"
          onCancel={() => { setSelectFlowVisible(false) }}
          footer={[
            <Button key="cancel" onClick={() => setSelectFlowVisible(false)}>取消</Button>,
            selectFlowStep < 3 ? (
              <Button key="next" type="primary" onClick={() => setSelectFlowStep(s => Math.min(3, s + 1))}>下一步</Button>
            ) : (
              <Button key="done" type="primary" onClick={() => { setSelectFlowVisible(false); setDatasetAddCardsReady(true) }}>完成</Button>
            )
          ]}
        >
          {selectFlowStep === 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>步骤一：选择学校</div>
              <Select style={{ width: '100%' }} placeholder="选择教育机构" value={selectFlowOrg} onChange={setSelectFlowOrg} showSearch allowClear>
                {['机构A','机构B','机构C'].map(o => (<Option key={o} value={o}>{o}</Option>))}
              </Select>
            </div>
          )}
          {selectFlowStep === 1 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>步骤二：选择学科组</div>
              <Select style={{ width: '100%' }} placeholder="选择学科组" value={selectFlowGroup} onChange={setSelectFlowGroup} showSearch allowClear>
                {['中职三年级语文学科组','高三理科学科组','初中英语学科组','高二数学学科组'].map(o => (<Option key={o} value={o}>{o}</Option>))}
              </Select>
            </div>
          )}
          {selectFlowStep === 2 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>步骤三：选择作业</div>
              <Select style={{ width: '100%' }} placeholder="选择作业" value={selectFlowHomework} onChange={setSelectFlowHomework} showSearch allowClear>
                {['深度学习系统试题','高三语文作文训练','数学综合练习','英语阅读训练','历史材料题作业','地理综合作业','物理实验数据分析','化学方程式练习'].map(o => (<Option key={o} value={o}>{o}</Option>))}
              </Select>
            </div>
          )}
          
        </Modal>

        <Modal
          open={datasetAddImportVisible}
          title="从本地导入"
          onCancel={() => { setDatasetAddImportVisible(false) }}
          onOk={handleDatasetImportConfirm}
          width={600}
          okText="导入"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>数据集类型</div>
            <Select 
              value={datasetAddImportType} 
              onChange={setDatasetAddImportType}
              style={{ width: '100%' }}
            >
              <Option value="通用批阅">通用批阅</Option>
              <Option value="作文评分">作文评分</Option>
              <Option value="手阅登分">手阅登分</Option>
              <Option value="OCR识别">OCR识别</Option>
              <Option value="图片打分">图片打分</Option>
            </Select>
          </div>


          


          {/* 类型特定的输入字段 */}
          {datasetAddImportType === '通用批阅' && (
            <div style={{ marginTop: 12 }}>

              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 学生作答</div>
              <Input 
                placeholder="请输入学生作答" 
                value={datasetAddImportFields.studentAnswer || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, studentAnswer: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', datasetAddImportFields.studentAnswer)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 原题</div>
              <Input 
                placeholder="请输入原题" 
                value={datasetAddImportFields.originalQuestion || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, originalQuestion: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', datasetAddImportFields.originalQuestion)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 正确答案</div>
              <Input 
                placeholder="请输入正确答案" 
                value={datasetAddImportFields.correctAnswer || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, correctAnswer: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', datasetAddImportFields.correctAnswer)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 满分分数</div>
              <Input 
                placeholder="请输入满分分数" 
                value={datasetAddImportFields.fullScore || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, fullScore: e.target.value})}
                style={{ marginBottom: 8 }} 
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Ground Truth</div>
              <Input 
                placeholder="请输入Ground Truth（可选）" 
                value={datasetAddImportFields.groundTruth || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, groundTruth: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddImportFields.groundTruth)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>添加标签</div>
              <Select 
                mode="multiple" 
                placeholder="批量打标签" 
                value={datasetAddImportFields.tags || []}
                onChange={(value) => setDatasetAddImportFields({...datasetAddImportFields, tags: value})}
                style={{ width: '100%', marginBottom: 8 }}
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddImportFields.tagInput || ''}
                        onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, tagInput: e.target.value})}
                        onPressEnter={() => {
                          const v = (datasetAddImportFields.tagInput || '').trim();
                          if (v && !datasetAddImportFields.tags?.includes(v)) {
                            setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                          }
                        }}
                      />
                      <Button type="link" onClick={() => {
                        const v = (datasetAddImportFields.tagInput || '').trim();
                        if (v && !datasetAddImportFields.tags?.includes(v)) {
                          setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                        }
                      }}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {GENERAL_GRADING_TAGS.filter(isTagAllowed).map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </div>
          )}

          {datasetAddImportType === '作文评分' && (
            <div style={{ marginTop: 12 }}>

              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 学生作答</div>
              <Input 
                placeholder="请输入学生作答" 
                value={datasetAddImportFields.studentAnswer || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, studentAnswer: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', datasetAddImportFields.studentAnswer)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 评分标准</div>
              <Input 
                placeholder="请输入评分标准" 
                value={datasetAddImportFields.gradingStandard || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, gradingStandard: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('评分标准', datasetAddImportFields.gradingStandard)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 原题</div>
              <Input 
                placeholder="请输入原题" 
                value={datasetAddImportFields.originalQuestion || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, originalQuestion: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', datasetAddImportFields.originalQuestion)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 满分分数</div>
              <Input 
                placeholder="请输入满分分数" 
                value={datasetAddImportFields.fullScore || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, fullScore: e.target.value})}
                style={{ marginBottom: 8 }} 
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Ground Truth</div>
              <Input 
                placeholder="请输入Ground Truth（可选）" 
                value={datasetAddImportFields.groundTruth || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, groundTruth: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddImportFields.groundTruth)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>添加标签</div>
              <Select 
                mode="multiple" 
                placeholder="批量打标签" 
                value={datasetAddImportFields.tags || []}
                onChange={(value) => setDatasetAddImportFields({...datasetAddImportFields, tags: value})}
                style={{ width: '100%', marginBottom: 8 }}
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddImportFields.tagInput || ''}
                        onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, tagInput: e.target.value})}
                        onPressEnter={() => {
                          const v = (datasetAddImportFields.tagInput || '').trim();
                          if (v && !datasetAddImportFields.tags?.includes(v)) {
                            setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                          }
                        }}
                      />
                      <Button type="link" onClick={() => {
                        const v = (datasetAddImportFields.tagInput || '').trim();
                        if (v && !datasetAddImportFields.tags?.includes(v)) {
                          setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                        }
                      }}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {GENERAL_GRADING_TAGS.filter(isTagAllowed).map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </div>
          )}

          {datasetAddImportType === '手阅登分' && (
            <div style={{ marginTop: 12 }}>

              
              {/* 图片上传区域 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 图片上传</div>
                <Upload.Dragger 
                  multiple 
                  fileList={datasetUploadList} 
                  beforeUpload={() => false} 
                  onChange={({ fileList }) => setDatasetUploadList(fileList)}
                >
                  <p className="ant-upload-drag-icon">📁</p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">支持批量上传</p>
                </Upload.Dragger>
              </div>
              
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 满分分数</div>
              <Input 
                placeholder="请输入满分分数" 
                value={datasetAddImportFields.fullScore || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, fullScore: e.target.value})}
                style={{ marginBottom: 8 }} 
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Ground Truth</div>
              <Input 
                placeholder="请输入Ground Truth（可选）" 
                value={datasetAddImportFields.groundTruth || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, groundTruth: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddImportFields.groundTruth)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>添加标签</div>
              <Select 
                mode="multiple" 
                placeholder="批量打标签" 
                value={datasetAddImportFields.tags || []}
                onChange={(value) => setDatasetAddImportFields({...datasetAddImportFields, tags: value})}
                style={{ width: '100%', marginBottom: 8 }}
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddImportFields.tagInput || ''}
                        onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, tagInput: e.target.value})}
                        onPressEnter={() => {
                          const v = (datasetAddImportFields.tagInput || '').trim();
                          if (v && !datasetAddImportFields.tags?.includes(v)) {
                            setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                          }
                        }}
                      />
                      <Button type="link" onClick={() => {
                        const v = (datasetAddImportFields.tagInput || '').trim();
                        if (v && !datasetAddImportFields.tags?.includes(v)) {
                          setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                        }
                      }}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {GENERAL_GRADING_TAGS.filter(isTagAllowed).map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </div>
          )}

          {datasetAddImportType === 'OCR识别' && (
            <div style={{ marginTop: 12 }}>

              
              {/* 图片上传区域 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 图片上传</div>
                <Upload.Dragger 
                  multiple 
                  fileList={datasetUploadList} 
                  beforeUpload={() => false} 
                  onChange={({ fileList }) => setDatasetUploadList(fileList)}
                >
                  <p className="ant-upload-drag-icon">📁</p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">支持批量上传</p>
                </Upload.Dragger>
              </div>
              
              <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 识别结果</div>
              <Input 
                placeholder="请输入识别结果" 
                value={datasetAddImportFields.recognitionResult || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, recognitionResult: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('识别结果', datasetAddImportFields.recognitionResult)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Ground Truth</div>
              <Input 
                placeholder="请输入Ground Truth（可选）" 
                value={datasetAddImportFields.groundTruth || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, groundTruth: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddImportFields.groundTruth)} />}
              />
              <div style={{ fontWeight: 500, marginBottom: 8 }}>添加标签</div>
              <Select 
                mode="multiple" 
                placeholder="批量打标签" 
                value={datasetAddImportFields.tags || []}
                onChange={(value) => setDatasetAddImportFields({...datasetAddImportFields, tags: value})}
                style={{ width: '100%', marginBottom: 8 }}
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddImportFields.tagInput || ''}
                        onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, tagInput: e.target.value})}
                        onPressEnter={() => {
                          const v = (datasetAddImportFields.tagInput || '').trim();
                          if (v && !datasetAddImportFields.tags?.includes(v)) {
                            setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                          }
                        }}
                      />
                      <Button type="link" onClick={() => {
                        const v = (datasetAddImportFields.tagInput || '').trim();
                        if (v && !datasetAddImportFields.tags?.includes(v)) {
                          setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                        }
                      }}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {GENERAL_GRADING_TAGS.filter(isTagAllowed).map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </div>
          )}

          {datasetAddImportType === '图片打分' && (
            <div style={{ marginTop: 12 }}>

              
              {/* 图片上传区域 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 图片上传</div>
                <Upload.Dragger 
                  multiple 
                  fileList={datasetUploadList} 
                  beforeUpload={() => false} 
                  onChange={({ fileList }) => setDatasetUploadList(fileList)}
                >
                  <p className="ant-upload-drag-icon">📁</p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">支持批量上传</p>
                </Upload.Dragger>
              </div>
              
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 原题</div>
              <Input 
                placeholder="请输入原题" 
                value={datasetAddImportFields.originalQuestion || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, originalQuestion: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', datasetAddImportFields.originalQuestion)} />}
              />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 正确答案</div>
              <Input 
                placeholder="请输入正确答案" 
                value={datasetAddImportFields.correctAnswer || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, correctAnswer: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', datasetAddImportFields.correctAnswer)} />}
              />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}><span style={{ color: 'red' }}>*</span> 满分分数</div>
                <Input 
                  placeholder="请输入满分分数" 
                  value={datasetAddImportFields.fullScore || ''}
                  onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, fullScore: e.target.value})}
                  style={{ marginBottom: 8 }} 
                />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Ground Truth</div>
              <Input 
                placeholder="请输入Ground Truth（可选）" 
                value={datasetAddImportFields.groundTruth || ''}
                onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, groundTruth: e.target.value})}
                style={{ marginBottom: 8 }} 
                suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddImportFields.groundTruth)} />}
              />
              </div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>添加标签</div>
              <Select 
                mode="multiple" 
                placeholder="批量打标签" 
                value={datasetAddImportFields.tags || []}
                onChange={(value) => setDatasetAddImportFields({...datasetAddImportFields, tags: value})}
                style={{ width: '100%', marginBottom: 8 }}
                allowClear
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddImportFields.tagInput || ''}
                        onChange={(e) => setDatasetAddImportFields({...datasetAddImportFields, tagInput: e.target.value})}
                        onPressEnter={() => {
                          const v = (datasetAddImportFields.tagInput || '').trim();
                          if (v && !datasetAddImportFields.tags?.includes(v)) {
                            setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                          }
                        }}
                      />
                      <Button type="link" onClick={() => {
                        const v = (datasetAddImportFields.tagInput || '').trim();
                        if (v && !datasetAddImportFields.tags?.includes(v)) {
                          setDatasetAddImportFields({...datasetAddImportFields, tags: [...(datasetAddImportFields.tags || []), v], tagInput: ''});
                        }
                      }}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {GENERAL_GRADING_TAGS.filter(isTagAllowed).map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
            </div>
          )}
        </Modal>

      {/* 新增工作流配置弹窗 */}
      <Modal
        title="新增测试工作流"
        open={wfCreateModalVisible}
        onOk={handleWfCreateConfirm}
        onCancel={handleWfCreateCancel}
        width={720}
        okText="创建"
        cancelText="取消"
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 工作流队列 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f' }}>*</span> 工作流队列</span>
            <Select
              placeholder="请选择工作流队列"
              style={{ width: '100%' }}
              value={wfQueue}
              onChange={setWfQueue}
            >
              <Option value="评分默认队列 (wf.correction.default)">评分默认队列 (wf.correction.default)</Option>
              <Option value="OCR默认队列 (wf.ocr.default)">OCR默认队列 (wf.ocr.default)</Option>
              <Option value="通用默认队列 (wf.general.default)">通用默认队列 (wf.general.default)</Option>
            </Select>
          </div>

          {/* 主要筛选 */}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ fontWeight: 600 }}><span style={{ color: '#ff4d4f' }}>*</span> 主要筛选</span>
              <Select
                placeholder="请选择学科"
                style={{ width: '100%' }}
                value={wfPrimarySubject}
                onChange={setWfPrimarySubject}
              >
                {TAG_SUBJECTS.map(s => (<Option key={s} value={s}>{s}</Option>))}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ visibility: 'hidden' }}>主要筛选</span>
              <Select
                placeholder="请选择题型"
                style={{ width: '100%' }}
                value={wfPrimaryType}
                onChange={setWfPrimaryType}
              >
                {TAG_TYPES.map(t => (<Option key={t} value={t}>{t}</Option>))}
              </Select>
            </div>
          </div>

          {/* 次要筛选 */}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ fontWeight: 500 }}>次要筛选</span>
              <Select
                placeholder="所有年级"
                style={{ width: '100%' }}
                value={wfGrade}
                onChange={setWfGrade}
              >
                {['所有年级', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '初中', '高中'].map(g => (<Option key={g} value={g}>{g}</Option>))}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ visibility: 'hidden' }}>次要筛选</span>
              <Select
                placeholder="所有教育机构"
                style={{ width: '100%' }}
                value={wfOrg}
                onChange={setWfOrg}
              >
                {['所有教育机构', '机构A', '机构B', '机构C'].map(o => (<Option key={o} value={o}>{o}</Option>))}
              </Select>
            </div>
          </div>

          {/* 工作流名称（由选择自动组成） */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ fontWeight: 500 }}>工作流名称</span>
            <Input
              placeholder="根据选择自动生成"
              style={{ width: '100%' }}
              value={wfName}
              readOnly
            />
          </div>

          {/* 提示词 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ fontWeight: 500 }}>提示词</span>
            <Input.TextArea
              placeholder="请输入处理提示词，可多行输入"
              style={{ width: '100%' }}
              allowClear
              value={wfPrompt}
              onChange={(e) => setWfPrompt(e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </Modal>

      {/* 编辑工作流配置弹窗 */}
      <Modal
        title="编辑工作流配置"
        open={wfEditModalVisible}
        onOk={handleWfEditConfirm}
        onCancel={handleWfEditCancel}
        width={720}
        okText="保存"
        cancelText="取消"
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 顶部字段：名称与类别（响应式同排） */}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            {/* 工作流名称 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ minWidth: 80, fontWeight: 500 }}>工作流名称</span>
              <Input
                placeholder="请输入工作流名称"
                style={{ width: '100%' }}
                value={editingWorkflow?.name || ''}
                onChange={(e) => setEditingWorkflow(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* 工作流类别 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <span style={{ minWidth: 80, fontWeight: 500 }}>工作流类别</span>
              <Select
                placeholder="请选择工作流类别"
                style={{ width: '100%' }}
                value={editingWorkflow?.type}
                onChange={(value) => setEditingWorkflow(prev => ({ ...prev, type: value }))}
              >
                <Option value="OCR工作流">OCR工作流</Option>
                <Option value="批改工作流">批改工作流</Option>
                <Option value="多模态工作流">多模态工作流</Option>
              </Select>
            </div>
          </div>

          {/* 科目和题型 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <span style={{ minWidth: 80, fontWeight: 500 }}>科目和题型</span>
            
            <div style={{ padding: '12px', borderRadius: '6px', border: '1px solid #d9d9d9', width: '100%' }}>
              {/* 语文复选框组 */}
              <div style={{ backgroundColor: editingWorkflow?.subjects?.some(s => ['默写', '作文题', '文言文', '微写作', '语义相近'].includes(s)) ? '#e6f7ff' : '#fafafa', padding: '8px', borderRadius: '8px', border: editingWorkflow?.subjects?.some(s => ['默写', '作文题', '文言文', '微写作', '语义相近'].includes(s)) ? '1px solid #1890ff' : '1px solid #e5e7eb', width: '100%', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px 10px', minHeight: 32, gap: 8 }}>
                      <Checkbox
                        checked={editingWorkflow?.subjects?.some(s => ['默写', '作文题', '文言文', '微写作', '语义相近'].includes(s))}
                        indeterminate={editingWorkflow?.subjects?.some(s => ['默写', '作文题', '文言文', '微写作', '语义相近'].includes(s)) && editingWorkflow?.subjects?.filter(s => ['默写', '作文题', '文言文', '微写作', '语义相近'].includes(s)).length < 5}
                        onChange={(e) => {
                          const chineseSubjects = ['默写', '作文题', '文言文', '微写作', '语义相近']
                          const currentSubjects = editingWorkflow?.subjects || []
                          const otherSubjects = currentSubjects.filter(s => !chineseSubjects.includes(s))
                          
                          if (e.target.checked) {
                            setEditingWorkflow(prev => ({ ...prev, subjects: [...otherSubjects, ...chineseSubjects] }))
                          } else {
                            setEditingWorkflow(prev => ({ ...prev, subjects: otherSubjects }))
                          }
                        }}
                      />
                      <span style={{ cursor: 'pointer' }}>语文</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%' }}>
                    <Checkbox 
                      value="默写" 
                      checked={editingWorkflow?.subjects?.includes('默写')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '默写'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '默写') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >默写</Checkbox>
                    <Checkbox 
                      value="作文题" 
                      checked={editingWorkflow?.subjects?.includes('作文题')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '作文题'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '作文题') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >作文题</Checkbox>
                    <Checkbox 
                      value="文言文" 
                      checked={editingWorkflow?.subjects?.includes('文言文')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '文言文'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '文言文') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >文言文</Checkbox>
                    <Checkbox 
                      value="微写作" 
                      checked={editingWorkflow?.subjects?.includes('微写作')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '微写作'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '微写作') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >微写作</Checkbox>
                    <Checkbox 
                      value="语义相近" 
                      checked={editingWorkflow?.subjects?.includes('语义相近')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '语义相近'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '语义相近') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0, gridColumn: '1 / -1' }}
                    >语义相近</Checkbox>
                  </div>
                </div>
              </div>

              {/* 数学复选框组 */}
              <div style={{ backgroundColor: editingWorkflow?.subjects?.some(s => ['填空题', '简答题'].includes(s)) ? '#e6f7ff' : '#fafafa', padding: '8px', borderRadius: '8px', border: editingWorkflow?.subjects?.some(s => ['填空题', '简答题'].includes(s)) ? '1px solid #1890ff' : '1px solid #e5e7eb', width: '100%', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px 10px', minHeight: 32, gap: 8 }}>
                      <Checkbox
                        checked={editingWorkflow?.subjects?.some(s => ['填空题', '简答题'].includes(s))}
                        indeterminate={editingWorkflow?.subjects?.some(s => ['填空题', '简答题'].includes(s)) && editingWorkflow?.subjects?.filter(s => ['填空题', '简答题'].includes(s)).length < 2}
                        onChange={(e) => {
                          const mathSubjects = ['填空题', '简答题']
                          const currentSubjects = editingWorkflow?.subjects || []
                          const otherSubjects = currentSubjects.filter(s => !mathSubjects.includes(s))
                          
                          if (e.target.checked) {
                            setEditingWorkflow(prev => ({ ...prev, subjects: [...otherSubjects, ...mathSubjects] }))
                          } else {
                            setEditingWorkflow(prev => ({ ...prev, subjects: otherSubjects }))
                          }
                        }}
                      />
                      <span style={{ cursor: 'pointer' }}>数学</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%' }}>
                    <Checkbox 
                      value="填空题" 
                      checked={editingWorkflow?.subjects?.includes('填空题')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '填空题'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '填空题') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >填空题</Checkbox>
                    <Checkbox 
                      value="简答题" 
                      checked={editingWorkflow?.subjects?.includes('简答题')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '简答题'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '简答题') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >简答题</Checkbox>
                  </div>
                </div>
              </div>

              {/* 英语复选框组 */}
              <div style={{ backgroundColor: editingWorkflow?.subjects?.some(s => ['默写', '翻译', '作文', '填空题', '简单题'].includes(s)) ? '#e6f7ff' : '#fafafa', padding: '8px', borderRadius: '8px', border: editingWorkflow?.subjects?.some(s => ['默写', '翻译', '作文', '填空题', '简单题'].includes(s)) ? '1px solid #1890ff' : '1px solid #e5e7eb', width: '100%', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px 10px', minHeight: 32, gap: 8 }}>
                      <Checkbox
                        checked={editingWorkflow?.subjects?.some(s => ['默写', '翻译', '作文', '填空题', '简单题'].includes(s))}
                        indeterminate={editingWorkflow?.subjects?.some(s => ['默写', '翻译', '作文', '填空题', '简单题'].includes(s)) && editingWorkflow?.subjects?.filter(s => ['默写', '翻译', '作文', '填空题', '简单题'].includes(s)).length < 5}
                        onChange={(e) => {
                          const englishSubjects = ['默写', '翻译', '作文', '填空题', '简单题']
                          const currentSubjects = editingWorkflow?.subjects || []
                          const otherSubjects = currentSubjects.filter(s => !englishSubjects.includes(s))
                          
                          if (e.target.checked) {
                            setEditingWorkflow(prev => ({ ...prev, subjects: [...otherSubjects, ...englishSubjects] }))
                          } else {
                            setEditingWorkflow(prev => ({ ...prev, subjects: otherSubjects }))
                          }
                        }}
                      />
                      <span style={{ cursor: 'pointer' }}>英语</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', width: '100%' }}>
                    <Checkbox 
                      value="默写" 
                      checked={editingWorkflow?.subjects?.includes('默写')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '默写'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '默写') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >默写</Checkbox>
                    <Checkbox 
                      value="翻译" 
                      checked={editingWorkflow?.subjects?.includes('翻译')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '翻译'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '翻译') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >翻译</Checkbox>
                    <Checkbox 
                      value="作文" 
                      checked={editingWorkflow?.subjects?.includes('作文')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '作文'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '作文') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >作文</Checkbox>
                    <Checkbox 
                      value="填空题" 
                      checked={editingWorkflow?.subjects?.includes('填空题')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '填空题'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '填空题') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0 }}
                    >填空题</Checkbox>
                    <Checkbox 
                      value="简单题" 
                      checked={editingWorkflow?.subjects?.includes('简单题')} 
                      onChange={(e) => {
                        const currentSubjects = editingWorkflow?.subjects || []
                        if (e.target.checked) {
                          setEditingWorkflow(prev => ({ ...prev, subjects: [...currentSubjects, '简单题'] }))
                        } else {
                          setEditingWorkflow(prev => ({ ...prev, subjects: currentSubjects.filter(item => item !== '简单题') }))
                        }
                      }} 
                      style={{ padding: '4px 8px', margin: 0, gridColumn: '1 / -1' }}
                    >简单题</Checkbox>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 模型配置标签 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%', marginTop: 12 }}>
            <span style={{ minWidth: 80, fontWeight: 500 }}>模型配置</span>
          </div>

          {/* 模型配置下拉框 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 12 }}>
            {/* 三项标签同排，选择框在其下方同排 */}
            <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>基础检测模型(可选)</span>
                <Select placeholder="请选择基础检测模型" style={{ width: '100%' }} allowClear>
                  <Option value="model1">模型1</Option>
                  <Option value="model2">模型2</Option>
                  <Option value="model3">模型3</Option>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>特定检测模型(可选)</span>
                <Select placeholder="请选择特定检测模型" style={{ width: '100%' }} allowClear>
                  <Option value="special1">特定模型1</Option>
                  <Option value="special2">特定模型2</Option>
                  <Option value="special3">特定模型3</Option>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>第二特定检测模型(可选)</span>
                <Select placeholder="请选择第二特定检测模型" style={{ width: '100%' }} allowClear>
                  <Option value="second1">第二模型1</Option>
                  <Option value="second2">第二模型2</Option>
                  <Option value="second3">第二模型3</Option>
                </Select>
              </div>
            </div>

            {/* OCR标签同排，选择框在其下方同排 */}
            <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>OCR模型(可选)</span>
                <Select placeholder="请选择OCR模型" style={{ width: '100%' }} allowClear>
                  <Option value="ocr1">OCR模型1</Option>
                  <Option value="ocr2">OCR模型2</Option>
                  <Option value="ocr3">OCR模型3</Option>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>OCR提示词</span>
                <Select placeholder="请选择OCR提示词" style={{ width: '100%' }} allowClear>
                  <Option value="prompt1">标准OCR识别提示词</Option>
                  <Option value="prompt2">手写体OCR识别提示词</Option>
                  <Option value="prompt3">表格OCR识别提示词</Option>
                  <Option value="prompt4">数学公式OCR识别提示词</Option>
                </Select>
              </div>
            </div>

            {/* 批改标签同排，选择框在其下方同排 */}
            <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>批改模型(可选)</span>
                <Select placeholder="请选择批改模型" style={{ width: '100%' }} allowClear>
                  <Option value="grading1">批改模型1</Option>
                  <Option value="grading2">批改模型2</Option>
                  <Option value="grading3">批改模型3</Option>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <span style={{ fontWeight: 500 }}>批改提示词</span>
                <Select placeholder="请选择批改提示词" style={{ width: '100%' }} allowClear>
                  <Option value="grading_prompt1">标准批改提示词</Option>
                  <Option value="grading_prompt2">作文批改提示词</Option>
                  <Option value="grading_prompt3">数学题批改提示词</Option>
                  <Option value="grading_prompt4">选择题批改提示词</Option>
                </Select>
              </div>
            </div>
          </div>

        </div>
      </Modal>

      {/* 新增数据集抽屉 */}
      <Drawer
        title={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleDatasetAddCancel} />
            <span>新增数据集</span>
          </div>
        )}
        open={datasetAddModalVisible}
        placement="right"
        width="100%"
        closable={false}
        onClose={handleDatasetAddCancel}
        styles={{ body: { padding: 16, maxHeight: 'calc(100vh - 64px)', overflow: 'auto' } }}
      >
        <Form form={datasetForm} layout="vertical">
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: 8 }}>数据集添加方式：</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
            <div
              style={{ border: `2px dashed ${datasetAddHoverSelect ? '#1677ff' : '#d9d9d9'}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: (datasetAddHoverSelect ? '#f0f7ff' : '#fff'), boxShadow: (datasetAddHoverSelect ? '0 0 0 4px rgba(22,119,255,0.15)' : 'none'), transition: 'all .2s ease-in-out' }}
              onMouseEnter={() => setDatasetAddHoverSelect(true)}
              onMouseLeave={() => setDatasetAddHoverSelect(false)}
              onClick={() => { setSelectFlowStep(0); setSelectFlowVisible(true); setDatasetAddTextMode('single') }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
                <FolderOpenOutlined style={{ color: '#10b981' }} />
                <span>从作业中选择</span>
              </div>
              <div style={{ color: '#6b7280' }}>从已有的作业中选择题目创建数据集</div>
            </div>
          <div style={{ position: 'relative' }}>
            <div
              style={{ border: `2px dashed ${datasetAddHoverImport ? '#1677ff' : '#d9d9d9'}`, borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer', background: (datasetAddHoverImport ? '#f0f7ff' : '#fff'), boxShadow: (datasetAddHoverImport ? '0 0 0 4px rgba(22,119,255,0.15)' : 'none'), transition: 'all .2s ease-in-out' }}
              onMouseEnter={() => setDatasetAddHoverImport(true)}
              onMouseLeave={() => setDatasetAddHoverImport(false)}
              onClick={() => { console.log('从本地导入 clicked'); setDatasetAddImportVisible(true); setDatasetAddTextMode('batch') }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
                <UploadOutlined style={{ color: '#1677ff' }} />
                <span>从本地导入</span>
              </div>
              <div style={{ color: '#6b7280' }}>通过弹窗上传文件并填写数据集信息</div>
            </div>
          </div>
          </div>
          
          {selectFlowVisible && (
            <div style={{ border: '1px dashed #1677ff', background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: 220 }}>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>选择教育机构</div>
                  <Select style={{ width: '100%' }} placeholder="选择教育机构" value={selectFlowOrg} onChange={setSelectFlowOrg} showSearch allowClear>
                    {['机构A','机构B','机构C'].map(o => (<Option key={o} value={o}>{o}</Option>))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: 220 }}>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>选择学科组</div>
                  <Select style={{ width: '100%' }} placeholder="选择学科组" value={selectFlowGroup} onChange={setSelectFlowGroup} showSearch allowClear disabled={!selectFlowOrg}>
                    {['中职三年级语文学科组','高三理科学科组','初中英语学科组','高二数学学科组'].map(o => (<Option key={o} value={o}>{o}</Option>))}
                  </Select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', width: 220 }}>
                  <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>选择作业</div>
                  <Select style={{ width: '100%' }} placeholder="选择作业" value={selectFlowHomework} onChange={setSelectFlowHomework} showSearch allowClear disabled={!selectFlowGroup}>
                    {['深度学习系统试题','高三语文作文训练','数学综合练习','英语阅读训练','历史材料题作业','地理综合作业','物理实验数据分析','化学方程式练习'].map(o => (<Option key={o} value={o}>{o}</Option>))}
                  </Select>
                </div>
                
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <Button onClick={() => { setSelectFlowVisible(false); setSelectFlowStep(0) }}>取消</Button>
                  <Button type="primary" disabled={!(selectFlowOrg && selectFlowGroup && selectFlowHomework)} onClick={() => { setSelectFlowVisible(false); setDatasetAddCardsReady(true); setSelectFlowStep(0) }}>完成</Button>
                </div>
              </div>
            </div>
          )}
          {datasetAddCardsReady && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 }}>
              <Button
                onClick={() => {
                  const types = datasetAddTypeFilter ? [datasetAddTypeFilter] : ['通用批阅','作文评分','手阅登分','OCR识别','图片打分']
                  const ids = []
                  types.forEach(t => {
                    (previewIds[t] || []).forEach(id => {
                      const st = datasetAddPreviewCheckStatusMap[id] || '未核查'
                      if (!datasetAddStatusFilter || st === datasetAddStatusFilter) ids.push(id)
                    })
                  })
                  setDatasetAddSelectedCardIds(ids)
                }}
              >
                全选
              </Button>
              <Button
                onClick={() => {
                  setDatasetAddSelectedCardIds([])
                }}
              >
                取消选择
              </Button>
              <Select
                mode="multiple"
                placeholder="批量打标签"
                style={{ width: 240 }}
                allowClear
                value={datasetAddBatchSelectedTags}
                onChange={setDatasetAddBatchSelectedTags}
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                      <Input
                        placeholder="输入新标签并回车"
                        value={datasetAddBatchTagInput}
                        onChange={(e) => setDatasetAddBatchTagInput(e.target.value)}
                        onPressEnter={addDatasetAddBatchTagOption}
                      />
                      <Button type="link" onClick={addDatasetAddBatchTagOption}>添加标签</Button>
                    </div>
                  </div>
                )}
              >
                {(datasetTagOptions || [])
                  .filter(isTagAllowed)
                  .map(t => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<TagOutlined />}
                onClick={() => {
                  if (!datasetAddSelectedCardIds || datasetAddSelectedCardIds.length === 0) {
                    messageApi.warning('请先选择卡片')
                    return
                  }
                  if (!datasetAddBatchSelectedTags || datasetAddBatchSelectedTags.length === 0) {
                    messageApi.warning('请选择批量标签')
                    return
                  }
                  setDatasetAddPreviewTagsMap(prev => {
                    const next = { ...prev }
                    datasetAddSelectedCardIds.forEach((id) => {
                      next[id] = [...(datasetAddBatchSelectedTags || [])]
                    })
                    return next
                  })
                  messageApi.success('已设置批量标签')
                }}
              >
                打标签
              </Button>
              <Dropdown
                menu={{
                  items: [
                    { key: '未核查', label: '未核查' },
                    { key: '已核查', label: '已核查' }
                  ],
                  onClick: ({ key }) => {
                    if (!datasetAddSelectedCardIds || datasetAddSelectedCardIds.length === 0) {
                      messageApi.warning('请先选择卡片')
                      return
                    }
                    setDatasetAddPreviewCheckStatusMap(prev => {
                      const next = { ...prev }
                      datasetAddSelectedCardIds.forEach((id) => { next[id] = key })
                      return next
                    })
                    messageApi.success(`已批量更新核查状态：${datasetAddSelectedCardIds.length} 条`)
                  }
                }}
              >
                <Button>改核查状态</Button>
              </Dropdown>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  if (!datasetAddSelectedCardIds || datasetAddSelectedCardIds.length === 0) {
                    messageApi.warning('请先选择卡片')
                    return
                  }
                  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
                  const addRecords = []
                  datasetAddSelectedCardIds.forEach((id) => {
                    const t = previewIdTypeMap[id]
                    const ids = previewIds[t] || []
                    const idx = Array.isArray(ids) ? ids.indexOf(id) : 0
                    const isImage = IMAGE_TYPES.has(t)
                    const base = {
                      key: `added-${t}-${id}`,
                      id,
                      displayId: id,
                      type: isImage ? 'image' : 'text',
                      checkStatus: datasetAddPreviewCheckStatusMap[id] || '未核查',
                      updateTime: now,
                      createTime: now,
                      creator: '系统管理员',
                      tags: datasetAddPreviewTagsMap[id] || []
                    }
                    if (!isImage) {
                      const isEssay = t === '作文评分'
                      addRecords.push({
                        ...base,
                        input: isEssay ? `示例作文文本${idx + 1}` : `学生作答示例${idx + 1}`,
                        question: `原题示例${idx + 1}`,
                        correctAnswer: `正确答案示例${idx + 1}`,
                        fullScore: isEssay ? 20 : 100,
                        imageUrl: undefined
                      })
                    } else {
                      const imgTitle = t === '手阅登分' ? `手阅登分预览图${idx + 1}` : t === 'OCR识别' ? `OCR识别预览图${idx + 1}` : `图片打分预览图${idx + 1}`
                      addRecords.push({
                        ...base,
                        input: `图片：${imgTitle}.png`,
                        question: '',
                        correctAnswer: '',
                        fullScore: '',
                        imageUrl: svgPlaceholder(imgTitle),
                        recognition: t === 'OCR识别' ? '识别文字示例' : undefined
                      })
                    }
                  })
                  setDatasetData(prev => {
                    const existingIds = new Set(prev.map(r => String(r.id)))
                    const uniqueToAdd = addRecords.filter(r => !existingIds.has(String(r.id)))
                    const next = [...uniqueToAdd, ...prev]
                    const added = uniqueToAdd.length
                    const repeated = addRecords.length - added
                    messageApi.success(`已加入数据集：新增 ${added} 条，重复 ${repeated} 条`)
                    return next
                  })
                }}
              >
                数据集
              </Button>
            </div>
          )}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f7f9fc' }}>
            
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 8 }}>
            <Col span={24}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, width: '100%' }}>
                  <Select
                    mode="multiple"
                    showSearch
                    allowClear
                    placeholder="搜索标签"
                    style={{ width: 200 }}
                    value={datasetAddTagKeywords}
                    onChange={(v) => setDatasetAddTagKeywords(Array.isArray(v) ? v : (v ? [v] : []))}
                  >
                    {(datasetTagOptions || []).filter(isTagAllowed).map(t => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Select>
                <Select
                  showSearch
                  allowClear
                  placeholder="搜索数据集类型"
                  style={{ width: 160 }}
                  value={datasetAddTypeFilter}
                  onChange={setDatasetAddTypeFilter}
                >
                  <Option value="通用批阅">通用批阅</Option>
                  <Option value="作文评分">作文评分</Option>
                  <Option value="手阅登分">手阅登分</Option>
                  <Option value="OCR识别">OCR识别</Option>
                  <Option value="图片打分">图片打分</Option>
                </Select>
                <Select
                  allowClear
                  placeholder="搜索核查状态"
                  style={{ width: 140 }}
                  value={datasetAddStatusFilter}
                  onChange={setDatasetAddStatusFilter}
                >
                  <Option value="未核查">未核查</Option>
                  <Option value="已核查">已核查</Option>
                </Select>
              </div>
              </Col>
          </Row>
          {datasetAddCardsReady && (
            <div style={{ marginTop: 8 }}>
              <div style={{ width: '100%', minHeight: 0, overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 300px)', gap: 12, width: 'max-content' }}>
                {(!datasetAddTypeFilter || datasetAddTypeFilter === '通用批阅') && ([0, 1]
                  .filter((idx) => !datasetAddStatusFilter || (datasetAddPreviewCheckStatusMap[previewIds['通用批阅'][idx]] || '未核查') === datasetAddStatusFilter)
                  .filter((idx) => cardMatchesTagKeyword(previewIds['通用批阅'][idx]))
                  .filter((idx) => cardMatchesExtraFilters(previewIds['通用批阅'][idx]))
                  .map((idx) => (
                  <Card key={`通用批阅-${idx}`} hoverable size="small" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Checkbox
                        checked={datasetAddSelectedCardIds.includes(previewIds['通用批阅'][idx])}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const cardId = previewIds['通用批阅'][idx]
                          setDatasetAddSelectedCardIds((prev) => {
                            const set = new Set(prev)
                            if (checked) set.add(cardId); else set.delete(cardId)
                            return Array.from(set)
                          })
                        }}
                      />
                    </div>
                    <div style={{ position: 'absolute', top: 5, right: -28, width: 90, background: (datasetAddPreviewCheckStatusMap[previewIds['通用批阅'][idx]] === '已核查' ? '#10b981' : '#f59e0b'), color: '#fff', textAlign: 'center', padding: '1px 0', fontSize: 10, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 3 }}>{datasetAddPreviewCheckStatusMap[previewIds['通用批阅'][idx]] || '未核查'}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>通用批阅</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                      <Input 
                        value={`示例学生作答文本${idx + 1}`}
                        readOnly
                        placeholder="学生作答"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', `示例学生作答文本${idx + 1}`)} />}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                      <Input 
                        value={`示例原题${idx + 1}`}
                        readOnly
                        placeholder="原题"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', `示例原题${idx + 1}`)} />}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                      <Input 
                        value={`示例答案${idx + 1}`}
                        readOnly
                        placeholder="正确答案"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', `示例答案${idx + 1}`)} />}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                      <Input 
                        value={'100'} 
                        readOnly 
                        placeholder="满分分数" 
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', '100')} />} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth：</span>
                      <Input
                        value={datasetAddPreviewGroundTruthMap[previewIds['通用批阅'][idx]] || ''}
                        onChange={(e) => setDatasetAddPreviewGroundTruthMap(prev => ({ ...prev, [previewIds['通用批阅'][idx]]: e.target.value }))}
                        placeholder="请输入Ground Truth"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddPreviewGroundTruthMap[previewIds['通用批阅'][idx]] || '')} />}
                      />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>标签：</span>
                      {(getVisiblePreviewTags(previewIds['通用批阅'][idx]) || []).map((t, i2) => (
                        <Tag key={i2} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>核查状态：</span>
                      <Radio.Group
                        value={datasetAddPreviewCheckStatusMap[previewIds['通用批阅'][idx]] || '未核查'}
                        onChange={(e) => setDatasetAddPreviewCheckStatusMap(prev => ({ ...prev, [previewIds['通用批阅'][idx]]: e.target.value }))}
                      >
                        <Radio value="未核查">未核查</Radio>
                        <Radio value="已核查">已核查</Radio>
                      </Radio.Group>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>ID：{previewIds['通用批阅'][idx]}</div>
                    </div>
                  </Card>
                )))}

                {(!datasetAddTypeFilter || datasetAddTypeFilter === '作文评分') && ([0, 1]
                  .filter((idx) => !datasetAddStatusFilter || (datasetAddPreviewCheckStatusMap[previewIds['作文评分'][idx]] || '未核查') === datasetAddStatusFilter)
                  .filter((idx) => cardMatchesTagKeyword(previewIds['作文评分'][idx]))
                  .filter((idx) => cardMatchesExtraFilters(previewIds['作文评分'][idx]))
                  .map((idx) => (
                  <Card key={`作文评分-${idx}`} hoverable size="small" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Checkbox
                        checked={datasetAddSelectedCardIds.includes(previewIds['作文评分'][idx])}
                        onChange={(e) => {
                          const checked = e.target.checked
                          const cardId = previewIds['作文评分'][idx]
                          setDatasetAddSelectedCardIds((prev) => {
                            const set = new Set(prev)
                            if (checked) set.add(cardId); else set.delete(cardId)
                            return Array.from(set)
                          })
                        }}
                      />
                    </div>
                    <div style={{ position: 'absolute', top: 5, right: -28, width: 90, background: (datasetAddPreviewCheckStatusMap[previewIds['作文评分'][idx]] === '已核查' ? '#10b981' : '#f59e0b'), color: '#fff', textAlign: 'center', padding: '1px 0', fontSize: 10, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 3 }}>{datasetAddPreviewCheckStatusMap[previewIds['作文评分'][idx]] || '未核查'}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>作文评分</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                      <Input 
                        value={`示例作文文本${idx + 1}`}
                        readOnly
                        placeholder="学生作答"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('学生作答', `示例作文文本${idx + 1}`)} />}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>评分标准</div>
                      <Input 
                        value={`评分标准示例${idx + 1}`}
                        readOnly
                        placeholder="评分标准"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('评分标准', `评分标准示例${idx + 1}`)} />}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                      <Input 
                        value={`示例原题${idx + 1}`}
                        readOnly
                        placeholder="原题"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', `示例原题${idx + 1}`)} />}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>满分分数</span>
                      <Input 
                        value={'20分'} 
                        readOnly 
                        placeholder="满分分数" 
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', '20分')} />} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth：</span>
                      <Input
                        value={datasetAddPreviewGroundTruthMap[previewIds['作文评分'][idx]] || ''}
                        onChange={(e) => setDatasetAddPreviewGroundTruthMap(prev => ({ ...prev, [previewIds['作文评分'][idx]]: e.target.value }))}
                        placeholder="请输入Ground Truth"
                        suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddPreviewGroundTruthMap[previewIds['作文评分'][idx]] || '')} />}
                      />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>标签：</span>
                      {(getVisiblePreviewTags(previewIds['作文评分'][idx]) || []).map((t, i2) => (
                        <Tag key={i2} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>核查状态：</span>
                      <Radio.Group
                        value={datasetAddPreviewCheckStatusMap[previewIds['作文评分'][idx]] || '未核查'}
                        onChange={(e) => setDatasetAddPreviewCheckStatusMap(prev => ({ ...prev, [previewIds['作文评分'][idx]]: e.target.value }))}
                      >
                        <Radio value="未核查">未核查</Radio>
                        <Radio value="已核查">已核查</Radio>
                      </Radio.Group>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>ID：{previewIds['作文评分'][idx]}</div>
                    </div>
                  </Card>
                )))}

                {(!datasetAddTypeFilter || datasetAddTypeFilter === '手阅登分') && ([0, 1]
                  .filter((idx) => !datasetAddStatusFilter || (datasetAddPreviewCheckStatusMap[previewIds['手阅登分'][idx]] || '未核查') === datasetAddStatusFilter)
                  .filter((idx) => cardMatchesTagKeyword(previewIds['手阅登分'][idx]))
                  .filter((idx) => cardMatchesExtraFilters(previewIds['手阅登分'][idx]))
                  .map((idx) => (
                <Card key={`手阅登分-${idx}`} hoverable size="small" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Checkbox
                      checked={datasetAddSelectedCardIds.includes(previewIds['手阅登分'][idx])}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const cardId = previewIds['手阅登分'][idx]
                        setDatasetAddSelectedCardIds((prev) => {
                          const set = new Set(prev)
                          if (checked) set.add(cardId); else set.delete(cardId)
                          return Array.from(set)
                        })
                      }}
                    />
                  </div>
                  <div style={{ position: 'absolute', top: 5, right: -28, width: 90, background: (datasetAddPreviewCheckStatusMap[previewIds['手阅登分'][idx]] === '已核查' ? '#10b981' : '#f59e0b'), color: '#fff', textAlign: 'center', padding: '1px 0', fontSize: 10, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 3 }}>{datasetAddPreviewCheckStatusMap[previewIds['手阅登分'][idx]] || '未核查'}</div>
                  <div style={{ position: 'relative' }}>
                    <img src={svgPlaceholder(`手阅登分预览图${idx + 1}`)} alt="手阅登分" style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openDatasetImportImagePreview(svgPlaceholder(`手阅登分预览图${idx + 1}`))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontWeight: 600 }}>
                    <span>原题</span>
                    <Input value={'示例原题'} readOnly placeholder="原题" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', '示例原题')} />} />
                    <span>正确答案</span>
                    <Input value={'示例答案'} readOnly placeholder="正确答案" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', '示例答案')} />} />
                    <span>满分分数</span>
                    <Input value={'100'} readOnly placeholder="满分分数" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', '100')} />} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                    <Input
                      value={datasetAddPreviewGroundTruthMap[previewIds['手阅登分'][idx]] || ''}
                      onChange={(e) => setDatasetAddPreviewGroundTruthMap(prev => ({ ...prev, [previewIds['手阅登分'][idx]]: e.target.value }))}
                      placeholder="请输入Ground Truth"
                      suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddPreviewGroundTruthMap[previewIds['手阅登分'][idx]] || '')} />}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>标签：</span>
                    {(getVisiblePreviewTags(previewIds['手阅登分'][idx]) || []).map((t, idx2) => (
                      <Tag key={idx2} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>核查状态：</span>
                    <Radio.Group
                      value={datasetAddPreviewCheckStatusMap[previewIds['手阅登分'][idx]] || '未核查'}
                      onChange={(e) => setDatasetAddPreviewCheckStatusMap(prev => ({ ...prev, [previewIds['手阅登分'][idx]]: e.target.value }))}
                    >
                      <Radio value="未核查">未核查</Radio>
                      <Radio value="已核查">已核查</Radio>
                    </Radio.Group>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>名称：手阅登分图片</div>
                    <div>ID：{previewIds['手阅登分'][idx]}</div>
                  </div>
                </Card>
                )))}

                {(!datasetAddTypeFilter || datasetAddTypeFilter === 'OCR识别') && ([0, 1]
                  .filter((idx) => !datasetAddStatusFilter || (datasetAddPreviewCheckStatusMap[previewIds['OCR识别'][idx]] || '未核查') === datasetAddStatusFilter)
                  .filter((idx) => cardMatchesTagKeyword(previewIds['OCR识别'][idx]))
                  .filter((idx) => cardMatchesExtraFilters(previewIds['OCR识别'][idx]))
                  .map((idx) => (
                <Card key={`OCR识别-${idx}`} hoverable size="small" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Checkbox
                      checked={datasetAddSelectedCardIds.includes(previewIds['OCR识别'][idx])}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const cardId = previewIds['OCR识别'][idx]
                        setDatasetAddSelectedCardIds((prev) => {
                          const set = new Set(prev)
                          if (checked) set.add(cardId); else set.delete(cardId)
                          return Array.from(set)
                        })
                      }}
                    />
                  </div>
                  <div style={{ position: 'absolute', top: 5, right: -28, width: 90, background: (datasetAddPreviewCheckStatusMap[previewIds['OCR识别'][idx]] === '已核查' ? '#10b981' : '#f59e0b'), color: '#fff', textAlign: 'center', padding: '1px 0', fontSize: 10, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 3 }}>{datasetAddPreviewCheckStatusMap[previewIds['OCR识别'][idx]] || '未核查'}</div>
                  <div style={{ position: 'relative' }}>
                    <img src={svgPlaceholder(`OCR识别预览图${idx + 1}`)} alt="OCR识别" style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openDatasetImportImagePreview(svgPlaceholder(`OCR识别预览图${idx + 1}`))} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                    <Input 
                      value={'识别文字示例'} 
                      readOnly 
                      placeholder="识别结果" 
                      suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('识别结果', '识别文字示例')} />} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                    <Input
                      value={datasetAddPreviewGroundTruthMap[previewIds['OCR识别'][idx]] || ''}
                      onChange={(e) => setDatasetAddPreviewGroundTruthMap(prev => ({ ...prev, [previewIds['OCR识别'][idx]]: e.target.value }))}
                      placeholder="请输入Ground Truth"
                      suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddPreviewGroundTruthMap[previewIds['OCR识别'][idx]] || '')} />}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>标签：</span>
                    {(getVisiblePreviewTags(previewIds['OCR识别'][idx]) || []).map((t, idx2) => (
                      <Tag key={idx2} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>核查状态：</span>
                    <Radio.Group
                      value={datasetAddPreviewCheckStatusMap[previewIds['OCR识别'][idx]] || '未核查'}
                      onChange={(e) => setDatasetAddPreviewCheckStatusMap(prev => ({ ...prev, [previewIds['OCR识别'][idx]]: e.target.value }))}
                    >
                      <Radio value="未核查">未核查</Radio>
                      <Radio value="已核查">已核查</Radio>
                    </Radio.Group>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>名称：OCR识别图片</div>
                    <div>ID：{previewIds['OCR识别'][idx]}</div>
                  </div>
                </Card>
                )))}

                {(!datasetAddTypeFilter || datasetAddTypeFilter === '图片打分') && ([0, 1]
                  .filter((idx) => !datasetAddStatusFilter || (datasetAddPreviewCheckStatusMap[previewIds['图片打分'][idx]] || '未核查') === datasetAddStatusFilter)
                  .filter((idx) => cardMatchesTagKeyword(previewIds['图片打分'][idx]))
                  .filter((idx) => cardMatchesExtraFilters(previewIds['图片打分'][idx]))
                  .map((idx) => (
                <Card key={`图片打分-${idx}`} hoverable size="small" style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }} bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Checkbox
                      checked={datasetAddSelectedCardIds.includes(previewIds['图片打分'][idx])}
                      onChange={(e) => {
                        const checked = e.target.checked
                        const cardId = previewIds['图片打分'][idx]
                        setDatasetAddSelectedCardIds((prev) => {
                          const set = new Set(prev)
                          if (checked) set.add(cardId); else set.delete(cardId)
                          return Array.from(set)
                        })
                      }}
                    />
                  </div>
                  <div style={{ position: 'absolute', top: 5, right: -28, width: 90, background: (datasetAddPreviewCheckStatusMap[previewIds['图片打分'][idx]] === '已核查' ? '#10b981' : '#f59e0b'), color: '#fff', textAlign: 'center', padding: '1px 0', fontSize: 10, transform: 'rotate(45deg)', boxShadow: '0 1px 2px rgba(0,0,0,0.15)', pointerEvents: 'none', zIndex: 3 }}>{datasetAddPreviewCheckStatusMap[previewIds['图片打分'][idx]] || '未核查'}</div>
                  <div style={{ position: 'relative' }}>
                    <img src={svgPlaceholder(`图片打分预览图${idx + 1}`)} alt="图片打分" style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }} />
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                      <EyeOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} onClick={() => openDatasetImportImagePreview(svgPlaceholder(`图片打分预览图${idx + 1}`))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#374151', fontWeight: 600 }}>
                    <span>原题</span>
                    <Input value={'示例原题'} readOnly placeholder="原题" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('原题', '示例原题')} />} />
                    <span>正确答案</span>
                    <Input value={'示例答案'} readOnly placeholder="正确答案" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('正确答案', '示例答案')} />} />
                    <span>满分分数</span>
                    <Input value={'100'} readOnly placeholder="满分分数" suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('满分分数', '100')} />} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>Ground Truth</span>
                    <Input
                      value={datasetAddPreviewGroundTruthMap[previewIds['图片打分'][idx]] || ''}
                      onChange={(e) => setDatasetAddPreviewGroundTruthMap(prev => ({ ...prev, [previewIds['图片打分'][idx]]: e.target.value }))}
                      placeholder="请输入Ground Truth"
                      suffix={<EyeOutlined style={{ cursor: 'pointer' }} onClick={() => openDatasetImportPreview('Ground Truth', datasetAddPreviewGroundTruthMap[previewIds['图片打分'][idx]] || '')} />}
                    />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>标签：</span>
                    {(getVisiblePreviewTags(previewIds['图片打分'][idx]) || []).map((t, idx2) => (
                      <Tag key={idx2} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: '#111827' }}>核查状态：</span>
                    <Radio.Group
                      value={datasetAddPreviewCheckStatusMap[previewIds['图片打分'][idx]] || '未核查'}
                      onChange={(e) => setDatasetAddPreviewCheckStatusMap(prev => ({ ...prev, [previewIds['图片打分'][idx]]: e.target.value }))}
                    >
                      <Radio value="未核查">未核查</Radio>
                      <Radio value="已核查">已核查</Radio>
                    </Radio.Group>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>名称：图片打分图片</div>
                    <div>ID：{previewIds['图片打分'][idx]}</div>
                  </div>
                </Card>
                )))}
                </div>
              </div>
            </div>
          )}
          </div>
        </Form>
      </Drawer>

      {/* 图片查看器 */}
      <Modal
        title="查看图片"
        open={imageViewerVisible}
        onCancel={() => setImageViewerVisible(false)}
        footer={null}
        width={900}
        styles={{ body: { padding: 0, background: '#000' } }}
        destroyOnHidden
      >
        <div 
          onWheel={handleViewerWheel}
          onDoubleClick={() => setImageViewerScale(1)}
          style={{ 
            height: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: '#000'
          }}
        >
          {imageViewerSrc ? (
            <img 
              src={imageViewerSrc} 
              alt="预览图片" 
              style={{ 
                transform: `scale(${imageViewerScale})`,
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '100%',
                userSelect: 'none',
                willChange: 'transform'
              }} 
            />
          ) : (
            <div style={{ color: '#fff' }}>暂无图片</div>
          )}
        </div>
        <div style={{ color: '#fff', padding: '8px 16px', background: '#000', borderTop: '1px solid #111' }}>
          <span>滚轮缩放，双击重置 | 当前缩放：{Math.round(imageViewerScale * 100)}%</span>
        </div>
        <div style={{ color: '#fff', padding: '8px 16px', background: '#000', borderTop: '1px solid #111' }}>
          <div>ID：{imageViewerRecord?.id || '-'}</div>
          <div>标签：{(Array.isArray(imageViewerRecord?.tags) && imageViewerRecord?.tags?.length) ? imageViewerRecord.tags.join('、') : (imageViewerRecord?.tag || '-')}</div>
          <div>描述：{imageViewerRecord?.description || '-'}</div>
          <div>核查状态：{imageViewerRecord?.checkStatus || '-'}</div>
        </div>
      </Modal>

      {/* 编辑图片名称 */}
      <Modal
        title="编辑图片名称"
        open={datasetEditModalVisible}
        onOk={handleDatasetEditSave}
        onCancel={handleDatasetEditCancel}
        width={480}
        okText="保存"
        cancelText="取消"
      >
        <Form form={datasetEditForm} layout="vertical">
          <Form.Item
            label="图片名称"
            name="name"
            rules={[
              { required: true, message: '请输入图片名称' },
              { max: 200, message: '名称不超过200字符' }
            ]}
          >
            <Input placeholder="请输入图片名称" />
          </Form.Item>
          <Form.Item name="tag" label="标签">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择或创建标签"
              options={datasetTagOptions.filter(isTagAllowed).map(t => ({ label: t, value: t }))}
              dropdownRender={(menu) => (
                <div>
                  <div style={{ maxHeight: 240, overflow: 'auto' }}>{menu}</div>
                  <div style={{ borderTop: '1px solid #add8e6', marginTop: 8, padding: 8, display: 'flex', gap: 8 }}>
                    <Input
                      value={datasetTagInput}
                      onChange={(e) => setDatasetTagInput(e.target.value)}
                      placeholder="输入自定义标签"
                      onPressEnter={addDatasetTagOption}
                    />
                    <Button type="default" onClick={addDatasetTagOption}>添加</Button>
                  </div>
                </div>
              )}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="checkStatus" label="核查状态">
            <Select placeholder="请选择核查状态">
              <Option value="未核查">未核查</Option>
              <Option value="已核查">已核查</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看学生作答 */}
      <Modal
        title="查看学生作答"
        open={datasetViewModalVisible}
        onCancel={() => setDatasetViewModalVisible(false)}
        footer={<Button onClick={() => setDatasetViewModalVisible(false)}>关闭</Button>}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="学生作答">
            <Input.TextArea value={String(datasetViewRecord?.input || '')} readOnly rows={4} />
          </Form.Item>
          <Form.Item label="原题">
            <Input value={String(datasetViewRecord?.question || '')} readOnly />
          </Form.Item>
          <Form.Item label="正确答案">
            <Input value={String(datasetViewRecord?.correctAnswer || '')} readOnly />
          </Form.Item>
          <Form.Item label="满分分数">
            <Input value={datasetViewRecord?.fullScore ?? ''} readOnly />
          </Form.Item>
          <Form.Item label="标签">
            <Input
              value={(Array.isArray(datasetViewRecord?.tags) && datasetViewRecord?.tags?.length) ? datasetViewRecord.tags.join('、') : (datasetViewRecord?.tag || '')}
              readOnly
            />
          </Form.Item>
          <Form.Item label="描述">
            <Input value={datasetViewRecord?.description || ''} readOnly />
          </Form.Item>
          <Form.Item label="核查状态">
            <Input value={datasetViewRecord?.checkStatus || ''} readOnly />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑学生作答 */}
      <Modal
        title="编辑学生作答"
        open={datasetTextEditModalVisible}
        onOk={handleDatasetTextEditSave}
        onCancel={handleDatasetTextEditCancel}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={datasetTextEditForm} layout="vertical">
          <Form.Item
            label="学生作答"
            name="text"
            rules={[
              { required: true, message: '请输入学生作答' },
              { max: 500, message: '内容不超过500字符' }
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入学生作答" maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="原题" name="question">
            <Input placeholder="请输入原题" />
          </Form.Item>
          <Form.Item label="正确答案" name="correctAnswer">
            <Input placeholder="请输入正确答案" />
          </Form.Item>
          <Form.Item label="满分分数" name="fullScore">
            <Input type="number" placeholder="请输入满分分数" />
          </Form.Item>
          <Form.Item name="tag" label="标签">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择或创建标签"
              options={datasetTagOptions.filter(isTagAllowed).map(t => ({ label: t, value: t }))}
              dropdownRender={(menu) => (
                <div>
                  <div style={{ maxHeight: 240, overflow: 'auto' }}>{menu}</div>
                  <div style={{ borderTop: '1px solid #add8e6', marginTop: 8, padding: 8, display: 'flex', gap: 8 }}>
                    <Input
                      value={datasetTagInput}
                      onChange={(e) => setDatasetTagInput(e.target.value)}
                      placeholder="输入自定义标签"
                      onPressEnter={addDatasetTagOption}
                    />
                    <Button type="default" onClick={addDatasetTagOption}>添加</Button>
                  </div>
                </div>
              )}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="checkStatus" label="核查状态">
            <Select placeholder="请选择核查状态">
              <Option value="未核查">未核查</Option>
              <Option value="已核查">已核查</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 导入教辅模态框 */}
      <Modal
        title="导入教辅资料"
        open={importModalVisible}
        onOk={handleImportConfirm}
        onCancel={handleImportCancel}
        width={600}
        okText="开始导入"
        cancelText="取消"
        okButtonProps={{ disabled: uploadFileList.length === 0 }}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#1677ff' }}>📁 支持的文件格式</h4>
            <ul style={{ paddingLeft: 20, margin: 0, color: '#666' }}>
              <li>支持ZIP格式的教辅数据</li>
            </ul>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, color: '#1677ff' }}>📤 选择文件</h4>
            <Upload.Dragger {...uploadProps} style={{ padding: '20px' }}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1677ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 16, marginBottom: 8 }}>
                点击或拖拽ZIP文件到此区域上传
              </p>
              <p className="ant-upload-hint" style={{ color: '#999' }}>
                支持单个ZIP文件上传，文件大小不超过500MB
              </p>
            </Upload.Dragger>
          </div>

          {uploadFileList.length > 0 && (
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              marginTop: 16
            }}>
              <p style={{ margin: 0, color: '#52c41a' }}>
                ✅ 已选择文件: {uploadFileList[0].name}
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 12 }}>
                文件大小: {(uploadFileList[0].size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* 已选数据集弹窗 */}
      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>已选数据集</div>
            <span>&nbsp;&nbsp;</span>
            <h4 style={{ display: 'inline', margin: 0, fontSize: 'inherit', fontWeight: 600 }}>
              {({ text: '通用批阅', text2: '作文评分', image: '手阅登分', image2: 'OCR识别', image1: '图片打分' }[datasetTabKey]) || ''}
            </h4>
          </div>
        )}
        open={selectedDatasetModalVisible}
        onCancel={() => setSelectedDatasetModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSelectedDatasetModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        <div style={{ width: '100%', minHeight: 0, maxHeight: '60vh', overflowX: 'auto', overflowY: 'auto' }}>
          {(() => {
            const ids = pgCompareMode ? previewDatasetIdsLeft : previewDatasetIds
            const imageIds = pgCompareMode ? previewDatasetImageIdsLeft : previewDatasetImageIds
            const tabKey = datasetTabKey

            const isTextTab = tabKey === 'text' || tabKey === 'text2'
            const items = isTextTab
              ? (datasetTextFilteredData || []).filter(d => (ids || []).includes(d.id))
              : (datasetImageFilteredData || []).filter(d => (imageIds || []).includes(d.id))

            if (!items.length) {
              return (
                <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                  暂无已选数据集
                </div>
              )
            }

            return (
              <List
                grid={{ gutter: 12, column: 4 }}
                dataSource={items}
                renderItem={(item) => {
                  if (isTextTab && tabKey === 'text') {
                    const tagsArray = normalizeTagList(item.tags)
                    const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                    return (
                      <List.Item key={item.id}>
                        <Card
                          hoverable
                          size="small"
                          style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                          bodyStyle={{ padding: datasetBatchSelectMode ? '28px 12px 12px 36px' : 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 5,
                              right: -28,
                              width: 90,
                              background: statusColor,
                              color: '#fff',
                              textAlign: 'center',
                              padding: '1px 0',
                              fontSize: 10,
                              transform: 'rotate(45deg)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              pointerEvents: 'none',
                              zIndex: 3
                            }}
                          >
                            {item.checkStatus || '-'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.question || '-'}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>正确答案</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '48px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.correctAnswer || '-'}</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{item.checkStatus === '已核查' ? 'Ground Truth: XXX' : 'Ground Truth:'}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                            {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                              <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                            ))}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div>创建人：{item.creator || '-'}</div>
                            <div>ID：{item.displayId || item.id || '-'}</div>
                            <div>更新时间：{item.updateTime || '-'}</div>
                            <div>创建时间：{item.createTime || '-'}</div>
                          </div>
                        </Card>
                      </List.Item>
                    )
                  }

                  if (isTextTab && tabKey === 'text2') {
                    const tagsArray = normalizeTagList(item.tags)
                    const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                    return (
                      <List.Item key={item.id}>
                        <Card
                          hoverable
                          size="small"
                          style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                          bodyStyle={{ padding: datasetBatchSelectMode ? '28px 12px 12px 36px' : 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 5,
                              right: -28,
                              width: 90,
                              background: statusColor,
                              color: '#fff',
                              textAlign: 'center',
                              padding: '1px 0',
                              fontSize: 10,
                              transform: 'rotate(45deg)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              pointerEvents: 'none',
                              zIndex: 3
                            }}
                          >
                            {item.checkStatus || '-'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'break-word' }}>{item.input || '-'}</div>
                          </div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>满分分数：<span style={{ fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                            {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                              <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                            ))}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div>创建人：{item.creator || '-'}</div>
                            <div>ID：{item.displayId || item.id || '-'}</div>
                            <div>更新时间：{item.updateTime || '-'}</div>
                            <div>创建时间：{item.createTime || '-'}</div>
                          </div>
                        </Card>
                      </List.Item>
                    )
                  }

                  // image tabs
                  const tagsArray = normalizeTagList(item.tags)
                  const statusColor = item.checkStatus === '已核查' ? '#10b981' : '#f59e0b'
                  return (
                    <List.Item key={item.id}>
                      <Card
                        hoverable
                        size="small"
                        style={{ borderRadius: 8, overflow: 'hidden', position: 'relative' }}
                        bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 5,
                            right: -28,
                            width: 90,
                            background: statusColor,
                            color: '#fff',
                            textAlign: 'center',
                            padding: '1px 0',
                            fontSize: 10,
                            transform: 'rotate(45deg)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            pointerEvents: 'none',
                            zIndex: 3
                          }}
                        >
                          {item.checkStatus || '-'}
                        </div>
                        <div style={{ position: 'relative' }}>
                          <img
                            src={item.imageUrl || svgPlaceholder(getImageNameFromInput(item.input) || '图片占位')}
                            alt={getImageNameFromInput(item.input)}
                            style={{ width: '100%', height: 120, objectFit: 'cover', background: '#f5f5f5' }}
                            onClick={() => openImageViewer(item)}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>识别结果</div>
                          <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', maxWidth: '100%', overflowX: 'auto', overflowY: 'auto', wordBreak: 'keep-all', overflowWrap: 'normal' }}>{item.recognition || getImageNameFromInput(item.input) || '-'}</div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontWeight: 600, color: '#111827' }}>标签</span>
                          {(tagsArray && tagsArray.length ? tagsArray : ['-']).map((t, idx) => (
                            <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                          ))}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div>名称：{getImageNameFromInput(item.input) || '-'}</div>
                          <div>创建人：{item.creator || '-'}</div>
                          <div>ID：{item.displayId || item.id || '-'}</div>
                          <div>更新时间：{item.updateTime || '-'}</div>
                          <div>创建时间：{item.createTime || '-'}</div>
                        </div>
                      </Card>
                    </List.Item>
                  )
                }}
              />
            )
          })()}
        </div>
      </Modal>
    </div>
  )
}

export default ContentArea
