import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GithubUser, GithubStats, Repository } from '../lib/types';
import { fetchRepositories, fetchUserDetails, getUserPullRequests, getUserStarsGiven, fetchAllCommits } from '../api/githubApi';
import Navbar from '../components/Navbar';
import ProfileHeader from '../components/ProfileHeader';
import StatCard from '../components/StatCard';
import CommitTimeline from '../components/CommitTimeline';
import RepositoryList from '../components/RepositoryList';
import LanguageChart from '../components/LanguageChart';
import CommitGraph from '../components/CommitGraph'; // Import CommitGraph
import { 
  GitCommit, 
  Folder, 
  ArrowUp 
} from 'lucide-react';


const Index = () => {
  const { data: user, isLoading: isUserLoading } = useQuery<GithubUser>({
    queryKey: ['githubUser'],
    queryFn: fetchUserDetails,
  });

  const { data: stats = {} as GithubStats, isLoading: isStatsLoading } = useQuery<GithubStats>({
    queryKey: ['githubStats'],
  });

  const { data: repositories = [], isLoading: isReposLoading } = useQuery<Repository[]>({
    queryKey: ['repositories'],
    queryFn: fetchRepositories,
  });

  const { data: pullRequests = 0, isLoading: isPullRequestsLoading } = useQuery<number>({
    queryKey: ['pullRequests'],
    queryFn: getUserPullRequests,
  });

  const { data: starsGiven = 0, isLoading: isStarsGivenLoading } = useQuery<number>({
    queryKey: ['starsGiven'],
    queryFn: getUserStarsGiven,
  });
  
  const { data: commits = [], isLoading: isCommitsLoading } = useQuery<Array<any>>({
    queryKey: ['commits'],
    queryFn: fetchAllCommits,
  });  

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [showScrollTop, setShowScrollTop] = useState(false);




  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const dashboardRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 flex flex-col">
<Navbar 
  userData={user} 
  repositories={repositories} 
  dashboardRef={dashboardRef} 
/>
      
      <main ref={dashboardRef} className="flex-1 container px-4 py-8">
        {/* Profile Section */}
        <section className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <ProfileHeader 
            user={user} 
            isLoading={isUserLoading} 
          />
        </section>
        
        {/* Stats Overview */}
        <section className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats ? (
              <StatCard 
                title="Pull Request" 
                value={pullRequests}
                icon={<GitCommit className="h-5 w-5" />}
                description="Last year"
                trend="up"
                trendValue="12%"
                isLoading={isPullRequestsLoading}
              />
            ) : (
              <p className="text-center text-muted-foreground">Stats not found</p>
            )}

            {stats ? (
              <StatCard 
                title="Issues" 
                value={pullRequests}
                icon={<GitCommit className="h-5 w-5" />}
                description="Last year"
                trend="up"
                trendValue="12%"
                isLoading={isPullRequestsLoading}
              />
            ) : (
              <p className="text-center text-muted-foreground">Stats not found</p>
            )}

            <StatCard 
              title="Public Repositories" 
              value={repositories.length}
              icon={<Folder className="h-5 w-5" />}
              description="Total"
              isLoading={isStatsLoading}
            />

            {stats ? (
              <StatCard 
                title="Star Given" 
                value={starsGiven}
                icon={<GitCommit className="h-5 w-5" />}
                description="Last year"
                trend="up"
                trendValue="12%"
                isLoading={isStarsGivenLoading}
              />
            ) : (
              <p className="text-center text-muted-foreground">Stats not found</p>
            )}

            {stats ? (
              <StatCard 
                title="Star Received" 
                value={repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)}
                icon={<GitCommit className="h-5 w-5" />}
                description="Last year"
                trend="up"
                trendValue="12%"
                isLoading={isStatsLoading}
              />
            ) : (
              <p className="text-center text-muted-foreground">Stats not found</p>
            )}
          </div>
        </section>
        
        {/* Commit Graph (Replacing Contribution Calendar) */}
        <section className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CommitGraph />
        </section>
        
        {/* Repositories and Activity */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="opacity-0 animate-slide-up bg-gray-100 dark:bg-gray-800 p-4 rounded-lg" style={{ animationDelay: '400ms' }}>
            <RepositoryList 
              repositories={repositories || []} 
              isLoading={isReposLoading} 
              className="h-full"
            />
          </div>
          
          <div className="opacity-0 animate-slide-up bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-y-auto h-96" style={{ animationDelay: '500ms' }}>
            {/* Scrollable commit timeline */}
            <CommitTimeline 
              commits={commits}
              isLoading={isCommitsLoading}
              className="h-full"
            />
          </div>
        </section>
        
        {/* Languages */}
        <section className="opacity-0 animate-slide-up" style={{ animationDelay: '600ms' }}>
          <LanguageChart 
            languages={stats?.topLanguages}
            isLoading={isStatsLoading}
          />
        </section>
        
      </main>

      
      {/* Footer */}
      <footer className="py-6 border-t dark:border-gray-700">
        <div className="container px-4 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
            GitHub Stats Dashboard • {new Date().getFullYear()}
          </p>
          <p className="text-sm text-muted-foreground">
            Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </footer>
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-2 rounded-full bg-primary text-primary-foreground shadow-md opacity-0 animate-fade-in hover:scale-110 transition-transform"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
