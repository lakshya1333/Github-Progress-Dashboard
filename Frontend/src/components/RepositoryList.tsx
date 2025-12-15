
import React from 'react';
import { Repository } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Star, GitFork, Circle, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface RepositoryListProps {
  repositories?: Repository[];
  isLoading?: boolean;
  className?: string;
}

const RepositoryList: React.FC<RepositoryListProps> = ({
  repositories = [],
  isLoading = false,
  className,
}) => {
  // Helper function to get language color
  const getLanguageColor = (language: string): string => {
    const colorMap: Record<string, string> = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Python: '#3572A5',
      Ruby: '#701516',
      Go: '#00ADD8',
      Java: '#b07219',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Rust: '#dea584',
      // Add more languages as needed
    };
    
    return colorMap[language] || '#8E9196'; // Default color
  };
  
  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 365) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    } else {
      const diffInYears = Math.floor(diffInDays / 365);
      return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
    }
  };
  

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Popular Repositories</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {repositories.map((repo, index) => (
              <div 
                key={repo.id} 
                className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200 opacity-0 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <a 
                    href={repo.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-github-blue font-medium hover:underline"
                  >
                    {repo.name}
                  </a>
                  <span className="text-xs text-muted-foreground">
                  Updated {formatRelativeTime(repo.updated_at)}
                  </span>
                </div>
                
                {repo.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {repo.description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <Circle 
                        className="h-3 w-3" 
                        fill={getLanguageColor(repo.language)} 
                        stroke="none" 
                      />
                      <span>{repo.language}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-github-gray" />
                    <span>{repo.stargazers_count.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <GitFork className="h-3.5 w-3.5 text-github-gray" />
                    <span>{repo.forks_count.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-github-gray" />
                    <span>{Math.floor(repo.stargazers_count * 4.2).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RepositoryList;
