import React from 'react';
import { Github, Menu, X } from 'lucide-react';
import { Button } from "../components/ui/button";
import { cn } from '../lib/utils';
import ThemeToggle from "./ThemeToggle";
import PDFDownloadButton from '../components/PDFDownloadButton';
import { GithubUser, Repository } from '../lib/types';

interface NavbarProps {
  className?: string;
  userData?: GithubUser;
  repositories?: Repository[];
  dashboardRef?: React.RefObject<HTMLDivElement>;
}

const Navbar: React.FC<NavbarProps> = ({ className, userData, repositories, dashboardRef }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={cn(
      "w-full py-4 px-6 bg-white/70 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm",
      className
    )}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6" />
          <span className="font-semibold text-lg">GitHub Stats</span>
        </div>
        
        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle/>
          {dashboardRef && userData && repositories && (
            <PDFDownloadButton 
              targetRef={dashboardRef} 
              filename="github-profile-snapshot.pdf" 
              userData={userData}
              repositories={repositories}
            />
          )}
          <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
            Dashboard
          </a>
          <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
            Repositories
          </a>
          <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
            Activity
          </a>
          <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
            About
          </a>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {dashboardRef && userData && repositories && (
            <PDFDownloadButton 
              targetRef={dashboardRef} 
              filename="github-profile-snapshot.pdf" 
              userData={userData}
              repositories={repositories}
            />
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-border shadow-md animate-fade-in">
          <div className="flex flex-col space-y-4 p-6">
            <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
              Dashboard
            </a>
            <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
              Repositories
            </a>
            <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
              Activity
            </a>
            <a href="#" className="text-sm font-medium hover:text-github-blue transition-colors">
              About
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
