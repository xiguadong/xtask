import type { ReactNode } from 'react';

interface ShellProps {
  sidebar: ReactNode;
  main: ReactNode;
  rail?: ReactNode;
}

export function Shell({ sidebar, main, rail }: ShellProps) {
  return (
    <main className="mx-auto grid max-w-[1600px] gap-3 px-3 py-3 md:px-4 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
      <div>{sidebar}</div>
      <div>{main}</div>
      {rail ? <div>{rail}</div> : null}
    </main>
  );
}
