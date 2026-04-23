import { useEffect, useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import jsPDF from 'jspdf'
import { db } from '../../firebase'

export default function DocEditor({ docId, clientId, projectId, groupId, title, onClose }) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [loaded, setLoaded] = useState(false)
  let saveTimeout = null

  const docPath = `clients/${clientId}/projects/${projectId}/groups/${groupId}/documents/${docId}`

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!loaded) return
      clearTimeout(saveTimeout)
      setSaving(true)
      saveTimeout = setTimeout(async () => {
        await setDoc(doc(db, docPath), {
          content: editor.getHTML(),
          updatedAt: serverTimestamp(),
        }, { merge: true })
        setSaving(false)
        setLastSaved(new Date())
      }, 1000)
    },
  })

  useEffect(() => {
    const unsub = onSnapshot(doc(db, docPath), snap => {
      if (snap.exists() && !loaded) {
        editor?.commands.setContent(snap.data().content || '')
      }
      setLoaded(true)
    })
    return unsub
  }, [docPath, editor])

  function setLink() {
    const url = window.prompt('URL')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  async function exportDocx() {
    const text = editor.getText()
    const html = editor.getHTML()
    const parser = new DOMParser()
    const parsed = parser.parseFromString(html, 'text/html')
    const children = []
    parsed.body.childNodes.forEach(node => {
      if (node.nodeName === 'H1') {
        children.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_1 }))
      } else if (node.nodeName === 'H2') {
        children.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_2 }))
      } else if (node.nodeName === 'H3') {
        children.push(new Paragraph({ text: node.textContent, heading: HeadingLevel.HEADING_3 }))
      } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        node.querySelectorAll('li').forEach(li => {
          children.push(new Paragraph({ text: '• ' + li.textContent }))
        })
      } else {
        const text = node.textContent?.trim()
        if (text) children.push(new Paragraph({ text }))
      }
    })
    const doc_ = new Document({ sections: [{ properties: {}, children }] })
    const blob = await Packer.toBlob(doc_)
    saveAs(blob, `${title}.docx`)
  }

  async function exportPdf() {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const text = editor.getText()
    const lines = pdf.splitTextToSize(text, 170)
    let y = 20
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, 20, y)
    y += 10
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    lines.forEach(line => {
      if (y > 270) { pdf.addPage(); y = 20 }
      pdf.text(line, 20, y)
      y += 6
    })
    pdf.save(`${title}.pdf`)
  }

  if (!editor) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0e12] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[#1e2d3a] bg-[#0c1117]">
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2 className="font-display font-bold text-white flex-1 truncate">{title}</h2>
        <span className="text-xs text-gray-600">
          {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-[#1e2d3a] bg-[#0c1117]">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">B</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><em>I</em></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><s>S</s></ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• List</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1. List</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">"</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code">{`</>`}</ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">⬅</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">⬛</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">➡</ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link">🔗</ToolBtn>
        <ToolBtn onClick={insertTable} title="Table">⊞</ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</ToolBtn>
        <div className="w-px h-5 bg-[#1e2d3a] mx-1" />
        <button
          onClick={() => navigator.clipboard.writeText(editor.getText())}
          className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition-colors"
          title="Copy as plain text"
        >
          Copy text
        </button>
        <button
          onClick={exportDocx}
          className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition-colors border border-[#1e2d3a] hover:border-[#4D7FA3]"
          title="Export as Word document"
        >
          ↓ .docx
        </button>
        <button
          onClick={exportPdf}
          className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded transition-colors border border-[#1e2d3a] hover:border-[#E87722]"
          title="Export as PDF"
        >
          ↓ .pdf
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <EditorContent editor={editor} className="doc-editor" />
        </div>
      </div>
    </div>
  )
}

function ToolBtn({ onClick, active, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors min-w-[28px] ${
        active ? 'bg-[#E87722] text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}
