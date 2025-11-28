'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
};

export default function RichTextEditor({ value, onChange, placeholder, maxLength = 5000 }: RichTextEditorProps) {
  // Dynamically import ReactQuill to avoid SSR issues
  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
  ];

  const handleChange = (content: string) => {
    // Check length (strip HTML tags for character count)
    const textContent = content.replace(/<[^>]*>/g, '');
    if (textContent.length <= maxLength) {
      onChange(content);
    }
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-gray-800 text-white rounded-md"
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 0.375rem 0.375rem 0 0;
        }

        .rich-text-editor .ql-container {
          background: #1f2937;
          border: 1px solid #374151;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
          color: white;
          min-height: 200px;
        }

        .rich-text-editor .ql-editor {
          min-height: 200px;
          color: white;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
        }

        .rich-text-editor .ql-stroke {
          stroke: #9ca3af;
        }

        .rich-text-editor .ql-fill {
          fill: #9ca3af;
        }

        .rich-text-editor .ql-picker-label {
          color: #9ca3af;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          stroke: #60a5fa;
          fill: #60a5fa;
        }

        .rich-text-editor .ql-editor a {
          color: #60a5fa;
        }
      `}</style>
    </div>
  );
}
