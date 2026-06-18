import React, { useState, useEffect } from "react";
import { Star, GitFork } from "lucide-react";
import Loader from "../ui/Loader";

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

const PINNED_REPOS_QUERY = `
  query($username: String!) {
    user(login: $username) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
            url
          }
        }
      }
    }
  }
`;

export const PinnedRepos = ({ githubUsername, accessToken }) => {
  const [pinnedRepos, setPinnedRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!githubUsername) return;

    const fetchPinnedRepos = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(GITHUB_GRAPHQL_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: PINNED_REPOS_QUERY,
            variables: { username: githubUsername },
          }),
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        const repos = result.data?.user?.pinnedItems?.nodes || [];
        setPinnedRepos(repos);
      } catch (err) {
        console.error("Error fetching pinned repos:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedRepos();
  }, [githubUsername, accessToken]);

  if (!githubUsername) return null;

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader type="skeleton" size="sm" text="Loading pinned repositories..." />
    </div>
  );

  if (error) return null;

  if (!pinnedRepos.length) return null;

  return (
    <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-md">
      <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-white my-0">
          Pinned Repositories
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Top repositories pinned on GitHub
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {pinnedRepos.map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20 hover:border-violet-500/30 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-base flex-shrink-0">
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.94a.75.75 0 001.5 0v-4.94l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {repo.name}
              </h4>
            </div>
            {repo.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed font-medium">
                {repo.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
              {repo.primaryLanguage && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: repo.primaryLanguage.color || "#8b5cf6" }}
                  />
                  {repo.primaryLanguage.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> {repo.stargazerCount}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5" /> {repo.forkCount}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PinnedRepos;
