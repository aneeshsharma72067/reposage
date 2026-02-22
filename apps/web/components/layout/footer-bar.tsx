export function FooterBar() {
  return (
    <footer className="h-[52px] border-t border-surface400 bg-surface100 px-8">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between text-sm text-textMuted">
        <div className="flex items-center gap-6">
          <span>Documentation</span>
          <span>Security Policy</span>
          <span>Support</span>
        </div>
        <span className="font-mono text-xs">v1.0.4-stable</span>
      </div>
    </footer>
  );
}
