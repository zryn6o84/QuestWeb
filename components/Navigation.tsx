import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavigationProps {
  mobile?: boolean;
  onClose?: () => void;
  isAuthenticated: boolean;
}

export default function Navigation({ mobile, onClose, isAuthenticated }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: '/quests', label: 'All Quests' },
    { href: '/quests/joined', label: 'My Quests' },
    { href: '/quests/create', label: 'Create Quest' },
  ];

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          "relative px-3 py-2 transition-colors hover:text-primary",
          mobile ? "block w-full text-left text-base" : "text-sm",
          isActive
            ? "text-primary font-medium"
            : "text-muted-foreground hover:text-primary"
        )}
      >
        {label}
        {isActive && (
          <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0" />
        )}
      </Link>
    );
  };

  return (
    <nav className={cn(
      "flex",
      mobile ? "flex-col space-y-2" : "items-center space-x-4"
    )}>
      {links.map((link) => (
        <NavLink key={link.href} {...link} />
      ))}
    </nav>
  );
}
