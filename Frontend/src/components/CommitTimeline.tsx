import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { GitCommit } from 'lucide-react';
import { cn } from '../lib/utils';

interface CommitTimelineProps {
  commits?: Array<{ 
    repo: string;
    user_id: number;
    message: string;
    url: string;
    datee: string;
  }>;
  isLoading?: boolean;
  className?: string;
}

const CommitTimeline: React.FC<CommitTimelineProps> = ({
  commits = [],
  isLoading = false,
  className,
}) => {
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
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold">Recent Commits</CardTitle>
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {commits.map((commit, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:shadow-sm transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-github-blue font-medium hover:underline"
                  >
                    {commit.user_id || 'Unknown User'}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(commit.datee)}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{commit.message}</p>

                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <GitCommit className="h-3.5 w-3.5 text-github-gray" />
                    <span>Repo: {commit.repo}</span>
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

export default CommitTimeline;
