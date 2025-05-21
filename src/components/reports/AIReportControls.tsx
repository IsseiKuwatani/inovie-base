// src/components/reports/AIReportControls.tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface AIReportControlsProps {
  onGenerate: () => void;
  isGenerating: boolean;
  onDownloadPDF?: () => void;
}

const AIReportControls: React.FC<AIReportControlsProps> = ({
  onGenerate,
  isGenerating,
  onDownloadPDF,
}) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="bg-indigo-600 hover:bg-indigo-700"
      >
        {isGenerating ? '生成中...' : 'AIレポートを生成'}
      </Button>
      
      {onDownloadPDF && (
        <Button
          onClick={onDownloadPDF}
          variant="outline"
          className="border-indigo-300 text-indigo-600"
        >
          PDFでダウンロード
        </Button>
      )}
      
      <div className="text-sm text-gray-500">
        ※AIレポートはプロジェクトの最新データから自動生成されます
      </div>
    </div>
  );
};

export default AIReportControls;
