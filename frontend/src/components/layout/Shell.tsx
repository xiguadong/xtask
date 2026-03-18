import type { ReactNode } from 'react';

interface ShellProps {
  sidebar: ReactNode;
  main: ReactNode;
  rail?: ReactNode;
}

export default function Shell({ sidebar, main, rail }: ShellProps) {
  const layoutClassName = rail
    ? 'mx-auto grid max-w-[1600px] gap-3 px-3 py-3 md:px-4 lg:grid-cols-[220px_minmax(0,1fr)_280px]'
    : 'mx-auto grid max-w-[1600px] gap-3 px-3 py-3 md:px-4 lg:grid-cols-[240px_minmax(0,1fr)]';

  return (
    <main className={layoutClassName}>
      <div>{sidebar}</div>
      <div>{main}</div>
      {rail ? <div>{rail}</div> : null}
    </main>
  );
}
