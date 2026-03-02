import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

interface AnnouncementBannerProps {
  className?: string;
  scrollSpeed?: number; // pixels per second
}

export function AnnouncementBanner({
  className,
  scrollSpeed = 50 // default 50 pixels per second
}: AnnouncementBannerProps) {
  const { data: announcements, isLoading } = useAnnouncements();
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(20);

  const activeAnnouncements = useMemo(() => announcements || [], [announcements]);

  // Calculate animation duration based on content width and scroll speed
  useEffect(() => {
    if (contentRef.current) {
      const contentWidth = contentRef.current.scrollWidth / 2; // Divide by 2 since content is duplicated
      const duration = contentWidth / scrollSpeed;
      setAnimationDuration(duration);
    }
  }, [activeAnnouncements, scrollSpeed]);

  // Don't render if no announcements
  if (isLoading || activeAnnouncements.length === 0) {
    return null;
  }

  // Create the announcement content with separator
  const announcementContent = activeAnnouncements.map((announcement, idx) => (
    <span key={announcement.id} className="inline-flex items-center whitespace-nowrap">
      {announcement.linkUrl ? (
        <Link
          to={announcement.linkUrl}
          className="hover:underline"
        >
          {announcement.text}
        </Link>
      ) : (
        <span>{announcement.text}</span>
      )}
      {/* Separator between announcements */}
      {idx < activeAnnouncements.length - 1 && (
        <span className="mx-6 opacity-50">•</span>
      )}
    </span>
  ));

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-hidden text-sm mx-4",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Marquee container */}
      <div
        ref={contentRef}
        className="inline-flex whitespace-nowrap"
        style={{
          animationName: 'marquee',
          animationDuration: `${animationDuration}s`,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {/* First copy of content */}
        <div className="inline-flex items-center">
          {announcementContent}
          <span className="mx-6 opacity-50">•</span>
        </div>
        {/* Duplicate content for seamless loop */}
        <div className="inline-flex items-center">
          {announcementContent}
          <span className="mx-6 opacity-50">•</span>
        </div>
      </div>

      {/* CSS animation keyframes */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

