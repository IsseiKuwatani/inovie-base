// src/app/projects/[id]/ai-report/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import AIReportRenderer from '@/components/reports/AIReportRenderer';
import AIReportControls from '@/components/reports/AIReportControls';

export default function AIReportPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [reportHtml, setReportHtml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-report/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `APIエラー: ${response.status}`);
      }
      
      const data = await response.json();
      setReportHtml(data.html);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`レポート生成中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // PDFダウンロード機能 (オプション)
  const downloadPDF = () => {
    // PDFの生成処理を実装
    alert('PDF生成機能は今後実装予定です');
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AIプロジェクトレポート</h1>
      
      <AIReportControls 
        onGenerate={generateReport} 
        isGenerating={isGenerating} 
        onDownloadPDF={downloadPDF}
      />
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6 text-red-600">
          {error}
        </div>
      )}
      
      {reportHtml ? (
        <AIReportRenderer html={reportHtml} />
      ) : !isGenerating && (
        <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500">
            「AIレポートを生成」ボタンをクリックすると、プロジェクト情報から自動的にレポートを作成します
          </p>
        </div>
      )}
      
      {isGenerating && <AIReportRenderer isLoading={true} html="" />}
    </div>
  );
}
