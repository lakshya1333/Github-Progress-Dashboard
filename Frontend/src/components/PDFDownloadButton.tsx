import { useState } from 'react';
import { Download, FileJson, FileText, FileImage } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { GithubUser, Repository } from '../lib/types';
import { generateLatexDocument } from '../lib/latexUtils';

interface PDFDownloadButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
  userData?: GithubUser;
  repositories?: Repository[];
}

const PDFDownloadButton = ({ 
  targetRef, 
  filename = 'github-profile-snapshot.pdf',
  userData,
  repositories = []
}: PDFDownloadButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const downloadPDF = async () => {
    const element = targetRef.current;
    if (!element) {
      toast({
        title: "Error",
        description: "Could not find the content to download",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we create your PDF...",
      });

      // Store original styling
      const originalStyles = {
        overflow: document.body.style.overflow,
        height: element.style.height,
        maxHeight: element.style.maxHeight,
        position: element.style.position,
      };

      // Temporarily modify styles for better capture
      document.body.style.overflow = 'visible';
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      element.style.position = 'relative';

      // Force any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200, // Set a consistent width for the capture
      });

      // Restore original styles
      document.body.style.overflow = originalStyles.overflow;
      element.style.height = originalStyles.height;
      element.style.maxHeight = originalStyles.maxHeight;
      element.style.position = originalStyles.position;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      // Calculate the PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const xPos = (pdfWidth - imgWidth) / 2;

      pdf.addImage(imgData, 'PNG', xPos, 0, imgWidth, imgHeight);
      pdf.save(filename);

      toast({
        title: "Success!",
        description: "Your PDF has been successfully downloaded",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLatex = async () => {
    if (!userData) {
      toast({
        title: "Error",
        description: "User data is required for LaTeX export",
        variant: "destructive"
      });
      return;
    }
  
    try {
      setIsGenerating(true);
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your PDF...",
      });
  
      const latexContent = generateLatexDocument(userData, repositories);
  
      const response = await fetch("http://127.0.0.1:3000/latex-to-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ latex: latexContent })
      });
       console.log(response);
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
  
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement("a");
      link.href = url;
      link.download = "github-profile.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      URL.revokeObjectURL(url);
  
      toast({
        title: "Success!",
        description: "Your PDF has been downloaded.",
      });
  
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  

  const downloadMarkdown = async () => {
    if (!userData) {
      toast({
        title: "Error",
        description: "User data is required for Markdown export",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      toast({
        title: "Generating Markdown",
        description: "Please wait while we create your Markdown document...",
      });

      // Format date for the document
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Get top 5 repositories sorted by stars
      const topRepos = [...repositories]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5);

      // Calculate join date
      const joinDate = new Date(userData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      // Generate a fancy Markdown document
      const markdownContent = `
# 🚀 GitHub Profile: ${userData.name || userData.username}

> *Generated on ${formattedDate}*

<div align="center">
  
  ![Profile Banner](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=200&section=header&text=${encodeURIComponent(userData.name || userData.username)}&fontSize=50&animation=fadeIn&fontAlignY=38)
  
  [![GitHub followers](https://img.shields.io/badge/Followers-${userData.followers}-blue?style=for-the-badge&logo=github)](https://github.com/${userData.username}?tab=followers)
  [![GitHub stars](https://img.shields.io/badge/Stars-${repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)}-yellow?style=for-the-badge&logo=github)](https://github.com/${userData.username}?tab=repositories)
  

</div>

## 👤 Profile Summary

\`\`\`
Username: ${userData.username}
Name: ${userData.name || 'Not provided'}
Bio: ${userData.bio || 'Not provided'}
Location: ${userData.location || 'Not provided'}
Website: ${userData.blog || 'None'}
GitHub Member Since: ${joinDate}
\`\`\`

## 🌟 Stats Overview

<div align="center">
  
  | Followers | Following | Public Repositories |
  |:---------:|:---------:|:-------------------:|
  | ${userData.followers} | ${userData.following} | ${userData.username} |
  
</div>

## 💻 Top Repositories

${topRepos.map(repo => `
### [${repo.name}]() ⭐ ${repo.stargazers_count}

${repo.description || 'No description available'}

\`\`\`
Language: ${repo.language || 'Not specified'} | Updated: ${new Date(repo.updated_at).toLocaleDateString()}
\`\`\`
`).join('\n')}

## 📊 GitHub Statistics

<div align="center">
  
  | Stat | Value |
  |:-----|:-----:|
  | **Total Stars** | ${repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)} ⭐ |
  | **Total Forks** | ${repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0)} 🍴 |
  
</div>

## 📅 Activity Graph

\`\`\`
  ${Array(7).fill(0).map(() => Array(10).fill('■').join(' ')).join('\n  ')}
\`\`\`

---

<div align="center">
  
  *This document was automatically generated from GitHub data*
  
  [![Visit GitHub Profile](https://img.shields.io/badge/Visit_Profile-${userData.username}-blue?style=for-the-badge&logo=github)](https://github.com/${userData.username})
  
  ![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer)
  
</div>
`;
      
      // Create a Blob with the Markdown content
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'github-profile.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Success! 🎉",
        description: "Your stylish Markdown document has been downloaded!",
      });
    } catch (error) {
      console.error('Error generating Markdown:', error);
      toast({
        title: "Error",
        description: "Failed to generate Markdown. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          disabled={isGenerating}
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={downloadPDF} className="cursor-pointer flex items-center gap-2">
          <FileImage className="h-4 w-4" /> Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadLatex} className="cursor-pointer flex items-center gap-2">
          <FileText className="h-4 w-4" /> Export as LaTeX
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadMarkdown} className="cursor-pointer flex items-center gap-2 font-bold text-green-600">
          <FileJson className="h-4 w-4" /> Export as Markdown 🔥
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PDFDownloadButton;