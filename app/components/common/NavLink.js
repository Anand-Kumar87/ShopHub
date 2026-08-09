'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children, className = '', ...props }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`relative group inline-block transition-colors duration-300 py-1 ${isActive
          ? 'text-stone-900 font-bold'
          : 'text-stone-500 hover:text-stone-900'
        } ${className}`}
      {...props}
    >
      {children}

      {/* Ultra-Premium Animated Underline */}
      <span
        className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-stone-900 transform origin-left transition-transform duration-300 ease-out ${isActive
            ? 'scale-x-100'
            : 'scale-x-0 group-hover:scale-x-100'
          }`}
      ></span>
    </Link>
  );
}