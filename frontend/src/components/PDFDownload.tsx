import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MatchData } from '../types/match';

interface PDFDownloadProps {
  data: MatchData;
  teams: string[];
}

export const PDFDownload: React.FC<PDFDownloadProps> = ({ data, teams }) => {
  const generatePDF = async () => {
    try {
      // Show loading state
      const button = document.getElementById('pdf-download-btn');
      if (button) {
        button.innerHTML = 'Generating PDF...';
        button.setAttribute('disabled', 'true');
      }

      const analysisElement = document.getElementById('match-analysis');
      
      if (!analysisElement) {
        console.error('Analysis element not found');
        return;
      }

      // Wait a bit for any animations or dynamic content to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force a reflow to ensure all content is rendered
      analysisElement.offsetHeight;
      
      // Create a clone of the element to avoid modifying the original
      const clone = analysisElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '800px';
      clone.style.backgroundColor = '#f3f4f6';
      
      // Remove any interactive elements from the clone
      const buttons = clone.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      
      // Remove any scrollable elements that might cause issues
      const scrollableElements = clone.querySelectorAll('[style*="overflow"]');
      scrollableElements.forEach(el => {
        (el as HTMLElement).style.overflow = 'visible';
      });
      
      document.body.appendChild(clone);
      
      // Wait for the clone to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(clone, {
        scale: 1.5, // Reduced scale to avoid memory issues
        useCORS: true,
        allowTaint: true,
        scrollY: 0,
        scrollX: 0,
        width: 800,
        height: clone.scrollHeight,
        backgroundColor: '#f3f4f6',
        logging: false, // Disable logging to reduce console noise
        onclone: (clonedDoc) => {
          // Additional processing on the cloned document
          const clonedElement = clonedDoc.getElementById('match-analysis');
          if (clonedElement) {
            // Ensure all images and charts are loaded
            const images = clonedElement.querySelectorAll('img');
            const charts = clonedElement.querySelectorAll('canvas, svg');
            
            // Wait for all images to load
            const imagePromises = Array.from(images).map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
              });
            });
            
            return Promise.all(imagePromises);
          }
        }
      });
      
      // Remove the clone
      document.body.removeChild(clone);
      
      // Verify canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty - no content captured');
      }
      
      const imgData = canvas.toDataURL('image/png', 0.8); // Reduced quality to avoid corruption
      
      // Verify the image data is valid
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data');
      }
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `badminton-analysis-${teams.join('-vs-')}-${timestamp}.pdf`;
      
      pdf.save(filename);
      
      // Reset button
      if (button) {
        button.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF Report
        `;
        button.removeAttribute('disabled');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Reset button on error
      const button = document.getElementById('pdf-download-btn');
      if (button) {
        button.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF Report
        `;
        button.removeAttribute('disabled');
      }
      
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <button
      id="pdf-download-btn"
      onClick={generatePDF}
      className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download PDF Report
    </button>
  );
};