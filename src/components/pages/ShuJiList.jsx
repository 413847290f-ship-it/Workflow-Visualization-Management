import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Card, Table, Input, Button, Space, DatePicker, Modal, message, List, Image, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const WORKFLOW_NAMES = [
  '【英语默写】自动批改',
  '【语文作文题】OCR识别',
  '【数学填空题】多模态处理',
  '【英语听力】关键词识别',
  '【语文语法题】语法纠错',
  '【数学选择题】批量判题',
  '【地理问答】检索增强',
  '【历史材料题】事实抽取',
  '【物理实验数据】图表解析',
  '【化学方程式】符号识别'
]

// 统一类型枚举（用于生成与新增）
const TYPES = ['OCR', '作文评分', '手阅登分', '图片打分', '通用评阅']

// 根据文本推断类型（按枚举）
const detectType = (text) => {
  if (!text) return '通用评阅'
  const s = String(text)
  if (s.includes('OCR')) return 'OCR'
  if (s.includes('作文评分')) return '作文评分'
  if (s.includes('手阅登分')) return '手阅登分'
  if (s.includes('图片打分')) return '图片打分'
  return '通用评阅'
}

const deriveTags = (text) => {
  const type = detectType(text)
  return type ? [type] : []
}

// 构造标签：形如【<科目><题型>】 + <类型标签>
const SUBJECTS = ['语文','英语','数学','地理','历史','物理','化学','生物']
const scenarioForType = (type, idx) => {
  if (type === 'OCR') return ['作文题','试卷扫描','讲义图片'][idx % 3]
  if (type === '图片打分') return ['图片作品','作业截图','试题配图'][idx % 3]
  if (type === '作文评分') return '作文题'
  if (type === '手阅登分') return '试卷手阅'
  return '综合题目'
}
const typeLabel = (type) => (type === 'OCR' ? 'OCR识别' : type)
const composeTagText = (type, idx) => {
  const subject = SUBJECTS[idx % SUBJECTS.length]
  const scenario = scenarioForType(type, idx)
  return `${subject}${scenario}${typeLabel(type)}`
}
const composeDesc = (type, idx) => {
  const subject = SUBJECTS[idx % SUBJECTS.length]
  const scenario = scenarioForType(type, idx)
  return `用于识别【${subject}${scenario}】类似于这样的`
}
// 保留旧函数签名但加入 idx，用于生成稳定标签文本
const deriveTagsWithIdx = (text, idx = 0) => {
  const type = detectType(text)
  return composeTagText(type, idx)
}

const genEncodedData = (count = TYPES.length) => {
  const ts = dayjs().format('YYYYMMDDHHmmss')
  return Array.from({ length: count }, (_, i) => {
    const seq = String(i + 1).padStart(4, '0')
    const id = `DS${ts}${seq}`
    const type = TYPES[i % TYPES.length]
    const name = `${type}数据集`
    const tags = deriveTagsWithIdx(name, i)
    const itemCount = Math.floor(Math.random() * 40) + 5 // 5~44条
    const now = dayjs().format('YYYY-MM-DD HH:mm')
    const updateTime = now
    const createTime = now
    const description = '用于描述数据集'
    return { id, name, type, tags, itemCount, description, updateTime, createTime }
  })
}

export default function ShuJiList({ searchText: searchQuery = '', addTrigger }) {
  const [data, setData] = useState([])
  const [timeRange, setTimeRange] = useState(null)
  const [adding, setAdding] = useState(false)
  const [isNewModalVisible, setIsNewModalVisible] = useState(false)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newItemCount, setNewItemCount] = useState(10)

  // 按规则生成10条数据并替换当前列表
  useEffect(() => {
    setData(genEncodedData(TYPES.length))
  }, [])

  const filtered = useMemo(() => {
    const query = String(searchQuery || '').trim().toLowerCase()
    const inRange = (item) => {
      if (!timeRange || timeRange.length !== 2) return true
      const [start, end] = timeRange
      const dt = dayjs(String(item.updateTime))
      return (dt.isAfter(start) || dt.isSame(start)) && (dt.isBefore(end) || dt.isSame(end))
    }
    return data.filter(item => {
      const byText = !query || item.id.toLowerCase().includes(query) || String(item.name).toLowerCase().includes(query)
      return byText && inRange(item)
    })
  }, [data, searchQuery, timeRange])

  const handleAdd = async () => {
    setAdding(true)
    try {
      const ts = dayjs().format('YYYYMMDDHHmmss')
      const seq = String(data.length + 1).padStart(4, '0')
      const now = dayjs().format('YYYY-MM-DD HH:mm')
      const type = TYPES[data.length % TYPES.length]
      const name = `${type}数据集`
      const newItem = {
        id: `DS${ts}${seq}`,
        name,
        type,
        tags: deriveTagsWithIdx(name, data.length),
        itemCount: Math.floor(Math.random() * 40) + 5,
        description: '用于描述数据集',
        updateTime: now,
        createTime: now,
      }
      setData(prev => [newItem, ...prev])
      message.success('已新增一个数集')
    } finally {
      setAdding(false)
    }
  }

  const handleView = (record) => {
    Modal.info({
      title: `查看：${record.name}`,
      content: (
        <div style={{ marginTop: 8 }}>
          <div>ID：{record.id}</div>
          <div>数据量：{record.itemCount}</div>
          <div>描述：{record.description}</div>
          <div>更新时间：{record.updateTime}</div>
          <div>创建时间：{record.createTime}</div>
        </div>
      ),
      centered: true,
      okText: '关闭',
    })
  }

  const handleEdit = (record) => {
    message.info(`编辑：${record.name}`)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除该数集？',
      content: `将删除：${record.name}（${record.id}）`,
      okText: '删除',
      cancelText: '取消',
      onOk: () => {
        setData(prev => prev.filter(x => x.id !== record.id))
        message.success('已删除')
      }
    })
  }

  // 父组件触发新增：仅在 addTrigger 变化时打开新增弹窗
  const prevAddRef = useRef(undefined)
  useEffect(() => {
    if (typeof addTrigger === 'undefined') return
    if (prevAddRef.current === undefined) {
      // 首次记录当前值，不触发
      prevAddRef.current = addTrigger
      return
    }
    if (addTrigger !== prevAddRef.current) {
      prevAddRef.current = addTrigger
      const type = TYPES[data.length % TYPES.length]
      setNewName(`${type}数据集`)
      setNewDescription('用于描述数据集')
      setNewItemCount(Math.floor(Math.random() * 40) + 5)
      setIsAddModalVisible(true)
    }
  }, [addTrigger, data.length])

  const handleAddConfirm = async () => {
    const name = String(newName || '').trim()
    const desc = String(newDescription || '').trim()
    const count = parseInt(String(newItemCount || '0'), 10)
    if (!name) {
      message.error('请输入名称')
      return
    }
    if (!Number.isFinite(count) || count <= 0) {
      message.error('请输入有效的数据项数量')
      return
    }
    setAdding(true)
    try {
      const ts = dayjs().format('YYYYMMDDHHmmss')
      const seq = String(data.length + 1).padStart(4, '0')
      const now = dayjs().format('YYYY-MM-DD HH:mm')
      const newItem = {
        id: `DS${ts}${seq}`,
        name,
        type: detectType(name),
        tags: deriveTagsWithIdx(name, data.length),
        itemCount: count,
        description: '用于描述数据集',
        updateTime: now,
        createTime: now,
      }
      setData(prev => [newItem, ...prev])
      setIsAddModalVisible(false)
      message.success('已新增一个数集')
    } finally {
      setAdding(false)
    }
  }

  // ===== 数据项明细（附件样式展示） =====
  const detailRef = useRef(null)
  const listRef = useRef(null)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailTextItems, setDetailTextItems] = useState([])
  const [detailImageItems, setDetailImageItems] = useState([])

  const svgPlaceholder = (text, width = 160, height = 120) =>
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#2f54eb"/><text x="50%" y="50%" font-size="16" fill="#fff" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`
    )

  const genTextItems = (n, baseId) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${baseId}-T${String(i + 1).padStart(2, '0')}`,
      name: `学生作答示例${i + 1}`,
      input: `学生作答内容示例 ${i + 1}：这是学生的作答文本，可为多行内容，展示滚动。`,
      question: `原题示例${i + 1}`,
      correctAnswer: `正确答案示例${i + 1}`,
      fullScore: 10,
      tags: deriveTags('通用评阅')
    }))

  const genImageItems = (n, baseId) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${baseId}-I${String(i + 1).padStart(2, '0')}`,
      url: svgPlaceholder(`图片项-${i + 1}`),
    }))

  const openDetail = (record) => {
    const hasOCR = record?.type === 'OCR'
    const hasImage = record?.type === '图片打分'
    const displayCount = Math.min(record.itemCount || 0, 10)
    const textItems = (!hasOCR && !hasImage) ? genTextItems(displayCount, record.id) : []
    const imageItems = (hasOCR || hasImage) ? genImageItems(displayCount, record.id) : []
    setDetailRecord(record)
    setDetailTextItems(textItems)
    setDetailImageItems(imageItems)
    // 滚动到“数据项明细”区
    setTimeout(() => {
      if (detailRef.current) {
        detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 0)
  }

  const handleBack = () => {
    // 仅返回到列表顶部，不改变列表或明细内容
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 0)
  }

  const textColumns = [
    { title: 'ID', dataIndex: 'id', width: 220 },
    { title: '名称', dataIndex: 'name', width: 180 },
    { title: '原题', dataIndex: 'question', width: 280, ellipsis: true },
    { title: '正确答案', dataIndex: 'correctAnswer', width: 280, ellipsis: true },
  ]

  const imageColumns = [
    {
      title: '缩略图',
      dataIndex: 'url',
      width: 140,
      render: (src) => (
        <Image src={src} width={96} height={72} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ),
    },
    { title: 'ID', dataIndex: 'id', width: 220 },
    { title: '图片地址', dataIndex: 'url', width: 320, ellipsis: true },
  ]

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 220 },
    { title: '名称', dataIndex: 'name', width: 240 },
    { title: '类型', dataIndex: 'type', width: 140 },
    { title: '标签', dataIndex: 'tags', width: 220, render: (val) => {
      const text = Array.isArray(val)
        ? `${String(val[0] || '').replace(/^【/, '').replace(/】$/, '')}${String(val[1] || '')}`
        : String(val || '')
      return text ? <span>{text}</span> : <span style={{ color: '#999' }}>—</span>
    } },
    { title: '描述', dataIndex: 'description', width: 280, ellipsis: true },
    { title: '数据量', dataIndex: 'itemCount', width: 100, align: 'center', render: (count, record) => (
      <Button type="link" size="small" onClick={() => setIsNewModalVisible(true)}>{count}</Button>
    ) },
    { title: '更新时间', dataIndex: 'updateTime', width: 180 },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作', key: 'action', width: 180, fixed: 'right', align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <>
      {/* 搜索框与新增按钮均在父组件的灰色背景区域，此处仅渲染列表卡片 */}
      <Card style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* 新增弹窗（由父组件按钮触发） */}
        <Modal
          open={isAddModalVisible}
          title="新增数据集"
          centered
          okText="确定"
          cancelText="取消"
          okButtonProps={{ loading: adding }}
          onOk={handleAddConfirm}
          onCancel={() => setIsAddModalVisible(false)}
        >
          <div style={{ display: 'grid', rowGap: 12 }}>
            <div>
              <div style={{ marginBottom: 6 }}>名称</div>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="请输入名称" />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>数据量</div>
              <Input type="number" value={newItemCount} onChange={(e) => setNewItemCount(e.target.value)} placeholder="请输入数量" />
            </div>
            <div>
              <div style={{ marginBottom: 6 }}>描述</div>
              <Input.TextArea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} placeholder="可选" />
            </div>
          </div>
        </Modal>
        <Modal
          open={isNewModalVisible}
          title="空弹窗"
          centered
          okText="关闭"
          onOk={() => setIsNewModalVisible(false)}
          onCancel={() => setIsNewModalVisible(false)}
        >
          <div style={{ marginTop: 8 }}>（此弹窗与页面内容解耦合，暂无内容）</div>
        </Modal>
        {detailRecord && (
          <div ref={detailRef} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', alignItems: 'center', columnGap: '8px' }}>
              <Button type="link" size="small" onClick={handleBack} style={{ paddingLeft: 0, gridRow: '1 / span 2', alignSelf: 'center' }}>← 返回</Button>
              <div style={{ fontSize: 'var(--ant-font-size-lg)', fontWeight: 600 }}>数据项明细</div>
              <div style={{ color: '#666', gridColumn: '2 / span 1' }}>
                名称：{detailRecord.name}；汇总：{detailRecord.itemCount}条；示例展示：{Math.min(detailRecord.itemCount || 0, 10)}条
              </div>
            </div>
            {detailTextItems.length > 0 && (
              <Card size="small" style={{ marginTop: 8 }} title="通用批阅">
                <List
                  grid={{ gutter: 12, column: 3 }}
                  dataSource={detailTextItems}
                  pagination={false}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <Card
                        hoverable
                        size="small"
                        style={{ borderRadius: 8, overflow: 'hidden' }}
                        bodyStyle={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{item.name}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {(Array.isArray(item.tags) ? item.tags : [item.tags]).filter(Boolean).map((t, idx) => (
                              <Tag key={idx} color="blue" style={{ marginInline: 0 }}>{t}</Tag>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>学生作答</div>
                          <div style={{ whiteSpace: 'pre', color: '#374151', minHeight: '60px', maxHeight: '120px', width: '100%', overflowX: 'auto', overflowY: 'auto' }}>{item.input || '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>原题</div>
                          <div style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{item.question || '-'}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr max-content', alignItems: 'center' }}>
                          <div style={{ color: '#111827' }}>
                            <span style={{ fontWeight: 600, marginRight: 6 }}>正确答案</span>
                            <span style={{ color: '#374151' }}>{item.correctAnswer || '-'}</span>
                          </div>
                          <div style={{ fontWeight: 600, color: '#111827' }}>满分：<span style={{ color: '#374151', fontWeight: 500 }}>{item.fullScore ?? '-'}</span></div>
                        </div>
                        <div style={{ color: '#6b7280', fontSize: 12 }}>
                          <span>ID：{item.id}</span>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            )}
            {detailImageItems.length > 0 && (
      <Card size="small" style={{ marginTop: 12 }} title="OCR识别">
                <Table
                  columns={imageColumns}
                  dataSource={detailImageItems}
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            )}
          </div>
        )}
        <div ref={listRef} />
        <Table
          columns={columns}
          dataSource={filtered}
          tableLayout="fixed"
          scroll={{ x: 'max-content', y: 520 }}
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
          components={{ body: { cell: (props) => (<td {...props} style={{ ...props.style, whiteSpace: 'nowrap' }} />) } }}
          rowKey="id"
        />
      </Card>
    </>
  )
}