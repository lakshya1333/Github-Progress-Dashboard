import { GithubUser, Repository } from './types';

const escapeLatex = (text: string = ""): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

export const generateLatexDocument = (user: GithubUser, repositories: Repository[]): string => {
  const formattedDate = formatDate(new Date().toISOString());
  const joinDate = formatDate(user.created_at);
  const publicRepos = repositories.length;

  const topRepos = [...repositories]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map(repo => ({
      name: escapeLatex(repo.name),
      stars: repo.stargazers_count || 0,
      description: escapeLatex(repo.description) || 'No description available',
      language: escapeLatex(repo.language || 'Not specified')
    }));

  const totalStars = repositories.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);

  const starsBarLength = Math.min(Math.max(totalStars / 2, 0.5), 10);
  const forksBarLength = Math.min(Math.max(totalForks, 0.5), 10);

  return `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[a4paper, margin=0.8in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{fontawesome5}
\\usepackage{xcolor}
\\usepackage{titlesec}
\\usepackage[skins]{tcolorbox}
\\usepackage{fancyhdr}
\\usepackage{booktabs}
\\usepackage{pgf-pie}
\\usepackage{tikz}

\\definecolor{githubBlack}{HTML}{24292E}
\\definecolor{githubBlue}{HTML}{0366D6}
\\definecolor{githubGreen}{HTML}{28A745}
\\definecolor{githubPurple}{HTML}{6F42C1}
\\definecolor{githubYellow}{HTML}{DBAB09}
\\definecolor{githubGray}{HTML}{6A737D}

\\hypersetup{
  colorlinks=true,
  linkcolor=githubBlue,
  urlcolor=githubBlue,
  pdftitle={GitHub Profile: ${escapeLatex(user.name || user.username)}},
  pdfauthor={${escapeLatex(user.name || user.username)}}
}

\\titleformat{\\section}
  {\\normalfont\\Large\\bfseries\\color{githubBlue}}
  {\\thesection}
  {1em}
  {}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0.5pt}
\\renewcommand{\\footrulewidth}{0.5pt}
\\fancyhead[L]{\\textcolor{githubBlue}{GitHub Profile: ${escapeLatex(user.name || user.username)}}}
\\fancyhead[R]{\\textcolor{githubGray}{${formattedDate}}}
\\fancyfoot[C]{\\textcolor{githubGray}{Page \\thepage}}

\\begin{document}

\\begin{center}
  \\begin{tcolorbox}[
    enhanced,
    colback=githubBlue!5,
    colframe=githubBlue,
    width=\\textwidth,
    arc=4mm,
    boxrule=0.5pt,
    fonttitle=\\bfseries
  ]
    {\\LARGE\\textcolor{githubBlue}{\\faGithub\\ GitHub Profile: ${escapeLatex(user.name || user.username)}}}\\\\[0.3cm]
    {\\large\\textcolor{githubGray}{Generated on ${formattedDate}}}
  \\end{tcolorbox}
\\end{center}

\\section*{\\faUser\\ Profile Summary}
\\begin{tcolorbox}[
  enhanced,
  colback=white,
  colframe=githubBlue!70,
  arc=3mm,
  boxrule=0.5pt
]
  \\begin{minipage}[t]{0.65\\textwidth}
    \\begin{itemize}[leftmargin=*, itemsep=0.5em]
      \\item \\textbf{\\textcolor{githubBlue}{Username:}} ${escapeLatex(user.username)}
      \\item \\textbf{\\textcolor{githubBlue}{Name:}} ${escapeLatex(user.name || 'Not provided')}
      \\item \\textbf{\\textcolor{githubBlue}{Bio:}} ${escapeLatex(user.bio || 'Not provided')}
      \\item \\textbf{\\textcolor{githubBlue}{Location:}} ${escapeLatex(user.location || 'Not provided')}
      \\item \\textbf{\\textcolor{githubBlue}{Website:}} ${user.blog ? `\\href{${user.blog}}{${escapeLatex(user.blog)}}` : 'None'}
      \\item \\textbf{\\textcolor{githubBlue}{Member Since:}} ${joinDate}
    \\end{itemize}
  \\end{minipage}
  \\hfill
\\end{tcolorbox}

\\section*{\\faChartBar\\ Stats Overview}
\\begin{tcolorbox}[
  enhanced,
  colback=githubGreen!5,
  colframe=githubGreen,
  arc=3mm,
  boxrule=0.5pt
]
  \\centering
  \\begin{tabular}{lcc}
    \\toprule
    \\textbf{Metric} & \\textbf{Count} \\\\
    \\midrule
    Followers & ${user.followers} \\\\
    Following & ${user.following} \\\\
    Public Repositories & ${publicRepos} \\\\
    \\bottomrule
  \\end{tabular}
\\end{tcolorbox}

\\section*{\\faCode\\ Top Repositories}
\\begin{tcolorbox}[
  enhanced,
  colback=githubPurple!5,
  colframe=githubPurple,
  arc=3mm,
  boxrule=0.5pt
]
  \\begin{itemize}[leftmargin=*, itemsep=0.7em]
    ${topRepos.map(repo => `
    \\item \\textbf{\\textcolor{githubPurple}{${repo.name}}} (${repo.stars} \\faStar) - ${repo.description}\\\\
    \\textit{Language: ${repo.language}}
    `).join('')}
  \\end{itemize}
\\end{tcolorbox}


\\section*{\\faStar\\ GitHub Statistics}
\\begin{tcolorbox}[
  enhanced,
  colback=githubYellow!5,
  colframe=githubYellow,
  arc=3mm,
  boxrule=0.5pt
]
  \\centering
  \\begin{tabular}{lr}
    \\textbf{\\textcolor{githubYellow}{Total Stars Earned:}} & ${totalStars} \\\\
    \\textbf{\\textcolor{githubYellow}{Total Forks Earned:}} & ${totalForks} \\\\
  \\end{tabular}
  
  \\vspace{0.5cm}
  
  \\begin{tikzpicture}
    \\draw[thick, githubYellow] (0,0) -- (5,0);
    \\draw[fill=githubYellow!70, githubYellow] (0,0) rectangle (${starsBarLength},0.3);
    \\node[anchor=west] at (5.2,0.15) {${totalStars} stars};
  \\end{tikzpicture}
  
  \\begin{tikzpicture}
    \\draw[thick, githubGreen] (0,0) -- (5,0);
    \\draw[fill=githubGreen!70, githubGreen] (0,0) rectangle (${forksBarLength},0.3);
    \\node[anchor=west] at (5.2,0.15) {${totalForks} forks};
  \\end{tikzpicture}
\\end{tcolorbox}

\\vspace{1cm}
\\begin{center}
  \\begin{tcolorbox}[
    enhanced,
    colback=githubBlack!5,
    colframe=githubBlack,
    width=0.8\\textwidth,
    arc=3mm,
    boxrule=0.5pt
  ]
    \\small\\textit{This document was automatically generated from GitHub data.}\\\\
    \\small\\href{https://github.com/${user.username}}{\\textcolor{githubBlue}{\\faGithub\\ github.com/${user.username}}}
  \\end{tcolorbox}
\\end{center}

\\end{document}`;
};