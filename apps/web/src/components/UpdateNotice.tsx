import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/update-notice.css";

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
}

export default function UpdateNotice() {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVersion = import.meta.env.VITE_APP_VERSION || "0.1.0";

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api.github.com/repos/RealHartlMax/Open-Movie-planer/releases"
        );
        if (!response.ok) throw new Error("Failed to fetch releases");

        const data: Release[] = await response.json();

        // Sort by published_at descending (newest first)
        data.sort(
          (a, b) =>
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
        );

        setReleases(data);

        // Check if there's a newer version
        const latestRelease = data[0];
        if (latestRelease && isNewerVersion(latestRelease.tag_name)) {
          setShowModal(true);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to check for updates"
        );
      } finally {
        setLoading(false);
      }
    };

    checkForUpdates();
  }, []);

  const isNewerVersion = (latestTag: string): boolean => {
    const parseVersion = (v: string) => {
      const match = v.match(/v?(\d+)\.(\d+)\.(\d+)/);
      if (!match) return [0, 0, 0];
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    };

    const [curMajor, curMinor, curPatch] = parseVersion(currentVersion);
    const [latestMajor, latestMinor, latestPatch] = parseVersion(latestTag);

    if (latestMajor !== curMajor) return latestMajor > curMajor;
    if (latestMinor !== curMinor) return latestMinor > curMinor;
    return latestPatch > curPatch;
  };

  if (!showModal) return null;

  return (
    <div className="update-notice-overlay">
      <div className="update-notice-modal">
        <div className="update-notice-header">
          <h2>{t("updateNotice.title")}</h2>
          <button
            className="update-notice-close"
            onClick={() => setShowModal(false)}
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <div className="update-notice-content">
          {error && <p className="update-notice-error">{error}</p>}
          {loading && <p className="update-notice-loading">{t("common.loading")}</p>}

          {!loading && !error && releases.length > 0 && (
            <div className="update-notice-releases">
              {releases.map((release) => (
                <div key={release.tag_name} className="update-notice-release">
                  <div className="release-header">
                    <h3>{release.name || release.tag_name}</h3>
                    <span className="release-date">
                      {new Date(release.published_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="release-body">
                    {release.body ? (
                      // Simple markdown-like rendering
                      <div>
                        {release.body.split("\n").map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p>{t("updateNotice.noChangelog")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="update-notice-footer">
          <a
            href="https://github.com/RealHartlMax/Open-Movie-planer/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="update-notice-button update-notice-button-primary"
          >
            {t("updateNotice.downloadNow")}
          </a>
          <button
            className="update-notice-button update-notice-button-secondary"
            onClick={() => setShowModal(false)}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
