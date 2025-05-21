// src/components/reports/AIReportRenderer.tsx
import React from 'react';

interface AIReportRendererProps {
  html: string;
  isLoading?: boolean;
}

const AIReportRenderer: React.FC<AIReportRendererProps> = ({ html, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse flex flex-col items-center justify-center">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-report-container">
      <div className="prose prose-indigo max-w-none p-8 bg-white rounded-lg shadow">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

export default AIReportRenderer;
